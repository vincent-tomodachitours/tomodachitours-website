-- Emergency fix: Temporarily disable RLS on employees table to restore access
-- Run this if you can't login at all

-- Disable RLS temporarily
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- This will allow all authenticated users to access employee records
-- You can re-enable RLS after fixing the policies

-- To re-enable later (after fixing policies):
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;