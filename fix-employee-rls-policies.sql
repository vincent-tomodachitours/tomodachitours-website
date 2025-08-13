-- Fix RLS policies for employees table to allow admin access
-- This will enable the admin interface to properly display all employee records

-- First, let's add the missing RLS policies for admin and manager access

-- Policy to allow admins and managers to SELECT all employee records
CREATE POLICY "employees_admin_manager_select_all" 
ON employees 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role IN ('admin', 'manager')
    )
);

-- Policy to allow admins to INSERT new employee records
CREATE POLICY "employees_admin_insert" 
ON employees 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'admin'
    )
);

-- Policy to allow admins to UPDATE any employee record
CREATE POLICY "employees_admin_update_all" 
ON employees 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'admin'
    )
);

-- Policy to allow managers to UPDATE employee records (but not admin records)
CREATE POLICY "employees_manager_update_limited" 
ON employees 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'manager'
    )
    AND role != 'admin'  -- Managers can't update admin records
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'manager'
    )
    AND role != 'admin'  -- Managers can't promote to admin
);

-- Policy to allow admins to DELETE employee records (soft delete by changing status)
CREATE POLICY "employees_admin_delete" 
ON employees 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.user_id = auth.uid() 
        AND e.status = 'active'
        AND e.role = 'admin'
    )
);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'employees' 
ORDER BY policyname;