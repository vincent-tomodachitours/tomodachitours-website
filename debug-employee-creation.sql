-- =====================================================
-- Debug Employee Creation Issue
-- =====================================================
-- This script will help identify and fix employee creation problems

-- 1. Check current RLS policies on employees table
SELECT 'Current RLS Policies on employees table:' as info;
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'employees';

-- 2. Check if employees table exists and has correct structure
SELECT 'Employees table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 3. Test if current user can insert into employees table
SELECT 'Testing current user permissions:' as test;
SELECT 
    current_user as current_db_user,
    session_user as session_user,
    current_setting('request.jwt.claims', true)::json->>'sub' as auth_uid;

-- 4. Check current user's employee record
SELECT 'Current user employee record:' as info;
SELECT id, email, role, status, user_id 
FROM employees 
WHERE user_id = auth.uid();

-- 5. TEMPORARY FIX: Disable RLS temporarily to test creation
-- WARNING: Only use this for debugging, re-enable afterwards
SELECT 'Temporarily disabling RLS on employees table for testing...' as action;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Test insert (replace with actual values)
-- This is just a test - remove after debugging
/*
INSERT INTO employees (
    employee_code,
    first_name,
    last_name,
    email,
    role,
    hire_date,
    languages
) VALUES (
    'TG002',
    'Test',
    'Employee',
    'test@test.com',
    'tour_guide',
    CURRENT_DATE,
    '{"en","ja"}'
);
*/

-- 6. Re-enable RLS and create better policies
SELECT 'Re-enabling RLS with improved policies...' as action;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "employees_own_data" ON employees;
DROP POLICY IF EXISTS "admin_manager_all_employees" ON employees;

-- Create simpler, working policies
-- Policy 1: Authenticated users can read all employees (for now)
CREATE POLICY "employees_read_all" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Only existing admins can insert new employees
CREATE POLICY "admins_can_insert_employees" ON employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees existing_emp
            WHERE existing_emp.user_id = auth.uid() 
            AND existing_emp.role = 'admin'
            AND existing_emp.status = 'active'
        )
    );

-- Policy 3: Only existing admins can update employees  
CREATE POLICY "admins_can_update_employees" ON employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees existing_emp
            WHERE existing_emp.user_id = auth.uid() 
            AND existing_emp.role = 'admin'
            AND existing_emp.status = 'active'
        )
    );

-- Policy 4: Employees can read their own data
CREATE POLICY "employees_read_own_data" ON employees
    FOR SELECT USING (user_id = auth.uid());

-- 7. Alternative: Create a bypass for the specific admin user
-- This allows your specific user to create employees
CREATE POLICY "specific_admin_bypass" ON employees
    FOR ALL TO authenticated
    USING (auth.uid()::text = '254213bb-d1b5-46a5-93c4-addd9fc7c328')
    WITH CHECK (auth.uid()::text = '254213bb-d1b5-46a5-93c4-addd9fc7c328');

-- 8. Verify the new policies
SELECT 'New RLS Policies created:' as result;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'employees';

-- 9. Test query to ensure your user can now create employees
SELECT 'Testing if your user can now access employees table:' as test;
SELECT COUNT(*) as can_read_employees_count
FROM employees;

SELECT 'Script completed. Try creating an employee again.' as final_status; 