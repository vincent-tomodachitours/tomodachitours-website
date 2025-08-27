-- Create conversion tracking log table for server-side conversion backup system
CREATE TABLE IF NOT EXISTS conversion_tracking_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL,
    conversion_type TEXT NOT NULL CHECK (conversion_type IN ('client', 'server')),
    success BOOLEAN NOT NULL DEFAULT false,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_log_booking_id ON conversion_tracking_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_log_type ON conversion_tracking_log(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_log_created_at ON conversion_tracking_log(created_at);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_log_success ON conversion_tracking_log(success);

-- Add RLS policies
ALTER TABLE conversion_tracking_log ENABLE ROW LEVEL SECURITY;

-- Policy for service role (used by Supabase functions)
CREATE POLICY "Service role can manage conversion tracking logs" ON conversion_tracking_log
    FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users to read their own conversion logs (if needed for debugging)
CREATE POLICY "Users can read conversion tracking logs" ON conversion_tracking_log
    FOR SELECT USING (true);

-- Add foreign key constraint to bookings table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        ALTER TABLE conversion_tracking_log 
        ADD CONSTRAINT fk_conversion_tracking_log_booking_id 
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversion_tracking_log_updated_at 
    BEFORE UPDATE ON conversion_tracking_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE conversion_tracking_log IS 'Tracks conversion attempts for both client-side and server-side conversion tracking to enable reconciliation and backup validation';
COMMENT ON COLUMN conversion_tracking_log.booking_id IS 'Reference to the booking that triggered the conversion';
COMMENT ON COLUMN conversion_tracking_log.conversion_type IS 'Type of conversion tracking: client or server';
COMMENT ON COLUMN conversion_tracking_log.success IS 'Whether the conversion tracking attempt was successful';
COMMENT ON COLUMN conversion_tracking_log.details IS 'Additional details about the conversion attempt (conversion data, error messages, etc.)';