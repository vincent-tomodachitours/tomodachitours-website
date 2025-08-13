-- Quick check for employees table and related user data

-- 1. Check if employees table exists
SELECT 
    'TABLE_EXISTS' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'employees';

-- 2. If employees table exists, show its structure
SELECT 
    'EMPLOYEES_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'employees'
ORDER BY ordinal_position;

-- 3. Check row count in employees table (if it exists)
SELECT 
    'EMPLOYEES_COUNT' as check_type,
    COUNT(*) as row_count
FROM employees
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
);

-- 4. Sample employees data (if table exists and has data)
SELECT 
    'EMPLOYEES_SAMPLE' as check_type,
    id,
    user_id,
    employee_code,
    first_name,
    last_name,
    email,
    role,
    status,
    hire_date,
    created_at
FROM employees
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
)
LIMIT 5;

-- 5. Check auth.users count (if accessible)
SELECT 
    'AUTH_USERS_COUNT' as check_type,
    COUNT(*) as user_count
FROM auth.users
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
);

-- 6. Sample auth.users data (if accessible)
SELECT 
    'AUTH_USERS_SAMPLE' as check_type,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
)
LIMIT 5;

-- 7. Check for any user-employee relationships
SELECT 
    'USER_EMPLOYEE_LINK' as check_type,
    e.id as employee_id,
    e.user_id,
    e.email as employee_email,
    u.email as auth_email,
    e.role,
    e.status
FROM employees e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
)
AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
)
LIMIT 10;