-- SQL commands to fix the music tour booking constraint
-- Run these commands in your database to allow MUSIC_TOUR bookings

-- First, drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_tour_type_check;

-- Add the new constraint that includes MUSIC_TOUR
ALTER TABLE bookings ADD CONSTRAINT bookings_tour_type_check 
CHECK (tour_type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR', 'MUSIC_TOUR'));

-- Verify the constraint was added correctly
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'bookings_tour_type_check';