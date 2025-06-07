-- Add discount code fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN discount_code_id INTEGER REFERENCES public.discount_codes(id),
ADD COLUMN discount_amount INTEGER;

-- Add index for discount code lookups
CREATE INDEX idx_bookings_discount_code ON public.bookings(discount_code_id);

-- Add RLS policies for discount_codes table
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active discount codes
CREATE POLICY "Allow anyone to read active discount codes"
ON public.discount_codes
FOR SELECT
TO public
USING (active = true);

-- Allow authenticated users to read any discount code
CREATE POLICY "Allow authenticated users to read any discount code"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (true);

-- Only allow admins to modify discount codes
CREATE POLICY "Only allow admins to modify discount codes"
ON public.discount_codes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'admin@tomodachitours.com',
      'tyis@tomodachitours.com'
    )
  )
); 