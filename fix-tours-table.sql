-- Fix Tours Table - Drop and Recreate with Proper Structure
-- Run this script in your Supabase SQL Editor

-- First, drop the existing tours table if it exists
DROP TABLE IF EXISTS public.tours CASCADE;

-- Now create the tours table with the correct structure
CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_type VARCHAR(50) NOT NULL CHECK (tour_type IN ('NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'GION_TOUR')),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    duration_hours DECIMAL(3,1) NOT NULL CHECK (duration_hours > 0),
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('easy', 'moderate', 'challenging')),
    meeting_point TEXT NOT NULL,
    meeting_point_lat DECIMAL(10,8),
    meeting_point_lng DECIMAL(11,8),
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    min_participants INTEGER NOT NULL CHECK (min_participants > 0),
    languages TEXT[] NOT NULL DEFAULT ARRAY['English'],
    included_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    excluded_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    cancellation_policy TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_min_max_participants CHECK (min_participants <= max_participants)
);

-- Insert sample tours
INSERT INTO public.tours (
    tour_type,
    name,
    description,
    short_description,
    duration_hours,
    difficulty_level,
    meeting_point,
    max_participants,
    min_participants,
    languages,
    included_items,
    excluded_items,
    requirements,
    cancellation_policy,
    status,
    featured
) VALUES 
(
    'NIGHT_TOUR',
    'Kyoto Night Food Tour',
    'Experience the vibrant nightlife of Kyoto while sampling authentic Japanese cuisine. This guided tour takes you through the historic Gion district and hidden local eateries where you''ll taste traditional dishes, learn about Japanese food culture, and discover the city''s after-dark atmosphere.',
    'Explore Kyoto''s culinary scene on this evening food tour through historic streets.',
    3.5,
    'easy',
    'JR Kyoto Station Central Exit',
    12,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Food tastings at 5-6 locations', 'Cultural insights', 'Walking tour map'],
    ARRAY['Personal expenses', 'Additional drinks', 'Transportation to/from meeting point'],
    ARRAY['Comfortable walking shoes', 'Weather-appropriate clothing', 'Small appetite before tour'],
    'Full refund if cancelled 24 hours in advance. 50% refund if cancelled 12-24 hours in advance. No refund for cancellations within 12 hours.',
    'active',
    TRUE
),
(
    'MORNING_TOUR',
    'Kyoto Morning Temple Walk',
    'Start your day with a peaceful morning walk through Kyoto''s most sacred temples. Visit Kiyomizu-dera, Sanjusangen-do, and other historic sites while learning about Buddhist culture and Japanese history. The tour includes a traditional tea ceremony experience.',
    'Begin your day with a serene temple tour and traditional tea ceremony in historic Kyoto.',
    4.0,
    'moderate',
    'Kiyomizu-dera Temple Main Gate',
    10,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Temple entrance fees', 'Tea ceremony experience', 'Cultural explanations'],
    ARRAY['Personal expenses', 'Lunch', 'Transportation'],
    ARRAY['Comfortable walking shoes', 'Respectful temple attire', 'Camera for photos'],
    'Full refund if cancelled 48 hours in advance. 50% refund if cancelled 24-48 hours in advance. No refund for cancellations within 24 hours.',
    'active',
    TRUE
),
(
    'UJI_TOUR',
    'Uji Green Tea Experience',
    'Discover the birthplace of Japanese green tea culture in the historic city of Uji. Visit traditional tea houses, learn about the tea-making process, and participate in a hands-on matcha grinding experience. The tour includes visits to Byodo-in Temple and the Tale of Genji Museum.',
    'Immerse yourself in Japanese tea culture with this comprehensive Uji tour including tastings and temple visits.',
    5.0,
    'easy',
    'JR Uji Station',
    8,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Tea tastings', 'Matcha grinding experience', 'Temple entrance fees', 'Museum admission'],
    ARRAY['Personal purchases', 'Lunch', 'Transportation to Uji'],
    ARRAY['Comfortable walking shoes', 'Interest in Japanese culture', 'Camera'],
    'Full refund if cancelled 48 hours in advance. 50% refund if cancelled 24-48 hours in advance. No refund for cancellations within 24 hours.',
    'active',
    FALSE
),
(
    'GION_TOUR',
    'Gion Geisha District Walking Tour',
    'Explore the famous Gion district, Kyoto''s premier geisha district. Walk through historic streets, learn about geisha culture, and visit traditional tea houses. With luck, you might spot a geiko or maiko on their way to appointments. The tour includes visits to Kennin-ji Temple and traditional architecture.',
    'Discover the mysterious world of geisha culture in Kyoto''s historic Gion district.',
    2.5,
    'easy',
    'Gion Corner',
    15,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Cultural insights', 'Photo opportunities', 'Temple visit'],
    ARRAY['Personal expenses', 'Tea house visits', 'Transportation'],
    ARRAY['Respectful behavior', 'No flash photography of geisha', 'Comfortable walking shoes'],
    'Full refund if cancelled 24 hours in advance. 50% refund if cancelled 12-24 hours in advance. No refund for cancellations within 12 hours.',
    'active',
    TRUE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users (simplified - allows all operations)
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON public.tours 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Success message
SELECT 'Tours table fixed and recreated! 🎉' AS message,
       'Created tours table with ' || COUNT(*) || ' sample tours' AS details
FROM public.tours; 