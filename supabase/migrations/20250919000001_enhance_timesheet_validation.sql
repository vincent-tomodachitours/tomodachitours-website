-- Enhanced validation and constraints for timesheet system
-- Implements server-side validation as per requirement 6.2, 6.3

-- Add additional constraints for data integrity
ALTER TABLE timesheets 
ADD CONSTRAINT check_todo_length 
CHECK (todo IS NULL OR LENGTH(todo) <= 500);

ALTER TABLE timesheets 
ADD CONSTRAINT check_note_length 
CHECK (note IS NULL OR LENGTH(note) <= 1000);

-- Ensure clock_in is not in the future (with small tolerance for clock skew)
ALTER TABLE timesheets 
ADD CONSTRAINT check_clock_in_not_future 
CHECK (clock_in <= NOW() + INTERVAL '5 minutes');

-- Ensure clock_out is not in the future (with small tolerance for clock skew)
ALTER TABLE timesheets 
ADD CONSTRAINT check_clock_out_not_future 
CHECK (clock_out IS NULL OR clock_out <= NOW() + INTERVAL '5 minutes');

-- Prevent extremely old clock_in times (more than 30 days ago)
ALTER TABLE timesheets 
ADD CONSTRAINT check_clock_in_not_too_old 
CHECK (clock_in >= NOW() - INTERVAL '30 days');

-- Prevent shifts longer than 24 hours
ALTER TABLE timesheets 
ADD CONSTRAINT check_reasonable_shift_duration 
CHECK (clock_out IS NULL OR clock_out <= clock_in + INTERVAL '24 hours');

