-- Add booking cutoff hours to tours table
-- This stores the minimum hours before tour start that bookings are allowed

ALTER TABLE tours 
ADD COLUMN booking_cutoff_hours INTEGER DEFAULT 24;

COMMENT ON COLUMN tours.booking_cutoff_hours IS 'Minimum hours before tour start that bookings are allowed';

-- Set initial values for existing tours
UPDATE tours SET booking_cutoff_hours = 24 WHERE type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'GION_TOUR');
UPDATE tours SET booking_cutoff_hours = 48 WHERE type IN ('UJI_TOUR', 'UJI_WALKING_TOUR');

-- Create index for efficient queries
CREATE INDEX idx_tours_booking_cutoff ON tours(booking_cutoff_hours);
