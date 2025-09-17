-- Add min_participants column to tours table
ALTER TABLE tours ADD COLUMN IF NOT EXISTS min_participants INTEGER NOT NULL DEFAULT 1;

-- Update existing tours with appropriate minimum participant values
-- These values can be adjusted based on your business requirements
UPDATE tours SET min_participants = 2 WHERE type = 'UJI_TOUR';
UPDATE tours SET min_participants = 1 WHERE type = 'NIGHT_TOUR';
UPDATE tours SET min_participants = 1 WHERE type = 'MORNING_TOUR';
UPDATE tours SET min_participants = 1 WHERE type = 'UJI_WALKING_TOUR';
UPDATE tours SET min_participants = 1 WHERE type = 'GION_TOUR';
UPDATE tours SET min_participants = 1 WHERE type = 'MUSIC_TOUR';

-- Add check constraints to ensure min_participants is positive and not greater than max_participants
-- Use DO block to handle existing constraints gracefully
DO $$
BEGIN
    -- Add constraint for positive min_participants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_min_participants_positive' 
        AND table_name = 'tours'
    ) THEN
        ALTER TABLE tours ADD CONSTRAINT check_min_participants_positive CHECK (min_participants > 0);
    END IF;
    
    -- Add constraint for min <= max participants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_min_max_participants' 
        AND table_name = 'tours'
    ) THEN
        ALTER TABLE tours ADD CONSTRAINT check_min_max_participants CHECK (min_participants <= max_participants);
    END IF;
END $$;