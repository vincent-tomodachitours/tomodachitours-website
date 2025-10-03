-- Add missing columns to bookings table for booking requests
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS request_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS total_amount INTEGER;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.bookings.special_requests IS 'Customer special requests or notes for the booking';
COMMENT ON COLUMN public.bookings.request_submitted_at IS 'Timestamp when the booking request was initially submitted';
COMMENT ON COLUMN public.bookings.customer_phone IS 'Customer phone number for contact';
COMMENT ON COLUMN public.bookings.payment_method_id IS 'Stripe payment method ID for processing payment';
COMMENT ON COLUMN public.bookings.discount_code IS 'Discount code applied to the booking (if any)';
COMMENT ON COLUMN public.bookings.total_amount IS 'Total amount for the booking in yen (integer, no decimals)';