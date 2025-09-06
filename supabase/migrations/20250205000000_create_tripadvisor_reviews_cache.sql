-- Create tripadvisor_reviews_cache table for caching TripAdvisor reviews data
CREATE TABLE IF NOT EXISTS tripadvisor_reviews_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id VARCHAR(50) NOT NULL UNIQUE,
    reviews_data JSONB NOT NULL,
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    ranking_data JSONB,
    business_name VARCHAR(255),
    tripadvisor_url TEXT,
    cached_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tripadvisor_cache_location_id ON tripadvisor_reviews_cache(location_id);
CREATE INDEX IF NOT EXISTS idx_tripadvisor_cache_expires_at ON tripadvisor_reviews_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tripadvisor_cache_cached_at ON tripadvisor_reviews_cache(cached_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tripadvisor_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_tripadvisor_cache_updated_at
    BEFORE UPDATE ON tripadvisor_reviews_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_tripadvisor_cache_updated_at();

-- Add comments to explain the table structure
COMMENT ON TABLE tripadvisor_reviews_cache IS 'Caches TripAdvisor reviews data to minimize API calls and improve performance';
COMMENT ON COLUMN tripadvisor_reviews_cache.location_id IS 'TripAdvisor location ID for the business';
COMMENT ON COLUMN tripadvisor_reviews_cache.reviews_data IS 'JSON array of review objects from TripAdvisor API';
COMMENT ON COLUMN tripadvisor_reviews_cache.overall_rating IS 'Overall business rating from TripAdvisor (0-5 scale)';
COMMENT ON COLUMN tripadvisor_reviews_cache.total_reviews IS 'Total number of reviews for this location';
COMMENT ON COLUMN tripadvisor_reviews_cache.ranking_data IS 'TripAdvisor ranking information (JSON object)';
COMMENT ON COLUMN tripadvisor_reviews_cache.business_name IS 'Business name from TripAdvisor';
COMMENT ON COLUMN tripadvisor_reviews_cache.tripadvisor_url IS 'Direct URL to TripAdvisor listing';
COMMENT ON COLUMN tripadvisor_reviews_cache.cached_at IS 'When this data was cached';
COMMENT ON COLUMN tripadvisor_reviews_cache.expires_at IS 'When this cached data expires (6 hours from cached_at)';

-- Create a function to check if cached data is still valid
CREATE OR REPLACE FUNCTION is_tripadvisor_cache_valid(location_id_param VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    cache_expires_at TIMESTAMPTZ;
BEGIN
    SELECT expires_at INTO cache_expires_at
    FROM tripadvisor_reviews_cache
    WHERE location_id = location_id_param;
    
    -- Return false if no cache entry found
    IF cache_expires_at IS NULL THEN
        RETURN false;
    END IF;
    
    -- Return true if cache hasn't expired yet
    RETURN cache_expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get valid cached reviews
CREATE OR REPLACE FUNCTION get_cached_tripadvisor_reviews(location_id_param VARCHAR(50))
RETURNS TABLE(
    reviews_data JSONB,
    overall_rating DECIMAL(3,2),
    total_reviews INTEGER,
    ranking_data JSONB,
    business_name VARCHAR(255),
    tripadvisor_url TEXT,
    cached_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        trc.reviews_data,
        trc.overall_rating,
        trc.total_reviews,
        trc.ranking_data,
        trc.business_name,
        trc.tripadvisor_url,
        trc.cached_at
    FROM tripadvisor_reviews_cache trc
    WHERE trc.location_id = location_id_param
        AND trc.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- Create a function to upsert cache data
CREATE OR REPLACE FUNCTION upsert_tripadvisor_cache(
    location_id_param VARCHAR(50),
    reviews_data_param JSONB,
    overall_rating_param DECIMAL(3,2) DEFAULT NULL,
    total_reviews_param INTEGER DEFAULT 0,
    ranking_data_param JSONB DEFAULT NULL,
    business_name_param VARCHAR(255) DEFAULT NULL,
    tripadvisor_url_param TEXT DEFAULT NULL,
    cache_duration_hours INTEGER DEFAULT 6
)
RETURNS UUID AS $$
DECLARE
    cache_id UUID;
    expires_timestamp TIMESTAMPTZ;
BEGIN
    expires_timestamp := now() + (cache_duration_hours || ' hours')::INTERVAL;
    
    INSERT INTO tripadvisor_reviews_cache (
        location_id,
        reviews_data,
        overall_rating,
        total_reviews,
        ranking_data,
        business_name,
        tripadvisor_url,
        expires_at
    ) VALUES (
        location_id_param,
        reviews_data_param,
        overall_rating_param,
        total_reviews_param,
        ranking_data_param,
        business_name_param,
        tripadvisor_url_param,
        expires_timestamp
    )
    ON CONFLICT (location_id) DO UPDATE SET
        reviews_data = EXCLUDED.reviews_data,
        overall_rating = EXCLUDED.overall_rating,
        total_reviews = EXCLUDED.total_reviews,
        ranking_data = EXCLUDED.ranking_data,
        business_name = EXCLUDED.business_name,
        tripadvisor_url = EXCLUDED.tripadvisor_url,
        cached_at = now(),
        expires_at = expires_timestamp,
        updated_at = now()
    RETURNING id INTO cache_id;
    
    RETURN cache_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for the functions
COMMENT ON FUNCTION is_tripadvisor_cache_valid(VARCHAR(50)) IS 'Checks if cached TripAdvisor data is still valid for a given location ID';
COMMENT ON FUNCTION get_cached_tripadvisor_reviews(VARCHAR(50)) IS 'Returns valid cached TripAdvisor reviews data for a location';
COMMENT ON FUNCTION upsert_tripadvisor_cache(VARCHAR(50), JSONB, DECIMAL(3,2), INTEGER, JSONB, VARCHAR(255), TEXT, INTEGER) IS 'Inserts or updates TripAdvisor cache data with configurable expiration';

-- Create a cleanup function to remove expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_tripadvisor_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tripadvisor_reviews_cache
    WHERE expires_at < now() - INTERVAL '24 hours'; -- Keep expired entries for 24 hours as backup
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tripadvisor_cache() IS 'Removes expired TripAdvisor cache entries older than 24 hours';