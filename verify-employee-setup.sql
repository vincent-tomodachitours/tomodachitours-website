-- =====================================================
-- Verify Employee Setup
-- =====================================================
-- Run this to check if your employee record is properly set up

-- 1. Check if the employee record exists
SELECT 'Checking employee record for spirivincent03@gmail.com:' as status;

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
        WHEN user_id = '254213bb-d1b5-46a5-93c4-addd9fc7c328' THEN '✅ CORRECTLY LINKED'
        WHEN user_id IS NOT NULL THEN '⚠️ LINKED TO DIFFERENT USER'
        ELSE '❌ NOT LINKED'
    END as link_status,
    created_at
FROM employees 
WHERE email = 'spirivincent03@gmail.com';

-- 2. Check all employee records
SELECT 'All employee records:' as info;
SELECT 
    email, 
    role, 
    status,
    CASE WHEN user_id IS NOT NULL THEN '✅' ELSE '❌' END as has_user_id
FROM employees;

-- 3. Check RLS policies
SELECT 'RLS Policies on employees table:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'employees';

-- 4. Test employee query (this simulates what the app does)
SELECT 'Testing employee query with your user ID:' as test;
SELECT 
    id, email, role, status, first_name, last_name
FROM employees 
WHERE user_id = '254213bb-d1b5-46a5-93c4-addd9fc7c328' 
AND status = 'active';

-- 5. If no record found, create it
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE email = 'spirivincent03@gmail.com' 
        AND user_id = '254213bb-d1b5-46a5-93c4-addd9fc7c328'
    ) THEN
        -- Delete any existing record with this email first
        DELETE FROM employees WHERE email = 'spirivincent03@gmail.com';
        
        -- Create the proper record
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
            '254213bb-d1b5-46a5-93c4-addd9fc7c328',
            'ADMIN002',
            'Admin',
            'User',
            'spirivincent03@gmail.com',
            '+81-90-1234-5678',
            'admin',
            'active',
            CURRENT_DATE,
            '{"en","ja"}'
        );
        
        RAISE NOTICE '✅ Employee record created successfully';
    ELSE
        RAISE NOTICE '✅ Employee record already exists and is properly linked';
    END IF;
END $$;

-- 6. Final verification
SELECT 'Final verification:' as final_check;
SELECT 
    email,
    role,
    status,
    user_id,
    '✅ READY FOR LOGIN' as result
FROM employees 
WHERE email = 'spirivincent03@gmail.com' 
AND user_id = '254213bb-d1b5-46a5-93c4-addd9fc7c328'
AND status = 'active'; 