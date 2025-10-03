-- Add new booking statuses to existing enum
DO $$
BEGIN
    -- Add PENDING_CONFIRMATION if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
        AND enumlabel = 'PENDING_CONFIRMATION'
    ) THEN
        ALTER TYPE booking_status ADD VALUE 'PENDING_CONFIRMATION';
    END IF;
    
    -- Add REJECTED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
        AND enumlabel = 'REJECTED'
    ) THEN
        ALTER TYPE booking_status ADD VALUE 'REJECTED';
    END IF;
END $$;

-- Add request-specific fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS request_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create booking_request_events table for tracking request lifecycle
CREATE TABLE IF NOT EXISTS booking_request_events (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('submitted', 'approved', 'rejected', 'payment_failed', 'timeout_reminder', 'auto_rejected')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method_id ON bookings(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_bookings_request_submitted_at ON bookings(request_submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_admin_reviewed_at ON bookings(admin_reviewed_at);
CREATE INDEX IF NOT EXISTS idx_booking_request_events_booking_id ON booking_request_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_request_events_event_type ON booking_request_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_request_events_created_at ON booking_request_events(created_at);

-- Enable RLS on booking_request_events table
ALTER TABLE booking_request_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_request_events
-- Allow service role full access
CREATE POLICY "Service role has full access to booking_request_events"
ON booking_request_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read events for their own bookings
CREATE POLICY "Users can read events for their own bookings"
ON booking_request_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = booking_request_events.booking_id 
        AND bookings.customer_email = auth.jwt() ->> 'email'
    )
);

-- Allow admins to read all events (assuming admin role exists)
CREATE POLICY "Admins can read all booking request events"
ON booking_request_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
);

-- Create function to automatically log booking request events
CREATE OR REPLACE FUNCTION log_booking_request_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes for booking requests
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Only log for request-related statuses
        IF NEW.status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED') THEN
            INSERT INTO booking_request_events (
                booking_id,
                event_type,
                event_data,
                created_by
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN NEW.status = 'PENDING_CONFIRMATION' THEN 'submitted'
                    WHEN NEW.status = 'CONFIRMED' AND OLD.status = 'PENDING_CONFIRMATION' THEN 'approved'
                    WHEN NEW.status = 'REJECTED' THEN 'rejected'
                    ELSE 'status_changed'
                END,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'admin_reviewed_by', NEW.admin_reviewed_by,
                    'rejection_reason', NEW.rejection_reason
                ),
                COALESCE(NEW.admin_reviewed_by, 'system')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log booking status changes
DROP TRIGGER IF EXISTS booking_request_status_change_trigger ON bookings;
CREATE TRIGGER booking_request_status_change_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION log_booking_request_event();

-- Add comments for documentation
COMMENT ON COLUMN bookings.payment_method_id IS 'Stripe Payment Method ID for deferred payment processing';
COMMENT ON COLUMN bookings.request_submitted_at IS 'Timestamp when booking request was submitted';
COMMENT ON COLUMN bookings.admin_reviewed_at IS 'Timestamp when admin reviewed the request';
COMMENT ON COLUMN bookings.admin_reviewed_by IS 'Admin user who reviewed the request';
COMMENT ON COLUMN bookings.rejection_reason IS 'Reason provided when request is rejected';

COMMENT ON TABLE booking_request_events IS 'Tracks lifecycle events for booking requests';
COMMENT ON COLUMN booking_request_events.event_type IS 'Type of event: submitted, approved, rejected, payment_failed, timeout_reminder, auto_rejected';
COMMENT ON COLUMN booking_request_events.event_data IS 'Additional event data in JSON format';