-- Tour Management System Database Setup
-- This script creates all the necessary tables for managing tours, pricing, schedules, and availability

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
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
    
    -- Constraints
    CONSTRAINT check_min_max_participants CHECK (min_participants <= max_participants)
);

-- Create tour_pricing table
CREATE TABLE IF NOT EXISTS tour_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    season_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    adult_price DECIMAL(10,2) NOT NULL CHECK (adult_price >= 0),
    child_price DECIMAL(10,2) NOT NULL CHECK (child_price >= 0),
    infant_price DECIMAL(10,2) NOT NULL CHECK (infant_price >= 0),
    group_discount_threshold INTEGER,
    group_discount_percentage DECIMAL(5,2),
    early_bird_days INTEGER,
    early_bird_discount DECIMAL(5,2),
    last_minute_hours INTEGER,
    last_minute_discount DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_pricing_dates CHECK (start_date <= end_date),
    CONSTRAINT check_discount_percentage CHECK (group_discount_percentage IS NULL OR (group_discount_percentage >= 0 AND group_discount_percentage <= 100)),
    CONSTRAINT check_early_bird_discount CHECK (early_bird_discount IS NULL OR (early_bird_discount >= 0 AND early_bird_discount <= 100)),
    CONSTRAINT check_last_minute_discount CHECK (last_minute_discount IS NULL OR (last_minute_discount >= 0 AND last_minute_discount <= 100))
);

-- Create tour_schedule table
CREATE TABLE IF NOT EXISTS tour_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    time_slot VARCHAR(20) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    seasonal_override JSONB, -- Store seasonal availability overrides
    max_participants_override INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tour_id, day_of_week, time_slot)
);

-- Create tour_availability table
CREATE TABLE IF NOT EXISTS tour_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    available_spots INTEGER NOT NULL CHECK (available_spots >= 0),
    is_blackout BOOLEAN NOT NULL DEFAULT FALSE,
    blackout_reason TEXT,
    price_override JSONB, -- Store price overrides for specific dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tour_id, date, time_slot)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON tours(featured);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON tours(created_at);

