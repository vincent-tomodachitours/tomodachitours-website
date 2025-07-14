-- Simple Tour Management System Setup for Supabase
-- Run this script in your Supabase SQL Editor

-- Create tours table
CREATE TABLE IF NOT EXISTS public.tours (
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

-- Add manage_tours permission
INSERT INTO public.admin_permissions (name, description)
VALUES ('manage_tours', 'Can create, edit, and delete tours')
ON CONFLICT (name) DO NOTHING;

-- Grant manage_tours permission to admin role
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT 
    ar.id,
    ap.id
FROM public.admin_roles ar
CROSS JOIN public.admin_permissions ap
WHERE ar.name = 'admin' AND ap.name = 'manage_tours'
ON CONFLICT (role_id, permission_id) DO NOTHING;

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
    'Experience the vibrant nightlife of Kyoto while sampling authentic Japanese cuisine. This guided tour takes you through the historic Gion district and hidden local eateries.',
    'Explore Kyoto''s culinary scene on this evening food tour.',
    3.5,
    'easy',
    'JR Kyoto Station Central Exit',
    12,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Food tastings', 'Cultural insights'],
    ARRAY['Personal expenses', 'Additional drinks'],
    ARRAY['Comfortable walking shoes', 'Weather-appropriate clothing'],
    'Full refund if cancelled 24 hours in advance. No refund for cancellations within 12 hours.',
    'active',
    TRUE
),
(
    'MORNING_TOUR',
    'Kyoto Morning Temple Walk',
    'Start your day with a peaceful morning walk through Kyoto''s most sacred temples. Visit historic sites while learning about Buddhist culture.',
    'Begin your day with a serene temple tour in historic Kyoto.',
    4.0,
    'moderate',
    'Kiyomizu-dera Temple Main Gate',
    10,
    2,
    ARRAY['English', 'Japanese'],
    ARRAY['Professional guide', 'Temple entrance fees', 'Cultural explanations'],
    ARRAY['Personal expenses', 'Lunch', 'Transportation'],
    ARRAY['Comfortable walking shoes', 'Respectful temple attire'],
    'Full refund if cancelled 48 hours in advance. No refund for cancellations within 24 hours.',
    'active',
    TRUE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Allow authenticated users to manage tours" ON public.tours
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role; 