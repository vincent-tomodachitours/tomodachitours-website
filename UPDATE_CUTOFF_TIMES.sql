-- Update booking cutoff times for tours
-- Run this SQL directly in your database

-- View current cutoff times
SELECT type, name, booking_cutoff_hours 
FROM tours 
ORDER BY type;

-- Update cutoff times
-- Standard tours: 24 hours
UPDATE tours 
SET booking_cutoff_hours = 24 
WHERE type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'GION_TOUR', 'MUSIC_TOUR', 'MUSIC_PERFORMANCE');

-- Uji tours: 48 hours (needs coordination with partner)
UPDATE tours 
SET booking_cutoff_hours = 48 
WHERE type IN ('UJI_TOUR', 'UJI_WALKING_TOUR');

-- Verify the changes
SELECT type, name, booking_cutoff_hours 
FROM tours 
ORDER BY type;
