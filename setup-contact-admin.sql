-- Setup contact@tomodachitours.com as Admin Account
-- =====================================================
-- STEP 1: First create the auth user in Supabase Dashboard
-- Go to: Supabase Dashboard > Authentication > Users > "Invite User"
-- Email: contact@tomodachitours.com
-- Password: [Set a secure password]
-- Auto Confirm: YES
-- 
-- STEP 2: After creating the auth user, copy the User ID and replace 'YOUR_USER_ID_HERE' below
-- STEP 3: Run this SQL script in Supabase SQL Editor
-- =====================================================

BEGIN;

-- Check if employee record already exists
DO $$
DECLARE
    existing_employee_id TEXT;
    target_user_id TEXT := 'YOUR_USER_ID_HERE'; -- Replace with actual User ID from Supabase Auth
    target_email TEXT := 'contact@tomodachitours.com';
BEGIN
    -- Check if employee already exists
    SELECT id INTO existing_employee_id 
    FROM employees 
    WHERE user_id = target_user_id::uuid OR email = target_email;
    
    IF existing_employee_id IS NOT NULL THEN
        RAISE NOTICE 'Employee already exists with ID: %', existing_employee_id;
        
        -- Update existing record to ensure it has admin role
        UPDATE employees 
        SET 
            user_id = target_user_id::uuid,
            role = 'admin',
            status = 'active',
            updated_at = NOW()
        WHERE email = target_email;
        
        RAISE NOTICE '✅ Updated existing employee record to admin role';
    ELSE
        -- Create new employee record
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
            emergency_contact,
            certifications,
            languages,
            created_at,
            updated_at
        ) VALUES (
            target_user_id::uuid,
            'ADMIN003',  -- Unique admin code
            'Contact',   -- You can update this later
            'Admin',     -- You can update this later
            target_email,
            NULL,        -- Add phone if available
            'admin',     -- Set as admin role
            'active',
            CURRENT_DATE,
            NULL,        -- Add emergency contact if needed
            ARRAY[]::TEXT[],  -- Add certifications if needed
            ARRAY['English', 'Japanese']::TEXT[],  -- Add languages
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Employee record created successfully for %', target_email;
    END IF;
END $$;

-- Verify the employee was created/linked correctly
SELECT 'Verification Results:' as status;
SELECT 
    id,
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    CASE 
        WHEN user_id IS NOT NULL THEN '✅ LINKED TO AUTH USER'
        ELSE '❌ NO AUTH USER LINKED'
    END as auth_status,
    CASE 
        WHEN role = 'admin' AND status = 'active' THEN '✅ READY FOR ADMIN LOGIN'
        ELSE '❌ NOT READY FOR LOGIN'
    END as login_status,
    created_at
FROM employees 
WHERE email = 'contact@tomodachitours.com';

-- Show all current admin accounts
SELECT 'Current Admin Accounts:' as info;
SELECT 
    email,
    role,
    status,
    employee_code,
    CASE 
        WHEN user_id IS NOT NULL THEN '✅ AUTH LINKED'
        ELSE '❌ NO AUTH LINK'
    END as auth_link_status
FROM employees 
WHERE role = 'admin'
ORDER BY created_at;

COMMIT;

-- =====================================================
-- INSTRUCTIONS AFTER RUNNING THIS SCRIPT:
-- =====================================================
/*
1. If you haven't already, go to Supabase Dashboard > Authentication > Users
2. Click "Invite User" or "Add User" 
3. Create user with:
   - Email: contact@tomodachitours.com
   - Password: [Choose a secure password]
   - Auto Confirm: YES

4. Copy the User ID from the dashboard (it will look like: 12345678-1234-1234-1234-123456789012)

5. Replace 'YOUR_USER_ID_HERE' in this script with the actual User ID

6. Run this script again in Supabase SQL Editor

7. The user can then login to the admin site with:
   - Email: contact@tomodachitours.com  
   - Password: [Whatever password you set]

8. Update the first_name and last_name in the employees table if desired:
   UPDATE employees 
   SET first_name = 'Actual First Name', last_name = 'Actual Last Name'
   WHERE email = 'contact@tomodachitours.com';
*/ 