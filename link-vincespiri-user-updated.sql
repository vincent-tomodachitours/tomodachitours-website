-- Link vincespiri@yahoo.com auth user to employee record
-- UPDATED User ID: c77a7b08-1bb7-4840-860d-8efd31819e9e

BEGIN;

-- First, let's check if this user already exists in employees table
DO $$
DECLARE
    existing_employee_id TEXT;
BEGIN
    -- Check if employee already exists
    SELECT id INTO existing_employee_id 
    FROM employees 
    WHERE user_id = 'c77a7b08-1bb7-4840-860d-8efd31819e9e' OR email = 'vincespiri@yahoo.com';
    
    IF existing_employee_id IS NOT NULL THEN
        RAISE NOTICE 'Employee already exists with ID: %', existing_employee_id;
    ELSE
        -- Insert new employee record
        INSERT INTO employees (
            id,
            user_id,
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            role,
            status,
            hire_date,
            emergency_contact,
            certifications,
            languages,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'c77a7b08-1bb7-4840-860d-8efd31819e9e',
            'ADM002',  -- Admin code
            'Vince',   -- Update with actual first name
            'Spiri',   -- Update with actual last name
            'vincespiri@yahoo.com',
            NULL,      -- Add phone if available
            'admin',   -- Set as admin role
            'active',
            CURRENT_DATE,
            NULL,      -- Add emergency contact if needed
            ARRAY[]::TEXT[],  -- Add certifications if needed
            ARRAY['English']::TEXT[],  -- Add languages
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Employee record created successfully for vincespiri@yahoo.com';
    END IF;
END $$;

-- Verify the employee was created/linked correctly
SELECT 
    id,
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    created_at
FROM employees 
WHERE user_id = 'c77a7b08-1bb7-4840-860d-8efd31819e9e' OR email = 'vincespiri@yahoo.com';

COMMIT; 