-- Update Existing Tours Table - Add Missing Columns
-- This script works with your existing tours table structure
-- Run this script in your Supabase SQL Editor

-- Add missing columns to existing tours table
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3,1);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point_lat DECIMAL(10,8);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point_lng DECIMAL(11,8);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS included_items TEXT[];
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS excluded_items TEXT[];
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS requirements TEXT[];
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS featured BOOLEAN;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Set default values for new columns
UPDATE public.tours SET 
    short_description = COALESCE(short_description, LEFT(description, 200)),
    duration_hours = COALESCE(duration_hours, 3.0),
    difficulty_level = COALESCE(difficulty_level, 'easy'),
    meeting_point = COALESCE(meeting_point, 'JR Kyoto Station'),
    min_participants = COALESCE(min_participants, 1),
    languages = COALESCE(languages, ARRAY['English']),
    included_items = COALESCE(included_items, ARRAY[]::TEXT[]),
    excluded_items = COALESCE(excluded_items, ARRAY[]::TEXT[]),
    requirements = COALESCE(requirements, ARRAY[]::TEXT[]),
    cancellation_policy = COALESCE(cancellation_policy, 'Standard cancellation policy applies.'),
    images = COALESCE(images, ARRAY[]::TEXT[]),
    status = COALESCE(status, 'active'),
    featured = COALESCE(featured, FALSE),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE id IS NOT NULL;

-- Add constraints
ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_duration_hours 
    CHECK (duration_hours > 0);

ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_difficulty_level 
    CHECK (difficulty_level IN ('easy', 'moderate', 'challenging'));

ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_max_participants 
    CHECK (max_participants > 0);

ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_min_participants 
    CHECK (min_participants > 0);

ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_min_max_participants 
    CHECK (min_participants <= max_participants);

ALTER TABLE public.tours ADD CONSTRAINT IF NOT EXISTS check_status 
    CHECK (status IN ('active', 'inactive', 'draft'));

-- Set NOT NULL constraints for required fields
ALTER TABLE public.tours ALTER COLUMN short_description SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN duration_hours SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN difficulty_level SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN meeting_point SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN min_participants SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN languages SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN included_items SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN excluded_items SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN requirements SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN cancellation_policy SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN images SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN featured SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.tours ALTER COLUMN updated_at SET NOT NULL;

-- Set default values for new columns
ALTER TABLE public.tours ALTER COLUMN duration_hours SET DEFAULT 3.0;
ALTER TABLE public.tours ALTER COLUMN difficulty_level SET DEFAULT 'easy';
ALTER TABLE public.tours ALTER COLUMN min_participants SET DEFAULT 1;
ALTER TABLE public.tours ALTER COLUMN languages SET DEFAULT ARRAY['English'];
ALTER TABLE public.tours ALTER COLUMN included_items SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tours ALTER COLUMN excluded_items SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tours ALTER COLUMN requirements SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tours ALTER COLUMN images SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tours ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.tours ALTER COLUMN featured SET DEFAULT FALSE;
ALTER TABLE public.tours ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.tours ALTER COLUMN updated_at SET DEFAULT NOW();

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tours;

-- Create RLS policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.tours
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
GRANT ALL ON public.tours TO anon;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_tours_updated_at ON public.tours;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON public.tours 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Success message
SELECT 'Tours table updated successfully! 🎉' AS message,
       'Updated existing tours table with ' || COUNT(*) || ' tours' AS details
FROM public.tours; 