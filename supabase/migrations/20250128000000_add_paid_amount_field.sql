-- Add paid_amount field to store the actual amount paid after discounts
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS paid_amount INTEGER;

-- Update existing bookings to calculate paid_amount from base price and discount
UPDATE public.bookings 
SET paid_amount = CASE 
    WHEN discount_amount IS NOT NULL AND discount_amount > 0 THEN
        -- Calculate base price and subtract discount
        CASE tour_type
            WHEN 'NIGHT_TOUR' THEN (6500 * (adults + children)) - discount_amount
            WHEN 'MORNING_TOUR' THEN (6500 * (adults + children)) - discount_amount  
            WHEN 'UJI_TOUR' THEN (6500 * (adults + children)) - discount_amount
            WHEN 'GION_TOUR' THEN (6500 * (adults + children)) - discount_amount
            ELSE (6500 * (adults + children)) - discount_amount
        END
    ELSE
        -- No discount, use base price
        CASE tour_type
            WHEN 'NIGHT_TOUR' THEN 6500 * (adults + children)
            WHEN 'MORNING_TOUR' THEN 6500 * (adults + children)
            WHEN 'UJI_TOUR' THEN 6500 * (adults + children) 
            WHEN 'GION_TOUR' THEN 6500 * (adults + children)
            ELSE 6500 * (adults + children)
        END
END
WHERE paid_amount IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_paid_amount ON public.bookings(paid_amount);