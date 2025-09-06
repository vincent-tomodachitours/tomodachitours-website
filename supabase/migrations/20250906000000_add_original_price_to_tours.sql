-- Add original_price column to tours table
-- This represents the Viator price (10% higher than our base_price)

ALTER TABLE tours 
ADD COLUMN original_price INTEGER;

-- Update existing tours to set original_price based on current base_price
-- Since our prices are 10% cheaper than Viator, original_price = base_price / 0.9
UPDATE tours 
SET original_price = ROUND(base_price / 0.9);

-- Add comment to explain the column
COMMENT ON COLUMN tours.original_price IS 'Original price as listed on Viator (base_price represents 10% discount from this)';