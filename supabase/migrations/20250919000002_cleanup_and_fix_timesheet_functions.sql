-- Cleanup and fix timesheet functions
-- This script removes duplicate functions and creates the correct ones

-- Drop all existing versions of the validate_timesheet_operation function
DROP FUNCTION IF EXISTS validate_timesheet_operation(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS validate_timesheet_operation(UUID, TEXT, UUID, TEXT, TEXT);

-- Drop other functions that might have duplicates
DROP FUNCTION IF EXISTS safe_clock_in(UUID, TEXT);
DROP FUNCTION IF EXISTS safe_clock_out(UUID, TEXT);
DROP FUNCTION IF EXISTS resolve_timesheet_conflicts(UUID);
DROP FUNCTION IF EXISTS validate_timesheet_integrity();
DROP FUNCTION IF EXISTS trigger_resolve_timesheet_conflicts();

-- Now create the correct functions with proper syntax

-- Enhanced validation function with better error messages
CREATE OR REPLACE FUNCTION validate_timesheet_operation(
    p_employee_id UUID,
    p_operation TEXT,
    p_timesheet_id UUID DEFAULT NULL,
    p_todo TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    active_timesheet_count INTEGER;
    employee_record RECORD;
    existing_timesheet RECORD;
BEGIN
    -- Check if employee exists and get details
    SELECT id, status, first_name, last_name, role 
    INTO employee_record
    FROM employees 
    WHERE id = p_employee_id;
    
    IF employee_record.id IS NULL THEN
        RAISE EXCEPTION 'Employee with ID % not found', p_employee_id;
    END IF;
    
    IF employee_record.status != 'active' THEN
        RAISE EXCEPTION 'Employee % % is not active (status: %)', 
            employee_record.first_name, employee_record.last_name, employee_record.status;
    END IF;
    
    -- Validate text inputs
    IF p_todo IS NOT NULL AND LENGTH(p_todo) > 500 THEN
        RAISE EXCEPTION 'Todo text cannot exceed 500 characters (current: %)', LENGTH(p_todo);
    END IF;
    
    IF p_note IS NOT NULL AND LENGTH(p_note) > 1000 THEN
        RAISE EXCEPTION 'Note text cannot exceed 1000 characters (current: %)', LENGTH(p_note);
    END IF;
    
    -- Count active timesheets for this employee
    SELECT COUNT(*) INTO active_timesheet_count
    FROM timesheets 
    WHERE employee_id = p_employee_id AND clock_out IS NULL;
    
    -- Validate clock in operation
    IF p_operation = 'clock_in' THEN
        IF active_timesheet_count > 0 THEN
            RAISE EXCEPTION 'Employee % % is already clocked in. Please clock out first before clocking in again.', 
                employee_record.first_name, employee_record.last_name;
        END IF;
        
        -- Check for recent clock out (prevent rapid clock in/out)
        IF EXISTS (
            SELECT 1 FROM timesheets 
            WHERE employee_id = p_employee_id 
            AND clock_out IS NOT NULL 
            AND clock_out > NOW() - INTERVAL '1 minute'
        ) THEN
            RAISE EXCEPTION 'Please wait at least 1 minute after clocking out before clocking in again';
        END IF;
        
        RETURN TRUE;
    END IF;
    
    -- Validate clock out operation
    IF p_operation = 'clock_out' THEN
        IF active_timesheet_count = 0 THEN
            RAISE EXCEPTION 'Employee % % is not currently clocked in. Please clock in first before trying to clock out.', 
                employee_record.first_name, employee_record.last_name;
        END IF;
        
        -- Verify the timesheet belongs to the employee and get details
        IF p_timesheet_id IS NOT NULL THEN
            SELECT id, clock_in, employee_id 
            INTO existing_timesheet
            FROM timesheets 
            WHERE id = p_timesheet_id 
            AND employee_id = p_employee_id 
            AND clock_out IS NULL;
            
            IF existing_timesheet.id IS NULL THEN
                RAISE EXCEPTION 'Invalid timesheet for clock out operation. The timesheet may have already been completed or does not belong to this employee.';
            END IF;
            
            -- Check minimum shift duration (prevent accidental immediate clock out)
            IF existing_timesheet.clock_in > NOW() - INTERVAL '30 seconds' THEN
                RAISE EXCEPTION 'Shift duration is too short. Please wait at least 30 seconds after clocking in before clocking out.';
            END IF;
        END IF;
        
        RETURN TRUE;
    END IF;
    
    RAISE EXCEPTION 'Invalid operation: %. Supported operations are: clock_in, clock_out', p_operation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely clock in with validation
CREATE OR REPLACE FUNCTION safe_clock_in(
    p_employee_id UUID,
    p_todo TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_timesheet_id UUID;
BEGIN
    -- Validate the operation
    PERFORM validate_timesheet_operation(p_employee_id, 'clock_in', NULL, p_todo, NULL);
    
    -- Insert new timesheet
    INSERT INTO timesheets (employee_id, clock_in, todo)
    VALUES (p_employee_id, NOW(), p_todo)
    RETURNING id INTO new_timesheet_id;
    
    -- Log the operation (only if admin_activity_logs table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_activity_logs') THEN
        INSERT INTO admin_activity_logs (
            admin_id, 
            action_type, 
            entity_type, 
            entity_id, 
            details
        ) VALUES (
            p_employee_id,
            'clock_in',
            'timesheet',
            new_timesheet_id::TEXT,
            jsonb_build_object(
                'todo', p_todo,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN new_timesheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely clock out with validation
CREATE OR REPLACE FUNCTION safe_clock_out(
    p_timesheet_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    timesheet_record RECORD;
    calculated_hours DECIMAL;
BEGIN
    -- Get timesheet details
    SELECT id, employee_id, clock_in 
    INTO timesheet_record
    FROM timesheets 
    WHERE id = p_timesheet_id AND clock_out IS NULL;
    
    IF timesheet_record.id IS NULL THEN
        RAISE EXCEPTION 'Active timesheet with ID % not found', p_timesheet_id;
    END IF;
    
    -- Validate the operation
    PERFORM validate_timesheet_operation(
        timesheet_record.employee_id, 
        'clock_out', 
        p_timesheet_id, 
        NULL, 
        p_note
    );
    
    -- Update timesheet with clock out
    UPDATE timesheets 
    SET 
        clock_out = NOW(),
        note = p_note,
        updated_at = NOW()
    WHERE id = p_timesheet_id;
    
    -- Calculate hours for logging
    SELECT EXTRACT(EPOCH FROM (NOW() - timesheet_record.clock_in)) / 3600 
    INTO calculated_hours;
    
    -- Log the operation (only if admin_activity_logs table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_activity_logs') THEN
        INSERT INTO admin_activity_logs (
            admin_id, 
            action_type, 
            entity_type, 
            entity_id, 
            details
        ) VALUES (
            timesheet_record.employee_id,
            'clock_out',
            'timesheet',
            p_timesheet_id::TEXT,
            jsonb_build_object(
                'note', p_note,
                'hours_worked', calculated_hours,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION validate_timesheet_operation TO authenticated;
GRANT EXECUTE ON FUNCTION safe_clock_in TO authenticated;
GRANT EXECUTE ON FUNCTION safe_clock_out TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION validate_timesheet_operation IS 'Validates timesheet operations with detailed error messages';
COMMENT ON FUNCTION safe_clock_in IS 'Safely clock in with validation and logging';
COMMENT ON FUNCTION safe_clock_out IS 'Safely clock out with validation and logging';