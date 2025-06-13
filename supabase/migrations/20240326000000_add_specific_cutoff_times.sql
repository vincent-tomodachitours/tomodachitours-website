-- Add next_day_cutoff_time column to tours table
ALTER TABLE tours
ADD COLUMN IF NOT EXISTS next_day_cutoff_time TIME DEFAULT NULL;

-- Add comment to explain the format
COMMENT ON COLUMN tours.next_day_cutoff_time IS 'Time in HH:mm format when bookings for the next day should be cut off. Example: 23:00 means bookings for tomorrow will be cut off at 11pm today.';

-- Example of how to set next day cut-off time for a tour
-- UPDATE tours
-- SET next_day_cutoff_time = '23:00'
-- WHERE type = 'NIGHT_TOUR'; 