-- Create booking_request_events table for tracking request lifecycle
CREATE TABLE IF NOT EXISTS booking_request_events (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('submitted', 'approved', 'rejected', 'payment_failed', 'payment_retry')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_request_events_booking_id ON booking_request_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_request_events_event_type ON booking_request_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_request_events_created_at ON booking_request_events(created_at);

-- Enable RLS
ALTER TABLE booking_request_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view all booking request events" ON booking_request_events
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin users can insert booking request events" ON booking_request_events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT, INSERT ON booking_request_events TO authenticated;
GRANT USAGE ON SEQUENCE booking_request_events_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE booking_request_events IS 'Tracks lifecycle events for booking requests including submissions, approvals, rejections, and payment failures';