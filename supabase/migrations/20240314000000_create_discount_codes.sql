-- Create discount codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL,  -- 'percentage' or 'fixed'
    discount_value INTEGER NOT NULL,  -- percentage or amount in yen
    min_booking_amount INTEGER,
    max_discount_amount INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid_dates ON public.discount_codes(valid_from, valid_until); 