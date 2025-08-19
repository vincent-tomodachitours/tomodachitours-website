-- ==============================================
-- ADD MEETING POINT COLUMN TO TOURS TABLE
-- ==============================================
-- This script adds the missing meeting_point column and populates it with default meeting point data

-- 1. Add the meeting_point column as JSONB to store structured meeting point data
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS meeting_point JSONB;

-- 2. Set default meeting point data for all existing tours
UPDATE public.tours 
SET meeting_point = jsonb_build_object(
    'location', '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
    'google_maps_url', 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
    'additional_info', 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
)
WHERE meeting_point IS NULL;

-- 3. Optional: Set specific meeting points for different tour types if needed
-- You can customize these based on your actual tour meeting points

-- Example: Update specific tours with different meeting points
-- UPDATE public.tours 
-- SET meeting_point = jsonb_build_object(
--     'location', 'Gion Corner',
--     'google_maps_url', 'https://maps.app.goo.gl/EXAMPLE',
--     'additional_info', 'Meet at the main entrance'
-- )
-- WHERE type = 'GION_TOUR';

-- 4. Create an index for performance on the meeting_point column
CREATE INDEX IF NOT EXISTS idx_tours_meeting_point ON public.tours USING GIN (meeting_point);

-- 5. Verify the update worked
SELECT 
    type,
    name,
    meeting_point
FROM public.tours
LIMIT 5;

COMMIT; 