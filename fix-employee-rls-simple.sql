-- =====================================================
-- Fix Employee RLS Policies - Simple Version
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "employees_own_data" ON employees;
DROP POLICY IF EXISTS "admin_manager_all_employees" ON employees;
DROP POLICY IF EXISTS "employee_own_shifts" ON employee_shifts;
DROP POLICY IF EXISTS "admin_manager_all_shifts" ON employee_shifts;

-- Temporarily disable RLS to ensure clean slate
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create new, working policies

-- Policy 1: Allow your specific admin user to do everything
CREATE POLICY "admin_user_full_access" ON employees
    FOR ALL 
    USING (auth.uid()::text = '254213bb-d1b5-46a5-93c4-addd9fc7c328')
    WITH CHECK (auth.uid()::text = '254213bb-d1b5-46a5-93c4-addd9fc7c328');

-- Policy 2: Authenticated users can read all employees
CREATE POLICY "authenticated_users_read" ON employees
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy 3: Admins can insert new employees (after first admin exists)
CREATE POLICY "admins_can_manage" ON employees
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role = 'admin'
            AND e.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role = 'admin'
            AND e.status = 'active'
        )
    ); 