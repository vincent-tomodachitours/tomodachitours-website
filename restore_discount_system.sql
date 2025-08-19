-- ==============================================
-- DISCOUNT SYSTEM RESTORATION SCRIPT
-- ==============================================
-- This script restores the discount_codes table, missing columns, 
-- and database functions that were accidentally deleted

-- 1. CREATE DISCOUNT_CODES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value INTEGER NOT NULL,
    min_booking_amount INTEGER,
    max_discount_amount INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. ADD MISSING COLUMNS TO BOOKINGS TABLE
-- ==============================================
-- Add discount_amount column if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS discount_amount INTEGER;

-- Add discount_code_id column if it doesn't exist (for foreign key relationship)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS discount_code_id INTEGER;

-- Add paid_amount column if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS paid_amount INTEGER;

-- Add payment provider tracking columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_provider TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS backup_payment_used BOOLEAN DEFAULT false;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid_dates ON public.discount_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_bookings_discount_code_id ON public.bookings(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_provider ON public.bookings(payment_provider);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_id ON public.bookings(stripe_payment_intent_id);

-- 4. ADD FOREIGN KEY CONSTRAINT (IF NOT EXISTS)
-- ==============================================
-- Add foreign key relationship between bookings and discount_codes (only if it doesn't exist)
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_discount_code_id_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_discount_code_id_fkey 
        FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint bookings_discount_code_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint bookings_discount_code_id_fkey already exists, skipping';
    END IF;
END $$;

-- 5. CREATE THE INCREMENT DISCOUNT USAGE FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.increment_discount_code_usage(code_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.discount_codes 
    SET 
        used_count = used_count + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE code = code_param AND active = true;
    
    -- If no rows were updated, it means the code doesn't exist or isn't active
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Discount code not found or not active: %', code_param;
    END IF;
END;
$$;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- ==============================================
-- Allow anyone to read active discount codes (for validation)
DROP POLICY IF EXISTS "Allow anyone to read active discount codes" ON public.discount_codes;
CREATE POLICY "Allow anyone to read active discount codes"
ON public.discount_codes
FOR SELECT
TO public
USING (active = true);

-- Allow authenticated users to read any discount code
DROP POLICY IF EXISTS "Allow authenticated users to read any discount code" ON public.discount_codes;
CREATE POLICY "Allow authenticated users to read any discount code"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (true);

-- Only allow admins to modify discount codes
DROP POLICY IF EXISTS "Only allow admins to modify discount codes" ON public.discount_codes;
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

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access to discount codes" ON public.discount_codes;
CREATE POLICY "Service role has full access to discount codes"
ON public.discount_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. INSERT SAMPLE DISCOUNT CODES (OPTIONAL)
-- ==============================================
-- Uncomment the following lines if you want to add some sample discount codes

-- INSERT INTO public.discount_codes (code, description, type, value, active, max_uses, valid_until) VALUES
-- ('WELCOME10', '10% off for new customers', 'percentage', 10, true, 100, '2024-12-31 23:59:59+00'),
-- ('SAVE500', '500 yen off any tour', 'fixed', 500, true, 50, '2024-12-31 23:59:59+00'),
-- ('EARLYBIRD', '15% off for early bookings', 'percentage', 15, true, null, '2024-06-30 23:59:59+00');

-- 9. UPDATE EXISTING BOOKINGS (IF NEEDED)
-- ==============================================
-- If you have existing bookings with discount codes but no amounts calculated,
-- you might want to update them. This is optional and depends on your data.
-- This section will only run if the columns exist and have data.

DO $$
BEGIN
    -- Check if the necessary columns exist before trying to update
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name IN ('paid_amount', 'discount_amount', 'adults', 'children', 'tour_type')
    ) THEN
        -- Update paid_amount for bookings that don't have it calculated
        UPDATE public.bookings 
        SET paid_amount = CASE 
            WHEN discount_amount IS NOT NULL AND discount_amount > 0 THEN
                -- Calculate base price and subtract discount
                CASE tour_type
                    WHEN 'NIGHT_TOUR' THEN (6500 * (COALESCE(adults, 0) + COALESCE(children, 0))) - discount_amount
                    WHEN 'MORNING_TOUR' THEN (6500 * (COALESCE(adults, 0) + COALESCE(children, 0))) - discount_amount  
                    WHEN 'UJI_TOUR' THEN (6500 * (COALESCE(adults, 0) + COALESCE(children, 0))) - discount_amount
                    WHEN 'GION_TOUR' THEN (6500 * (COALESCE(adults, 0) + COALESCE(children, 0))) - discount_amount
                    ELSE (6500 * (COALESCE(adults, 0) + COALESCE(children, 0))) - discount_amount
                END
            ELSE
                -- No discount, use base price
                CASE tour_type
                    WHEN 'NIGHT_TOUR' THEN 6500 * (COALESCE(adults, 0) + COALESCE(children, 0))
                    WHEN 'MORNING_TOUR' THEN 6500 * (COALESCE(adults, 0) + COALESCE(children, 0))
                    WHEN 'UJI_TOUR' THEN 6500 * (COALESCE(adults, 0) + COALESCE(children, 0))
                    WHEN 'GION_TOUR' THEN 6500 * (COALESCE(adults, 0) + COALESCE(children, 0))
                    ELSE 6500 * (COALESCE(adults, 0) + COALESCE(children, 0))
                END
        END
        WHERE paid_amount IS NULL OR paid_amount = 0;
        
        RAISE NOTICE 'Updated paid_amount for existing bookings';
    ELSE
        RAISE NOTICE 'Skipping booking updates - required columns not found';
    END IF;
END $$;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================
-- Run these to verify everything was created correctly:

-- Check discount_codes table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'discount_codes' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Check if function was created
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name = 'increment_discount_code_usage';

-- Check bookings table discount columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'bookings' 
-- AND table_schema = 'public'
-- AND column_name LIKE '%discount%'
-- ORDER BY ordinal_position;

COMMIT; 