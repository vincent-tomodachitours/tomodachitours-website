-- Fix for infinite recursion in RLS policies
-- The issue is that policies are trying to query employees table to check permissions on employees table

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "employees_admin_select_all" ON employees;
DROP POLICY IF EXISTS "employees_admin_insert_safe" ON employees;
DROP POLICY IF EXISTS "employees_admin_update_safe" ON employees;
DROP POLICY IF EXISTS "employees_admin_manager_select_all" ON employees;
DROP POLICY IF EXISTS "employees_admin_insert" ON employees;
DROP POLICY IF EXISTS "employees_admin_update_all" ON employees;
DROP POLICY IF EXISTS "employees_manager_update_limited" ON employees;
DROP POLICY IF EXISTS "employees_admin_delete" ON employees;

-- Keep the existing policies that work
-- DROP POLICY IF EXISTS "employees_select_own" ON employees;
-- DROP POLICY IF EXISTS "employees_update_own" ON employees;

-- Create a simple policy that allows specific admin users by email
-- This avoids the circular dependency by not querying the employees table
CREATE POLICY "employees_admin_access_by_email" 
ON employees 
FOR ALL
TO authenticated 
USING (
    -- Allow users to see their own record
    user_id = auth.uid()
    OR
    -- Allow specific admin emails (replace with your actual admin email)
    auth.jwt() ->> 'email' IN (
        'spirivincent03@gmail.com',  -- Replace with your admin email
        'admin@tomodachitours.com'   -- Add other admin emails as needed
    )
)
WITH CHECK (
    -- Same check for INSERT/UPDATE
    user_id = auth.uid()
    OR
    auth.jwt() ->> 'email' IN (
        'spirivincent03@gmail.com',  -- Replace with your admin email
        'admin@tomodachitours.com'   -- Add other admin emails as needed
    )
);

-- Alternative approach: Use a function to check admin status
-- This creates a function that can be cached and avoids recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user's email is in the admin list
    RETURN auth.jwt() ->> 'email' IN (
        'spirivincent03@gmail.com',  -- Replace with your admin email
        'admin@tomodachitours.com'   -- Add other admin emails as needed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the email-based policy and use the function instead
DROP POLICY IF EXISTS "employees_admin_access_by_email" ON employees;

CREATE POLICY "employees_admin_access_function" 
ON employees 
FOR ALL
TO authenticated 
USING (
    -- Allow users to see their own record
    user_id = auth.uid()
    OR
    -- Allow admin users
    is_admin_user()
)
WITH CHECK (
    -- Same check for INSERT/UPDATE
    user_id = auth.uid()
    OR
    is_admin_user()
);

-- Verify the policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'employees' 
ORDER BY policyname;