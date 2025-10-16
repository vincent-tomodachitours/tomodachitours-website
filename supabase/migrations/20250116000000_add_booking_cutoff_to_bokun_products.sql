-- Add booking cutoff hours to bokun_products table
-- This stores the minimum hours before tour start that bookings are allowed

ALTER TABLE bokun_products 
ADD COLUMN booking_cutoff_hours INTEGER DEFAULT 24;

COMMENT ON COLUMN bokun_products.booking_cutoff_hours IS 'Minimum hours before tour start that bookings are allowed (fetched from Bokun product settings)';

-- Add last_sync timestamp to track when product details were last fetched
ALTER TABLE bokun_products 
ADD COLUMN last_product_sync_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bokun_products.last_product_sync_at IS 'Last time product details (including cutoff) were synced from Bokun API';

-- Create index for efficient queries
CREATE INDEX idx_bokun_products_last_sync ON bokun_products(last_product_sync_at);
