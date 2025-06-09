-- Verify table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'rate_limits'
);

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'rate_limits';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'rate_limits';

-- Verify policy exists
SELECT *
FROM pg_policies
WHERE tablename = 'rate_limits';

-- Verify cron job
SELECT *
FROM cron.job
WHERE jobname = 'cleanup-rate-limits'; 