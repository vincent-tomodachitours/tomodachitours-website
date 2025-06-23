-- Update Bokun Products with Environment Variable References
-- Run this SQL to update all tour product IDs in the bokun_products table
-- 
-- IMPORTANT: Make sure you have set these environment variables before running:
-- NIGHT_TOUR_PRODUCT_ID=your_actual_night_tour_bokun_id
-- MORNING_TOUR_PRODUCT_ID=your_actual_morning_tour_bokun_id
-- UJI_TOUR_PRODUCT_ID=your_actual_uji_tour_bokun_id
-- GION_TOUR_PRODUCT_ID=your_actual_gion_tour_bokun_id

-- Method 1: Replace placeholder values with actual product IDs
-- Update each tour type with the actual Bokun product ID and activate them

-- Night Tour
UPDATE bokun_products 
SET 
    bokun_product_id = '${NIGHT_TOUR_PRODUCT_ID}', 
    is_active = true,
    updated_at = NOW()
WHERE local_tour_type = 'NIGHT_TOUR';

-- Morning Tour
UPDATE bokun_products 
SET 
    bokun_product_id = '${MORNING_TOUR_PRODUCT_ID}', 
    is_active = true,
    updated_at = NOW()
WHERE local_tour_type = 'MORNING_TOUR';

-- Uji Tour
UPDATE bokun_products 
SET 
    bokun_product_id = '${UJI_TOUR_PRODUCT_ID}', 
    is_active = true,
    updated_at = NOW()
WHERE local_tour_type = 'UJI_TOUR';

-- Gion Tour
UPDATE bokun_products 
SET 
    bokun_product_id = '${GION_TOUR_PRODUCT_ID}', 
    is_active = true,
    updated_at = NOW()
WHERE local_tour_type = 'GION_TOUR';

-- Method 2: Insert if records don't exist (use this if your table is empty)
-- Uncomment the following if you need to insert new records instead of updating

/*
INSERT INTO bokun_products (local_tour_type, bokun_product_id, is_active) VALUES
('NIGHT_TOUR', '${NIGHT_TOUR_PRODUCT_ID}', true),
('MORNING_TOUR', '${MORNING_TOUR_PRODUCT_ID}', true),
('UJI_TOUR', '${UJI_TOUR_PRODUCT_ID}', true),
('GION_TOUR', '${GION_TOUR_PRODUCT_ID}', true)
ON CONFLICT (local_tour_type, bokun_product_id) 
DO UPDATE SET 
    is_active = true, 
    updated_at = NOW();
*/

-- Verify the updates
SELECT 
    local_tour_type,
    bokun_product_id,
    is_active,
    updated_at
FROM bokun_products 
ORDER BY local_tour_type;

-- Optional: Check if all environment variables are properly set
-- You can run this query to see which tours still have placeholder values
SELECT 
    local_tour_type,
    bokun_product_id,
    CASE 
        WHEN bokun_product_id LIKE '%placeholder%' THEN 'NEEDS_UPDATE'
        WHEN is_active = false THEN 'INACTIVE'
        ELSE 'CONFIGURED'
    END as status
FROM bokun_products 
ORDER BY local_tour_type; 