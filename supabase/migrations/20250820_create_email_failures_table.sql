-- Create email_failures table to track failed email attempts
CREATE TABLE IF NOT EXISTS email_failures (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    customer_email TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'booking_confirmation', 'cancellation', etc.
    failure_reason TEXT,
    booking_details JSONB, -- Store booking details for manual follow-up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_failures_booking_id ON email_failures(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_failures_created_at ON email_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_email_failures_resolved ON email_failures(resolved_at) WHERE resolved_at IS NULL;

-- Add RLS policies
ALTER TABLE email_failures ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage email failures
CREATE POLICY "Service role can manage email failures" ON email_failures
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view email failures (for admin dashboard)
CREATE POLICY "Authenticated users can view email failures" ON email_failures
    FOR SELECT USING (auth.role() = 'authenticated');