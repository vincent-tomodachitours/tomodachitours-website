-- Query to get complete table structure for all tables in the public schema
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE ''
    END as key_type,
    c.ordinal_position
FROM 
    information_schema.tables t
JOIN 
    information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN 
    information_schema.table_constraints tc ON t.table_name = tc.table_name 
    AND tc.constraint_type = 'PRIMARY KEY'
LEFT JOIN 
    information_schema.key_column_usage pk ON tc.constraint_name = pk.constraint_name 
    AND c.column_name = pk.column_name
LEFT JOIN 
    information_schema.key_column_usage fk ON c.table_name = fk.table_name 
    AND c.column_name = fk.column_name
    AND fk.constraint_name IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
    )
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, c.ordinal_position;