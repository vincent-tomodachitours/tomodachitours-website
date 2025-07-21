-- Fix Bokun Guide Assignment
-- Run this script to add guide assignment fields to the Bokun bookings cache table

-- Add guide assignment fields to Bokun bookings cache
ALTER TABLE bokun_bookings_cache 
ADD COLUMN IF NOT EXISTS assigned_guide_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS guide_notes TEXT;

-- Create index for guide assignments
CREATE INDEX IF NOT EXISTS idx_bokun_cache_assigned_guide ON bokun_bookings_cache(assigned_guide_id);

-- Add comments to document the purpose
COMMENT ON COLUMN bokun_bookings_cache.assigned_guide_id IS 'Guide assigned to this Bokun booking';
COMMENT ON COLUMN bokun_bookings_cache.guide_notes IS 'Notes for the assigned guide';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bokun_bookings_cache' 
AND column_name IN ('assigned_guide_id', 'guide_notes'); 