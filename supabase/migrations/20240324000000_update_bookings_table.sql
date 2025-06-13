-- Add new fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS tour_type TEXT,
ADD COLUMN IF NOT EXISTS booking_time TEXT,
ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS infants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS charge_id TEXT,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_amount INTEGER;

-- Update RLS policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own bookings
CREATE POLICY "Users can read their own bookings"
ON public.bookings
FOR SELECT
TO public
USING (customer_email = current_user OR user_id = auth.uid());

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
TO public
USING (customer_email = current_user OR user_id = auth.uid())
WITH CHECK (customer_email = current_user OR user_id = auth.uid());

-- Allow the service role to do everything
CREATE POLICY "Service role has full access to bookings"
ON public.bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 