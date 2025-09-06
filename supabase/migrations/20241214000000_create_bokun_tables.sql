-- Bokun Integration Tables Migration
-- This migration adds the necessary tables for Bokun REST API integration

-- Bokun product mapping table
CREATE TABLE bokun_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_tour_type VARCHAR NOT NULL, -- 'NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'GION_TOUR'
    bokun_product_id VARCHAR NOT NULL,
    bokun_variant_id VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(local_tour_type, bokun_product_id)
);

-- Bokun booking sync table
CREATE TABLE bokun_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_booking_id INTEGER REFERENCES bookings(id),
    bokun_booking_id VARCHAR NOT NULL,
    bokun_confirmation_code VARCHAR,
    sync_status VARCHAR DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    last_sync_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(local_booking_id),
    UNIQUE(bokun_booking_id)
);

-- Availability cache table
CREATE TABLE bokun_availability_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bokun_product_id VARCHAR NOT NULL,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    available_spots INTEGER NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes',
    UNIQUE(bokun_product_id, date, time_slot)
);

-- Add Bokun tracking columns to existing bookings table
ALTER TABLE bookings ADD COLUMN bokun_synced BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN bokun_booking_id VARCHAR;
ALTER TABLE bookings ADD COLUMN external_source VARCHAR DEFAULT 'website';

-- Create indexes for better performance
CREATE INDEX idx_bokun_products_tour_type ON bokun_products(local_tour_type);
CREATE INDEX idx_bokun_bookings_local_id ON bokun_bookings(local_booking_id);
CREATE INDEX idx_bokun_bookings_sync_status ON bokun_bookings(sync_status);
CREATE INDEX idx_bokun_availability_cache_product_date ON bokun_availability_cache(bokun_product_id, date);
CREATE INDEX idx_bokun_availability_cache_expires ON bokun_availability_cache(expires_at);

-- Add updated_at trigger for bokun_products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bokun_products_updated_at 
    BEFORE UPDATE ON bokun_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default product mappings (these will need to be configured with actual Bokun product IDs)
INSERT INTO bokun_products (local_tour_type, bokun_product_id, bokun_variant_id, is_active) VALUES
('NIGHT_TOUR', 'bokun_night_tour_id_placeholder', NULL, false),
('MORNING_TOUR', 'bokun_morning_tour_id_placeholder', NULL, false),
('UJI_TOUR', 'bokun_uji_tour_id_placeholder', NULL, false),
('GION_TOUR', 'bokun_gion_tour_id_placeholder', NULL, false)
ON CONFLICT (local_tour_type, bokun_product_id) DO NOTHING;

COMMENT ON TABLE bokun_products IS 'Maps local tour types to Bokun product IDs for API integration';
COMMENT ON TABLE bokun_bookings IS 'Tracks synchronization status between local bookings and Bokun bookings';
COMMENT ON TABLE bokun_availability_cache IS 'Caches availability data from Bokun API to reduce API calls';
COMMENT ON COLUMN bookings.bokun_synced IS 'Indicates if this booking has been successfully synced to Bokun';
COMMENT ON COLUMN bookings.bokun_booking_id IS 'The corresponding booking ID in Bokun system';
COMMENT ON COLUMN bookings.external_source IS 'Source of the booking: website, viator, etc.'; 