-- Update booking_status enum to include booking request statuses
-- Add PENDING_CONFIRMATION, PENDING_PAYMENT, and REJECTED to the enum

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- Drop and recreate the bookings_status_check constraint to include new statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY[
    'PENDING_PAYMENT'::text, 
    'PENDING_CONFIRMATION'::text,
    'CONFIRMED'::text, 
    'CANCELLED'::text,
    'REJECTED'::text
]));

-- Update existing booking request to have correct status
-- This fixes the booking request that was created with PENDING_PAYMENT status

UPDATE bookings 
SET status = 'PENDING_CONFIRMATION'
WHERE id = 244 
  AND status = 'PENDING_PAYMENT' 
  AND tour_type = 'UJI_TOUR'
  AND request_submitted_at IS NOT NULL;

-- Add a comment to document this change
COMMENT ON TABLE bookings IS 'Updated booking_status enum and constraint to include booking request statuses and fixed booking request #244 status';