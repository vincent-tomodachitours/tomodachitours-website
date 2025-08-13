-- Query to get complete current database schema
-- This will show all tables, columns, data types, constraints, and relationships

-- 1. Get all tables in the public schema
SELECT 
    'TABLE_INFO' as query_type,
    t.table_name,
    t.table_type,
    obj_description(c.oid) as table_comment
FROM 
    information_schema.tables t
LEFT JOIN 
    pg_class c ON c.relname = t.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name;

-- 2. Get all columns with detailed information
SELECT 
    'COLUMN_INFO' as query_type,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    col_description(pgc.oid, c.ordinal_position) as column_comment
FROM 
    information_schema.tables t
JOIN 
    information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN 
    pg_class pgc ON pgc.relname = t.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, c.ordinal_position;

-- 3. Get primary keys
SELECT 
    'PRIMARY_KEY' as query_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY 
    tc.table_name, kcu.ordinal_position;

-- 4. Get foreign keys
SELECT 
    'FOREIGN_KEY' as query_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN 
    information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY 
    tc.table_name, kcu.column_name;

-- 5. Get indexes
SELECT 
    'INDEX_INFO' as query_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, indexname;

-- 6. Check if employees table exists and get sample data
SELECT 
    'EMPLOYEES_CHECK' as query_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'DOES_NOT_EXIST'
    END as employees_table_status;

-- 7. If employees table exists, get row count and sample data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public') THEN
        -- Get row count
        RAISE NOTICE 'EMPLOYEES_COUNT: %', (SELECT COUNT(*) FROM employees);
        
        -- This would show sample data, but we'll use a separate query for that
    END IF;
END $$;

-- 8. Get auth.users info (if accessible)
SELECT 
    'AUTH_USERS_CHECK' as query_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth')
        THEN 'EXISTS'
        ELSE 'DOES_NOT_EXIST'
    END as auth_users_status;

-- 9. Check RLS policies
SELECT 
    'RLS_POLICIES' as query_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, policyname;