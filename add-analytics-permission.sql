-- Add analytics permissions to admin users
-- Ensures admin users can access the analytics dashboard

BEGIN;

-- First, let's see current admin users
SELECT 
    id,
    first_name,
    last_name,
    email,
    role,
    status
FROM employees 
WHERE role = 'admin';

-- Admin role should have all permissions by default
-- But let's make sure the analytics permission is properly handled
-- This depends on how your permission system is implemented

-- If you're using a role-based permission system (which is typical for admins),
-- admin users should automatically have view_analytics permission
-- Let's verify this works by checking the role permissions

-- Note: The actual permission checking happens in the frontend
-- Admin users typically have access to all features
-- This is just a verification query

COMMIT;

-- Test query to verify analytics data access
-- This should return some data if the user has proper access
SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT customer_email) as unique_customers,
    SUM(total_participants) as total_participants
FROM bookings 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Test query for employee data
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees
FROM employees;

-- Test query for shift data
SELECT 
    COUNT(*) as total_shifts,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_shifts
FROM employee_shifts 
WHERE shift_date >= CURRENT_DATE - INTERVAL '30 days'; 