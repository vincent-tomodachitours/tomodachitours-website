-- Add MUSIC_PERFORMANCE to the tour_type enum
ALTER TYPE tour_type ADD VALUE IF NOT EXISTS 'MUSIC_PERFORMANCE';

-- Add new MUSIC_PERFORMANCE tour based on existing MUSIC_TOUR
-- Using only columns that definitely exist based on the provided data structure
INSERT INTO tours (
    name,
    type,
    description,
    base_price,
    original_price,
    duration_minutes,
    time_slots,
    max_participants,
    min_participants,
    meeting_point,
    reviews
) VALUES (
    'Kyoto Live Music Performance Experience',
    'MUSIC_PERFORMANCE',
    'Experience the vibrant live music scene of Kyoto on this immersive cultural journey. Discover intimate venues, traditional performances, and the modern music culture that thrives in Japan''s ancient capital.

✅ English Speaking Guide – Professional guide to lead you through Kyoto''s music districts and cultural venues.

✅ Live Music Performance Experience – Enjoy intimate live performances featuring local artists and traditional Japanese instruments.

✅ Traditional Instrument Demonstration – Learn about and experience traditional Japanese instruments like koto, shamisen, and shakuhachi.

✅ Cultural Venue Access – Visit authentic music venues and cultural spaces showcasing Kyoto''s musical heritage.',
    26600,
    26600,
    240,
    '[{"date": "2025-10-02", "time": "18:00", "available_spots": 12}]',
    12,
    1,
    '{"location": "Kyoto Station Central Exit", "additional_info": "Meet near the central information desk inside Kyoto Station.", "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9"}',
    0
);