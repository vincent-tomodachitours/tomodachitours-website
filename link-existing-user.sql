-- =====================================================
-- Link Existing User to Admin Employee Record
-- =====================================================
-- This will create an admin employee record for spirivincent03@gmail.com

-- First, check if this user already has an employee record
SELECT 'Current employee records:' as info;
SELECT email, role, user_id FROM employees;

-- Create admin employee record for the existing user
INSERT INTO employees (
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    role,
    status,
    hire_date,
    languages
) VALUES (
    '254213bb-d1b5-46a5-93c4-addd9fc7c328',  -- Your actual user ID from the console
    'ADMIN002',
    'Admin',
    'User',
    'spirivincent03@gmail.com',
    '+81-90-1234-5678',
    'admin',
    'active',
    CURRENT_DATE,
    '{"en","ja"}'
) ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Verify the record was created/updated
SELECT 'Employee record created/updated:' as status;
SELECT 
    id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    user_id,
    CASE 
        WHEN user_id IS NOT NULL THEN '✅ LINKED TO AUTH USER'
        ELSE '❌ NO AUTH USER LINKED'
    END as auth_status
FROM employees 
WHERE email = 'spirivincent03@gmail.com'; 