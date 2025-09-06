-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_ip TEXT NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    window_start BIGINT NOT NULL,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_until BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on client_ip for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_client_ip ON rate_limits(client_ip);

-- Create index on blocked_until for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until);

-- Add RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access rate_limits table
CREATE POLICY "service_role_only" ON rate_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete records older than 24 hours
    DELETE FROM rate_limits
    WHERE updated_at < NOW() - INTERVAL '24 hours'
    OR (blocked = true AND blocked_until < EXTRACT(EPOCH FROM NOW()) * 1000);
END;
$$;

-- Create a scheduled job to run cleanup every hour
SELECT cron.schedule(
    'cleanup-rate-limits',
    '0 * * * *', -- Every hour
    $$
    SELECT cleanup_rate_limits();
    $$
); 