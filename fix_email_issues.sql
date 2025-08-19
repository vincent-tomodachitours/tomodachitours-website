-- ==============================================
-- EMAIL TROUBLESHOOTING AND FIXES
-- ==============================================
-- This script helps diagnose why emails aren't being sent

-- 1. Check recent bookings to see what data is available
SELECT 
    id,
    status,
    customer_email,
    customer_name,
    tour_type,
    booking_date,
    booking_time,
    adults,
    children,
    infants,
    paid_amount,
    discount_amount,
    created_at
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if tours table exists and has the expected data
-- First check what columns exist in the tours table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Then check the actual tours data (including meeting_point after it's added)
SELECT 
    type,
    name,
    id,
    base_price,
    meeting_point
FROM public.tours
LIMIT 5;

-- 3. Check if there are any NULL email addresses in recent bookings
SELECT 
    id,
    customer_email,
    customer_name,
    status
FROM public.bookings 
WHERE customer_email IS NULL 
   OR customer_email = ''
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Add missing amount column as an alias for paid_amount (if needed)
-- This creates a computed column to help with backward compatibility
-- ALTER TABLE public.bookings 
-- ADD COLUMN IF NOT EXISTS amount INTEGER GENERATED ALWAYS AS (paid_amount) STORED;

COMMIT; 