CREATE INDEX IF NOT EXISTS idx_tour_pricing_tour_id ON tour_pricing(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_pricing_dates ON tour_pricing(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tour_pricing_active ON tour_pricing(is_active);

CREATE INDEX IF NOT EXISTS idx_tour_schedule_tour_id ON tour_schedule(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_schedule_day_time ON tour_schedule(day_of_week, time_slot);

CREATE INDEX IF NOT EXISTS idx_tour_availability_tour_id ON tour_availability(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_availability_date ON tour_availability(date);
CREATE INDEX IF NOT EXISTS idx_tour_availability_blackout ON tour_availability(is_blackout);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tours_updated_at
    BEFORE UPDATE ON tours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_pricing_updated_at
    BEFORE UPDATE ON tour_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_schedule_updated_at
    BEFORE UPDATE ON tour_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_availability_updated_at
    BEFORE UPDATE ON tour_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add manage_tours permission if it doesn't exist
INSERT INTO admin_permissions (name, description)
VALUES ('manage_tours', 'Can create, edit, and delete tours')
ON CONFLICT (name) DO NOTHING;

-- Grant manage_tours permission to admin role
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
    ar.id,
    ap.id
FROM admin_roles ar
CROSS JOIN admin_permissions ap
WHERE ar.name = 'admin' AND ap.name = 'manage_tours'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert sample tours
INSERT INTO tours (
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
    'Explore Kyoto''s culinary scene on this evening food tour through historic streets and local restaurants.',
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

-- Insert sample pricing
INSERT INTO tour_pricing (
    tour_id,
    season_name,
    start_date,
    end_date,
    adult_price,
    child_price,
    infant_price,
    group_discount_threshold,
    group_discount_percentage,
    early_bird_days,
    early_bird_discount,
    is_active
) SELECT 
    t.id,
    'Standard Season',
    '2024-01-01',
    '2024-12-31',
    CASE 
        WHEN t.tour_type = 'NIGHT_TOUR' THEN 85.00
        WHEN t.tour_type = 'MORNING_TOUR' THEN 75.00
        WHEN t.tour_type = 'UJI_TOUR' THEN 95.00
        WHEN t.tour_type = 'GION_TOUR' THEN 65.00
    END,
    CASE 
        WHEN t.tour_type = 'NIGHT_TOUR' THEN 60.00
        WHEN t.tour_type = 'MORNING_TOUR' THEN 50.00
        WHEN t.tour_type = 'UJI_TOUR' THEN 70.00
        WHEN t.tour_type = 'GION_TOUR' THEN 45.00
    END,
    0.00,
    6,
    10.0,
    7,
    15.0,
    TRUE
FROM tours t;

-- Insert sample schedules
INSERT INTO tour_schedule (tour_id, day_of_week, time_slot, is_available)
SELECT 
    t.id,
    dow,
    CASE 
        WHEN t.tour_type = 'NIGHT_TOUR' THEN '18:00'
        WHEN t.tour_type = 'MORNING_TOUR' THEN '08:00'
        WHEN t.tour_type = 'UJI_TOUR' THEN '09:00'
        WHEN t.tour_type = 'GION_TOUR' THEN '15:00'
    END,
    TRUE
FROM tours t
CROSS JOIN generate_series(0, 6) dow
WHERE t.status = 'active';

-- Add additional time slots for popular tours
INSERT INTO tour_schedule (tour_id, day_of_week, time_slot, is_available)
SELECT 
    t.id,
    dow,
    CASE 
        WHEN t.tour_type = 'NIGHT_TOUR' THEN '19:30'
        WHEN t.tour_type = 'GION_TOUR' THEN '17:00'
    END,
    TRUE
FROM tours t
CROSS JOIN generate_series(0, 6) dow
WHERE t.tour_type IN ('NIGHT_TOUR', 'GION_TOUR') AND t.status = 'active';

-- Insert sample availability for the next 30 days
INSERT INTO tour_availability (tour_id, date, time_slot, available_spots)
SELECT 
    ts.tour_id,
    date_series.date,
    ts.time_slot,
    CASE 
        WHEN EXTRACT(DOW FROM date_series.date) IN (5, 6) THEN t.max_participants -- Friday/Saturday - full capacity
        ELSE t.max_participants - 2 -- Weekdays - leave some spots
    END
FROM tour_schedule ts
JOIN tours t ON ts.tour_id = t.id
CROSS JOIN generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    INTERVAL '1 day'
) date_series(date)
WHERE ts.is_available = TRUE
AND EXTRACT(DOW FROM date_series.date) = ts.day_of_week
AND t.status = 'active';

-- Create a view for tour availability with pricing
CREATE OR REPLACE VIEW tour_availability_with_pricing AS
SELECT 
    ta.id,
    ta.tour_id,
    t.name as tour_name,
    t.tour_type,
    ta.date,
    ta.time_slot,
    ta.available_spots,
    ta.is_blackout,
    ta.blackout_reason,
    tp.adult_price,
    tp.child_price,
    tp.infant_price,
    tp.group_discount_threshold,
    tp.group_discount_percentage,
    tp.early_bird_days,
    tp.early_bird_discount,
    ta.created_at,
    ta.updated_at
FROM tour_availability ta
JOIN tours t ON ta.tour_id = t.id
LEFT JOIN tour_pricing tp ON ta.tour_id = tp.tour_id 
    AND ta.date >= tp.start_date 
    AND ta.date <= tp.end_date 
    AND tp.is_active = TRUE;

-- Grant permissions for the admin system
GRANT SELECT, INSERT, UPDATE, DELETE ON tours TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_pricing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_schedule TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tour_availability TO authenticated;
GRANT SELECT ON tour_availability_with_pricing TO authenticated;

-- Enable RLS (Row Level Security) for the tour tables
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (admin system)
CREATE POLICY "Admin can manage all tours" ON tours FOR ALL USING (true);
CREATE POLICY "Admin can manage all tour pricing" ON tour_pricing FOR ALL USING (true);
CREATE POLICY "Admin can manage all tour schedules" ON tour_schedule FOR ALL USING (true);
CREATE POLICY "Admin can manage all tour availability" ON tour_availability FOR ALL USING (true);

-- Create a function to get tour statistics
CREATE OR REPLACE FUNCTION get_tour_stats()
RETURNS TABLE (
    total_tours INTEGER,
    active_tours INTEGER,
    featured_tours INTEGER,
    total_bookings INTEGER,
    avg_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tours,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_tours,
        COUNT(CASE WHEN featured = TRUE THEN 1 END)::INTEGER as featured_tours,
        0::INTEGER as total_bookings, -- Will be calculated from bookings table
        4.5::DECIMAL(3,2) as avg_rating -- Placeholder for future reviews system
    FROM tours;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tour_stats() TO authenticated;

COMMIT; 