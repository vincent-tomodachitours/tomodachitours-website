-- Create timesheets table for employee clock in/out tracking
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    todo TEXT,
    clock_out TIMESTAMP WITH TIME ZONE,
    note TEXT,
    hours_worked DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN clock_out IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
            ELSE NULL
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX idx_timesheets_clock_in ON timesheets(clock_in);
CREATE INDEX idx_timesheets_clock_out ON timesheets(clock_out);
CREATE INDEX idx_timesheets_created_at ON timesheets(created_at);

-- Create partial index for active timesheets (clocked in but not out)
CREATE INDEX idx_timesheets_active ON timesheets(employee_id, clock_in) 
WHERE clock_out IS NULL;

-- Add constraints
ALTER TABLE timesheets 
ADD CONSTRAINT check_clock_out_after_clock_in 
CHECK (clock_out IS NULL OR clock_out > clock_in);

-- Ensure only one active timesheet per employee
CREATE UNIQUE INDEX idx_timesheets_one_active_per_employee 
ON timesheets(employee_id) 
WHERE clock_out IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_timesheets_updated_at 
    BEFORE UPDATE ON timesheets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Employees can view and manage their own timesheets
CREATE POLICY "employees_own_timesheets" ON timesheets
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Managers and admins can view all timesheets
CREATE POLICY "managers_all_timesheets" ON timesheets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND status = 'active'
        )
    );

-- RLS Policy: Managers and admins can update timesheets (for corrections)
CREATE POLICY "managers_update_timesheets" ON timesheets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND status = 'active'
        )
    );

-- Database function to validate timesheet operations
CREATE OR REPLACE FUNCTION validate_timesheet_operation(
    p_employee_id UUID,
    p_operation TEXT,
    p_timesheet_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    active_timesheet_count INTEGER;
    employee_status TEXT;
BEGIN
    -- Check if employee exists and is active
    SELECT status INTO employee_status 
    FROM employees 
    WHERE id = p_employee_id;
    
    IF employee_status IS NULL THEN
        RAISE EXCEPTION 'Employee not found';
    END IF;
    
    IF employee_status != 'active' THEN
        RAISE EXCEPTION 'Employee is not active';
    END IF;
    
    -- Count active timesheets for this employee
    SELECT COUNT(*) INTO active_timesheet_count
    FROM timesheets 
    WHERE employee_id = p_employee_id AND clock_out IS NULL;
    
    -- Validate clock in operation
    IF p_operation = 'clock_in' THEN
        IF active_timesheet_count > 0 THEN
            RAISE EXCEPTION 'Employee is already clocked in';
        END IF;
        RETURN TRUE;
    END IF;
    
    -- Validate clock out operation
    IF p_operation = 'clock_out' THEN
        IF active_timesheet_count = 0 THEN
            RAISE EXCEPTION 'Employee is not currently clocked in';
        END IF;
        
        -- Verify the timesheet belongs to the employee
        IF p_timesheet_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM timesheets 
                WHERE id = p_timesheet_id 
                AND employee_id = p_employee_id 
                AND clock_out IS NULL
            ) THEN
                RAISE EXCEPTION 'Invalid timesheet for clock out operation';
            END IF;
        END IF;
        
        RETURN TRUE;
    END IF;
    
    RAISE EXCEPTION 'Invalid operation: %', p_operation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database function to calculate payroll summary
CREATE OR REPLACE FUNCTION get_payroll_summary(
    p_employee_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    month INTEGER,
    year INTEGER,
    total_hours DECIMAL,
    total_shifts INTEGER,
    average_shift_length DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        p_month,
        p_year,
        COALESCE(SUM(t.hours_worked), 0) as total_hours,
        COUNT(t.id)::INTEGER as total_shifts,
        COALESCE(AVG(t.hours_worked), 0) as average_shift_length
    FROM employees e
    LEFT JOIN timesheets t ON e.id = t.employee_id
        AND EXTRACT(MONTH FROM t.clock_in) = p_month
        AND EXTRACT(YEAR FROM t.clock_in) = p_year
        AND t.clock_out IS NOT NULL  -- Only completed shifts
    WHERE e.id = p_employee_id
    GROUP BY e.id, e.first_name, e.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database function to get current active timesheet for an employee
CREATE OR REPLACE FUNCTION get_current_timesheet(p_employee_id UUID)
RETURNS TABLE (
    id UUID,
    employee_id UUID,
    clock_in TIMESTAMP WITH TIME ZONE,
    todo TEXT,
    duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.employee_id,
        t.clock_in,
        t.todo,
        EXTRACT(EPOCH FROM (NOW() - t.clock_in))::INTEGER / 60 as duration_minutes
    FROM timesheets t
    WHERE t.employee_id = p_employee_id 
    AND t.clock_out IS NULL
    ORDER BY t.clock_in DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON timesheets TO authenticated;
GRANT EXECUTE ON FUNCTION validate_timesheet_operation TO authenticated;
GRANT EXECUTE ON FUNCTION get_payroll_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_timesheet TO authenticated;