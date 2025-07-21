-- Add guide assignment fields to Bokun bookings cache
-- This allows Bokun bookings to have assigned guides just like website bookings

ALTER TABLE bokun_bookings_cache 
ADD COLUMN assigned_guide_id UUID REFERENCES employees(id),
ADD COLUMN guide_notes TEXT;

-- Create index for guide assignments
CREATE INDEX idx_bokun_cache_assigned_guide ON bokun_bookings_cache(assigned_guide_id);

-- Update the updated_at trigger to work with new columns
-- (The existing trigger will automatically handle this)

-- Add a comment to document the purpose
COMMENT ON COLUMN bokun_bookings_cache.assigned_guide_id IS 'Guide assigned to this Bokun booking';
COMMENT ON COLUMN bokun_bookings_cache.guide_notes IS 'Notes for the assigned guide'; 