-- Add payment_status column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';

-- Update existing records to have a default status
UPDATE bookings 
SET payment_status = 'PAID' 
WHERE status = 'CONFIRMED' AND payment_status IS NULL;

UPDATE bookings 
SET payment_status = 'REFUNDED' 
WHERE status = 'CANCELLED' AND refund_id IS NOT NULL AND payment_status IS NULL;

UPDATE bookings 
SET payment_status = 'CANCELLED' 
WHERE status = 'CANCELLED' AND refund_id IS NULL AND payment_status IS NULL; 