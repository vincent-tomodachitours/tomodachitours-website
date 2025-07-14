-- =====================================================
-- Tomodachi Tours Admin Database Setup
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor to set up
-- the admin system tables and create a test admin account

-- Create custom types first
DO $$ 
BEGIN 
    -- Employee roles enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_role') THEN
        CREATE TYPE employee_role AS ENUM (
            'admin',
            'manager', 
            'tour_guide',
            'support'
        );
    END IF;

    -- Employee status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
        CREATE TYPE employee_status AS ENUM (
            'active',
            'inactive',
            'suspended',
            'terminated'
        );
    END IF;

    -- Shift status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
        CREATE TYPE shift_status AS ENUM (
            'available',
            'assigned',
            'unavailable',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role employee_role NOT NULL DEFAULT 'tour_guide',
    status employee_status NOT NULL DEFAULT 'active',
    hire_date DATE NOT NULL,
    emergency_contact JSONB,
    certifications TEXT[],
    languages VARCHAR(10)[] DEFAULT '{"en","ja"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employee shifts table
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    tour_type VARCHAR NOT NULL, -- Using VARCHAR instead of enum for flexibility
    shift_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status shift_status DEFAULT 'available',
    max_participants INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, tour_type, shift_date, time_slot)
);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES employees(id),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'tour', 'employee', etc.
    entity_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to existing bookings table (if they don't exist)
DO $$ 
BEGIN 
    -- Add assigned_guide_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'assigned_guide_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN assigned_guide_id UUID REFERENCES employees(id);
    END IF;

    -- Add guide_notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'guide_notes'
    ) THEN
        ALTER TABLE bookings ADD COLUMN guide_notes TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_id ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_date ON employee_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_tour_type ON employee_shifts(tour_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_guide ON bookings(assigned_guide_id);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "employees_own_data" ON employees;
DROP POLICY IF EXISTS "admin_manager_all_employees" ON employees;
DROP POLICY IF EXISTS "employee_own_shifts" ON employee_shifts;
DROP POLICY IF EXISTS "admin_manager_all_shifts" ON employee_shifts;
DROP POLICY IF EXISTS "admin_only_activity_log" ON admin_activity_log;
DROP POLICY IF EXISTS "employees_view_assigned_bookings" ON bookings;
DROP POLICY IF EXISTS "admin_manager_all_bookings" ON bookings;

-- Create Row Level Security Policies

-- Employees can read their own data
CREATE POLICY "employees_own_data" ON employees
    FOR ALL USING (user_id = auth.uid());

-- Admins and managers can see all employees
CREATE POLICY "admin_manager_all_employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );

-- Employees can manage their own shifts
CREATE POLICY "employee_own_shifts" ON employee_shifts
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

-- Admins and managers can see all shifts
CREATE POLICY "admin_manager_all_shifts" ON employee_shifts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );

-- Only admins can access activity logs
CREATE POLICY "admin_only_activity_log" ON admin_activity_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role = 'admin'
            AND e.status = 'active'
        )
    );

-- Update existing bookings RLS to allow employee access
CREATE POLICY "employees_view_assigned_bookings" ON bookings
    FOR SELECT USING (
        assigned_guide_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "admin_manager_all_bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.user_id = auth.uid() 
            AND e.role IN ('admin', 'manager')
            AND e.status = 'active'
        )
    );

-- =====================================================
-- CREATE TEST ADMIN ACCOUNT
-- =====================================================
-- This creates a test admin account you can use to login
-- Email: admin@tomodachitours.com
-- Password: AdminTest123!

-- First, check if admin user already exists
DO $$ 
DECLARE 
    admin_user_id UUID;
    existing_employee_id UUID;
BEGIN 
    -- Check if there's already an admin user
    SELECT id INTO existing_employee_id 
    FROM employees 
    WHERE email = 'admin@tomodachitours.com' 
    LIMIT 1;

    IF existing_employee_id IS NULL THEN
        -- Create the auth user (this might fail if user already exists, that's OK)
        BEGIN
            -- Note: You'll need to create this user manually in the Supabase dashboard
            -- or use the Supabase Auth API, as we can't create auth users directly in SQL
            
            -- For now, we'll create a placeholder employee record that you can link later
            INSERT INTO employees (
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
                'ADMIN001',
                'Admin',
                'User',
                'admin@tomodachitours.com',
                '+81-90-1234-5678',
                'admin',
                'active',
                CURRENT_DATE,
                '{"en","ja"}'
            );
            
            RAISE NOTICE 'Created placeholder admin employee record. You need to:';
            RAISE NOTICE '1. Create auth user admin@tomodachitours.com in Supabase dashboard';
            RAISE NOTICE '2. Update the employee record with the auth user_id';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Employee might already exist: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Admin employee already exists with ID: %', existing_employee_id;
    END IF;
END $$;

-- Show current employee records
SELECT 
    id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    user_id,
    created_at
FROM employees;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check that everything was created successfully

SELECT 'Tables created successfully:' as status;

SELECT 
    table_name,
    CASE WHEN table_name IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('employees', 'employee_shifts', 'admin_activity_log')
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES ('employees'), ('employee_shifts'), ('admin_activity_log')) as t(table_name);

SELECT 'Row Level Security status:' as info;
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('employees', 'employee_shifts', 'admin_activity_log', 'bookings')
AND schemaname = 'public';

SELECT 'Total employees:' as info, COUNT(*) as count FROM employees;

-- =====================================================
-- NEXT STEPS FOR USER
-- =====================================================
/*
TO COMPLETE THE SETUP:

1. Go to your Supabase Dashboard > Authentication > Users
2. Click "Invite User" or "Add User"
3. Create a user with:
   - Email: admin@tomodachitours.com
   - Password: AdminTest123! (or any password you prefer)
   - Auto Confirm: YES

4. After creating the user, copy the User ID from the dashboard

5. Run this SQL to link the auth user to the employee record:
   UPDATE employees 
   SET user_id = 'YOUR_AUTH_USER_ID_HERE'
   WHERE email = 'admin@tomodachitours.com';

6. You can then login to the admin site with:
   - Email: admin@tomodachitours.com
   - Password: AdminTest123! (or whatever you set)

ALTERNATIVE QUICK SETUP:
If you already have a Supabase auth user you want to make an admin,
just update the employee record with their user_id:

UPDATE employees 
SET user_id = 'your-existing-user-id'
WHERE email = 'admin@tomodachitours.com';
*/ 