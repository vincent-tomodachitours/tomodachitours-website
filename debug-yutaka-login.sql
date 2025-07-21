-- =====================================================
-- Debug Login Issues for yutaka.m@tomodachitours.com
-- =====================================================

-- Step 1: Check Supabase auth user status
SELECT 'Checking Supabase auth user status:' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ EMAIL CONFIRMED'
        ELSE '❌ EMAIL NOT CONFIRMED - THIS WILL BLOCK LOGIN'
    END as email_status,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN '✅ HAS SIGNED IN BEFORE'
        ELSE '⚠️ NEVER SIGNED IN'
    END as signin_status
FROM auth.users 
WHERE email = 'yutaka.m@tomodachitours.com';

-- Step 2: Check employee record details
SELECT 'Checking employee record:' as info;
SELECT 
    e.id as employee_id,
    e.user_id,
    e.email,
    e.role,
    e.status,
    e.first_name,
    e.last_name,
    u.email_confirmed_at,
    CASE 
        WHEN e.user_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ PROPERLY LINKED'
        WHEN e.user_id IS NOT NULL AND u.id IS NULL THEN '❌ LINKED TO NON-EXISTENT USER'
        ELSE '❌ NOT LINKED TO AUTH USER'
    END as link_status
FROM employees e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE e.email = 'yutaka.m@tomodachitours.com';

-- Step 3: Check RLS policies that might block authentication
SELECT 'Current RLS policies on employees table:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY policyname;

-- Step 4: Test the exact query the admin auth system uses
SELECT 'Testing admin auth system query:' as test;
-- This simulates what the AdminAuthContext does
SELECT 
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
FROM employees 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'yutaka.m@tomodachitours.com'
)
AND status = 'active';

-- Step 5: Check if there are any conflicting records
SELECT 'Checking for duplicate/conflicting records:' as check;
SELECT 
    email,
    COUNT(*) as record_count,
    array_agg(role) as roles,
    array_agg(status) as statuses
FROM employees 
WHERE email = 'yutaka.m@tomodachitours.com'
GROUP BY email;

-- =====================================================
-- FIXES TO TRY
-- =====================================================

-- Fix 1: Confirm email if not confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'yutaka.m@tomodachitours.com' 
AND email_confirmed_at IS NULL;

-- Fix 2: Ensure RLS policies allow tour guide authentication
-- Drop and recreate problematic policies if needed
DROP POLICY IF EXISTS "employees_read_own_data" ON employees;
DROP POLICY IF EXISTS "authenticated_users_read" ON employees;

-- Create simple policy that allows authenticated users to read employee data
CREATE POLICY "allow_authenticated_employee_read" ON employees
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Create policy for users to read their own employee data
CREATE POLICY "employees_read_own_record" ON employees
    FOR SELECT 
    USING (user_id = auth.uid());

-- Step 6: Final verification after fixes
SELECT 'Final verification after fixes:' as final_check;
SELECT 
    u.email,
    u.email_confirmed_at,
    e.role,
    e.status,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL 
        AND e.status = 'active' 
        AND e.user_id = u.id 
        THEN '✅ SHOULD BE ABLE TO LOGIN NOW'
        ELSE '❌ STILL HAS ISSUES'
    END as login_ready_status
FROM auth.users u
JOIN employees e ON u.id = e.user_id
WHERE u.email = 'yutaka.m@tomodachitours.com'; 