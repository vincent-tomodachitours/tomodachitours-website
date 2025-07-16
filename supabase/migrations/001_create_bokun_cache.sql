-- Create Bokun bookings cache table
CREATE TABLE bokun_bookings_cache (
    id BIGSERIAL PRIMARY KEY,
    bokun_booking_id TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL,
    
    -- Booking details
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    
    -- Participant counts
    adults INTEGER NOT NULL DEFAULT 0,
    children INTEGER NOT NULL DEFAULT 0,
    infants INTEGER NOT NULL DEFAULT 0,
    total_participants INTEGER NOT NULL DEFAULT 1,
    
    -- Tour information
    tour_type TEXT NOT NULL,
    tour_name TEXT,
    
    -- Pricing
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    
    -- External data
    confirmation_code TEXT,
    external_source TEXT DEFAULT 'bokun',
    
    -- Raw Bokun data (for debugging and future fields)
    raw_bokun_data JSONB,
    
    -- Cache metadata
    last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_bokun_cache_booking_date ON bokun_bookings_cache(booking_date);
CREATE INDEX idx_bokun_cache_product_id ON bokun_bookings_cache(product_id);
CREATE INDEX idx_bokun_cache_tour_type ON bokun_bookings_cache(tour_type);
CREATE INDEX idx_bokun_cache_last_synced ON bokun_bookings_cache(last_synced);
CREATE INDEX idx_bokun_cache_customer_email ON bokun_bookings_cache(customer_email);
CREATE INDEX idx_bokun_cache_status ON bokun_bookings_cache(status);

-- Composite index for common queries (date range + tour type)
CREATE INDEX idx_bokun_cache_date_tour ON bokun_bookings_cache(booking_date, tour_type);

-- Create cache metadata table to track sync status
CREATE TABLE bokun_cache_metadata (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT NOT NULL UNIQUE,
    last_full_sync TIMESTAMPTZ,
    last_incremental_sync TIMESTAMPTZ,
    total_bookings_cached INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'error'
    sync_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bokun_cache_updated_at 
    BEFORE UPDATE ON bokun_bookings_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bokun_cache_metadata_updated_at 
    BEFORE UPDATE ON bokun_cache_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (admin can access everything)
ALTER TABLE bokun_bookings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE bokun_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Policy for employees to read cached bookings
CREATE POLICY "Employees can read bokun cache" 
    ON bokun_bookings_cache FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.status = 'active'
        )
    );

-- Policy for employees to read cache metadata
CREATE POLICY "Employees can read cache metadata" 
    ON bokun_cache_metadata FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.status = 'active'
        )
    );

-- Policy for admin to manage cache
CREATE POLICY "Admins can manage bokun cache" 
    ON bokun_bookings_cache FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.role = 'admin'
            AND employees.status = 'active'
        )
    );

CREATE POLICY "Admins can manage cache metadata" 
    ON bokun_cache_metadata FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.user_id = auth.uid() 
            AND employees.role = 'admin'
            AND employees.status = 'active'
        )
    ); 