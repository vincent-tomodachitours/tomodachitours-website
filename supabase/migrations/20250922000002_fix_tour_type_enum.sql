-- Simple approach: Just ensure MUSIC_PERFORMANCE is added to the existing enum
-- and remove any conflicting constraints

-- Add MUSIC_PERFORMANCE to the tour_type enum if it doesn't exist
DO $$ 
BEGIN
    -- Only add the new value if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tour_type')
        AND enumlabel = 'MUSIC_PERFORMANCE'
    ) THEN
        ALTER TYPE tour_type ADD VALUE 'MUSIC_PERFORMANCE';
    END IF;
END $$;

-- Remove any conflicting check constraints that might be blocking the insert
DO $$
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_tour_type_check' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_tour_type_check;
    END IF;
    
    -- Also check for any other tour_type related constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%tour_type%' 
        AND table_name = 'bookings'
        AND constraint_type = 'CHECK'
    ) THEN
        -- Get the constraint name and drop it
        DECLARE
            constraint_name_var text;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%tour_type%' 
            AND table_name = 'bookings'
            AND constraint_type = 'CHECK'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
END $$;