-- Enhanced validation function with better error messages
CREATE OR REPLACE FUNCTION validate_timesheet_operation(
    p_employee_id UUID,
    p_operation TEXT,
    p_timesheet_id UUID DEFAULT NULL,
    p_todo TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely clock in with validation
CREATE OR REPLACE FUNCTION safe_clock_in(
    p_employee_id UUID,
    p_todo TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    new_timesheet_id UUID;
BEGIN
    -- Validate the operation
    PERFORM validate_timesheet_operation(p_employee_id, 'clock_in', NULL, p_todo, NULL);
    
    -- Insert new timesheet
    INSERT INTO timesheets (employee_id, clock_in, todo)
    VALUES (p_employee_id, NOW(), p_todo)
    RETURNING id INTO new_timesheet_id;
    
    -- Log the operation
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
    
    RETURN new_timesheet_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely clock out with validation
CREATE OR REPLACE FUNCTION safe_clock_out(
    p_timesheet_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $
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
    
    -- Log the operation
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
    
    RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect and resolve timesheet conflicts
CREATE OR REPLACE FUNCTION resolve_timesheet_conflicts(p_employee_id UUID)
RETURNS TABLE (
    conflict_type TEXT,
    timesheet_id UUID,
    resolution TEXT
) AS $
DECLARE
    active_count INTEGER;
    oldest_active RECORD;
BEGIN
    -- Count active timesheets
    SELECT COUNT(*) INTO active_count
    FROM timesheets 
    WHERE employee_id = p_employee_id AND clock_out IS NULL;
    
    -- If multiple active timesheets, keep the oldest and mark others as resolved
    IF active_count > 1 THEN
        -- Get the oldest active timesheet
        SELECT id, clock_in INTO oldest_active
        FROM timesheets 
        WHERE employee_id = p_employee_id AND clock_out IS NULL
        ORDER BY clock_in ASC
        LIMIT 1;
        
        -- Auto-close newer duplicate timesheets
        UPDATE timesheets 
        SET 
            clock_out = clock_in + INTERVAL '1 minute',
            note = COALESCE(note, '') || ' [Auto-resolved duplicate timesheet]',
            updated_at = NOW()
        WHERE employee_id = p_employee_id 
        AND clock_out IS NULL 
        AND id != oldest_active.id;
        
        -- Return conflict information
        RETURN QUERY
        SELECT 
            'multiple_active'::TEXT as conflict_type,
            oldest_active.id as timesheet_id,
            'Kept oldest active timesheet, auto-closed duplicates'::TEXT as resolution;
    END IF;
    
    -- Check for very old active timesheets (more than 24 hours)
    FOR oldest_active IN 
        SELECT id, clock_in 
        FROM timesheets 
        WHERE employee_id = p_employee_id 
        AND clock_out IS NULL 
        AND clock_in < NOW() - INTERVAL '24 hours'
    LOOP
        -- Auto-close very old timesheets
        UPDATE timesheets 
        SET 
            clock_out = clock_in + INTERVAL '8 hours', -- Assume 8-hour shift
            note = COALESCE(note, '') || ' [Auto-resolved: timesheet was left open for more than 24 hours]',
            updated_at = NOW()
        WHERE id = oldest_active.id;
        
        RETURN QUERY
        SELECT 
            'stale_timesheet'::TEXT as conflict_type,
            oldest_active.id as timesheet_id,
            'Auto-closed stale timesheet with 8-hour duration'::TEXT as resolution;
    END LOOP;
    
    RETURN;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate timesheet data integrity
CREATE OR REPLACE FUNCTION validate_timesheet_integrity()
RETURNS TABLE (
    issue_type TEXT,
    timesheet_id UUID,
    employee_id UUID,
    description TEXT,
    suggested_fix TEXT
) AS $
BEGIN
    -- Find timesheets with clock_out before clock_in
    RETURN QUERY
    SELECT 
        'invalid_duration'::TEXT as issue_type,
        t.id as timesheet_id,
        t.employee_id,
        'Clock out time is before or equal to clock in time'::TEXT as description,
        'Manually correct the times or delete the invalid record'::TEXT as suggested_fix
    FROM timesheets t
    WHERE t.clock_out IS NOT NULL AND t.clock_out <= t.clock_in;
    
    -- Find timesheets with unreasonably long durations (more than 24 hours)
    RETURN QUERY
    SELECT 
        'excessive_duration'::TEXT as issue_type,
        t.id as timesheet_id,
        t.employee_id,
        'Shift duration exceeds 24 hours: ' || 
        EXTRACT(EPOCH FROM (t.clock_out - t.clock_in)) / 3600 || ' hours'::TEXT as description,
        'Verify times are correct or split into multiple shifts'::TEXT as suggested_fix
    FROM timesheets t
    WHERE t.clock_out IS NOT NULL 
    AND t.clock_out > t.clock_in + INTERVAL '24 hours';
    
    -- Find employees with multiple active timesheets
    RETURN QUERY
    SELECT 
        'multiple_active'::TEXT as issue_type,
        t.id as timesheet_id,
        t.employee_id,
        'Employee has multiple active timesheets'::TEXT as description,
        'Use resolve_timesheet_conflicts() function to fix'::TEXT as suggested_fix
    FROM timesheets t
    WHERE t.clock_out IS NULL
    AND EXISTS (
        SELECT 1 FROM timesheets t2 
        WHERE t2.employee_id = t.employee_id 
        AND t2.clock_out IS NULL 
        AND t2.id != t.id
    );
    
    -- Find timesheets with invalid text lengths
    RETURN QUERY
    SELECT 
        'invalid_text_length'::TEXT as issue_type,
        t.id as timesheet_id,
        t.employee_id,
        CASE 
            WHEN LENGTH(t.todo) > 500 THEN 'Todo text exceeds 500 characters'
            WHEN LENGTH(t.note) > 1000 THEN 'Note text exceeds 1000 characters'
        END as description,
        'Truncate the text to fit within limits'::TEXT as suggested_fix
    FROM timesheets t
    WHERE (t.todo IS NOT NULL AND LENGTH(t.todo) > 500)
    OR (t.note IS NOT NULL AND LENGTH(t.note) > 1000);
    
    RETURN;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically resolve conflicts on insert/update
CREATE OR REPLACE FUNCTION trigger_resolve_timesheet_conflicts()
RETURNS TRIGGER AS $
BEGIN
    -- Only run for INSERT operations that create active timesheets
    IF TG_OP = 'INSERT' AND NEW.clock_out IS NULL THEN
        -- Check if this creates a conflict and resolve it
        PERFORM resolve_timesheet_conflicts(NEW.employee_id);
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS resolve_conflicts_trigger ON timesheets;
CREATE TRIGGER resolve_conflicts_trigger
    AFTER INSERT ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_resolve_timesheet_conflicts();

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION safe_clock_in TO authenticated;
GRANT EXECUTE ON FUNCTION safe_clock_out TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_timesheet_conflicts TO authenticated;
GRANT EXECUTE ON FUNCTION validate_timesheet_integrity TO authenticated;

-- Create indexes for performance with validation queries
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_active 
ON timesheets(employee_id) WHERE clock_out IS NULL;

CREATE INDEX IF NOT EXISTS idx_timesheets_stale 
ON timesheets(employee_id, clock_in) WHERE clock_out IS NULL;

-- Add comments for documentation
COMMENT ON FUNCTION validate_timesheet_operation IS 'Validates timesheet operations with detailed error messages';
COMMENT ON FUNCTION safe_clock_in IS 'Safely clock in with validation and logging';
COMMENT ON FUNCTION safe_clock_out IS 'Safely clock out with validation and logging';
COMMENT ON FUNCTION resolve_timesheet_conflicts IS 'Automatically resolve timesheet conflicts';
COMMENT ON FUNCTION validate_timesheet_integrity IS 'Check timesheet data integrity and suggest fixes';