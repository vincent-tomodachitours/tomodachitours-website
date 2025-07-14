-- =====================================================
-- Fix RLS Policies - Remove Infinite Recursion
-- =====================================================
-- Execute this SQL to fix the circular dependency in RLS policies

-- First, drop all problematic policies
DROP POLICY IF EXISTS "employees_own_data" ON employees;
DROP POLICY IF EXISTS "admin_manager_all_employees" ON employees;
DROP POLICY IF EXISTS "employee_own_shifts" ON employee_shifts;
DROP POLICY IF EXISTS "admin_manager_all_shifts" ON employee_shifts;
DROP POLICY IF EXISTS "admin_only_activity_log" ON admin_activity_log;
DROP POLICY IF EXISTS "employees_view_assigned_bookings" ON bookings;
DROP POLICY IF EXISTS "admin_manager_all_bookings" ON bookings;

-- Temporarily disable RLS to fix the policies
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log DISABLE ROW LEVEL SECURITY;

-- Create simplified policies without circular dependencies

-- =====================================================
-- EMPLOYEES TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read their own employee data
CREATE POLICY "employees_select_own" ON employees
    FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users to update their own employee data
CREATE POLICY "employees_update_own" ON employees
    FOR UPDATE USING (user_id = auth.uid());

-- Allow service role full access (for admin operations)
CREATE POLICY "employees_service_role_all" ON employees
    FOR ALL TO service_role USING (true);

-- =====================================================
-- EMPLOYEE_SHIFTS TABLE POLICIES
-- =====================================================

-- Allow employees to view/manage shifts
CREATE POLICY "shifts_employee_access" ON employee_shifts
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "shifts_service_role_all" ON employee_shifts
    FOR ALL TO service_role USING (true);

-- =====================================================
-- ADMIN_ACTIVITY_LOG TABLE POLICIES
-- =====================================================

-- Only service role can access activity logs
CREATE POLICY "activity_log_service_role_only" ON admin_activity_log
    FOR ALL TO service_role USING (true);

-- =====================================================
-- BOOKINGS TABLE POLICIES (UPDATE EXISTING)
-- =====================================================

-- Allow employees to view bookings assigned to them
CREATE POLICY "bookings_assigned_guides" ON bookings
    FOR SELECT USING (
        assigned_guide_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Allow service role full access to bookings
CREATE POLICY "bookings_service_role_all" ON bookings
    FOR ALL TO service_role USING (true);

-- Re-enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies are working
SELECT 'RLS Policies created successfully' as status;

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('employees', 'employee_shifts', 'admin_activity_log', 'bookings')
ORDER BY tablename, policyname;

-- Check employee records
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
        WHEN user_id IS NULL THEN '❌ NO AUTH USER LINKED'
        ELSE '✅ AUTH USER LINKED'
    END as auth_status
FROM employees; 