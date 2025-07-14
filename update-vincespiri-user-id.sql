-- Update existing vincespiri@yahoo.com employee record with correct user_id
-- Current User ID: c77a7b08-1bb7-4840-860d-8efd31819e9e

BEGIN;

-- First, let's see the current state of the employee record
SELECT 
    id,
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status
FROM employees 
WHERE email = 'vincespiri@yahoo.com';

-- Update the existing employee record with the correct user_id
UPDATE employees 
SET 
    user_id = 'c77a7b08-1bb7-4840-860d-8efd31819e9e',
    updated_at = NOW()
WHERE email = 'vincespiri@yahoo.com';

-- Verify the update was successful
SELECT 
    id,
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    updated_at
FROM employees 
WHERE email = 'vincespiri@yahoo.com';

COMMIT; 