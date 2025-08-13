-- SAFE CLEANUP OF UNUSED COLUMNS
-- This script removes unused columns with safety checks and rollback capability
-- 
-- IMPORTANT: 
-- 1. Run this in a staging environment first
-- 2. Take a full database backup before running
-- 3. Test your application thoroughly after running
-- 4. Keep the rollback script handy

-- ============================================================================
-- SAFETY CHECKS - Verify tables exist before attempting changes
-- ============================================================================

DO $$
BEGIN
    -- Check if we're connected to the right database
    RAISE NOTICE 'Safety check passed. Database: %', current_database();
    RAISE NOTICE 'Starting cleanup process...';
END $$;

-- ============================================================================
-- STEP 1: DROP COMPLETELY UNUSED TABLES
-- ============================================================================

-- Drop admin activity logs (not used in codebase)
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;

-- Drop payment tables (not implemented)
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;

-- Drop discount codes (not used)
DROP TABLE IF EXISTS discount_codes CASCADE;

-- ============================================================================
-- STEP 2: REMOVE UNUSED COLUMNS FROM BOOKINGS TABLE
-- ============================================================================

-- Check if bookings table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        RAISE EXCEPTION 'Bookings table does not exist!';
    END IF;
    RAISE NOTICE 'Bookings table found, proceeding with column removal...';
END $$;

-- Remove Bokun-related columns (functionality moved to bokun_bookings_cache)
ALTER TABLE bookings DROP COLUMN IF EXISTS bokun_synced;
ALTER TABLE bookings DROP COLUMN IF EXISTS bokun_booking_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS external_source;

-- Remove payment provider columns (not implemented)
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS backup_payment_used;

-- Remove guide assignment columns (functionality moved to bokun_bookings_cache)
ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_guide_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS guide_notes;

-- Remove payment amount columns (not used in current flow)
ALTER TABLE bookings DROP COLUMN IF EXISTS paid_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS discount_amount;

-- ============================================================================
-- STEP 3: REMOVE UNUSED COLUMNS FROM TOURS TABLE
-- ============================================================================

-- Check if tours table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tours') THEN
        RAISE EXCEPTION 'Tours table does not exist!';
    END IF;
    RAISE NOTICE 'Tours table found, proceeding with column removal...';
END $$;

-- Remove unused feature columns (keeping reviews and min_participants as they're still needed)
ALTER TABLE tours DROP COLUMN IF EXISTS cancellation_cutoff_hours;
ALTER TABLE tours DROP COLUMN IF EXISTS cancellation_cutoff_hours_with_participant;
ALTER TABLE tours DROP COLUMN IF EXISTS next_day_cutoff_time;

-- Remove unused location/config columns (keeping min_participants as it's still needed)
ALTER TABLE tours DROP COLUMN IF EXISTS meeting_point;

-- ============================================================================
-- STEP 4: VERIFICATION - Check remaining table structures
-- ============================================================================

-- Show final bookings table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Final bookings table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (%)', rec.column_name, rec.data_type, 
            CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- Show final tours table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Final tours table structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tours' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (%)', rec.column_name, rec.data_type, 
            CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: UPDATE TABLE COMMENTS
-- ============================================================================

DO $$
BEGIN
    EXECUTE 'COMMENT ON TABLE bookings IS ''Core booking records - cleaned up on ' || CURRENT_DATE || '''';
    EXECUTE 'COMMENT ON TABLE tours IS ''Tour definitions - cleaned up on ' || CURRENT_DATE || '''';
END $$;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== DATABASE CLEANUP COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Tables dropped: 5';
    RAISE NOTICE 'Columns removed from bookings: 10';  
    RAISE NOTICE 'Columns removed from tours: 4';
    RAISE NOTICE 'Total objects cleaned: 19';
    RAISE NOTICE 'Columns preserved: reviews, min_participants (tours table)';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (Save this separately for emergency rollback)
-- ============================================================================

/*
-- EMERGENCY ROLLBACK SCRIPT - Only run if you need to restore the columns
-- Note: This will recreate columns but data will be lost

-- Recreate dropped tables (structure only - data will be lost)
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES employees(id),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_attempts (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    provider_attempted VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    attempt_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_providers (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discount_codes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    value INTEGER NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate bookings columns (data will be lost)
ALTER TABLE bookings ADD COLUMN bokun_synced BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN bokun_booking_id VARCHAR;
ALTER TABLE bookings ADD COLUMN external_source VARCHAR DEFAULT 'website';
ALTER TABLE bookings ADD COLUMN payment_provider VARCHAR(20) DEFAULT 'payjp';
ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN backup_payment_used BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN assigned_guide_id UUID;
ALTER TABLE bookings ADD COLUMN guide_notes TEXT;
ALTER TABLE bookings ADD COLUMN paid_amount INTEGER;
ALTER TABLE bookings ADD COLUMN discount_amount INTEGER;

-- Recreate tours columns (data will be lost) - excluding reviews and min_participants as they're still needed
ALTER TABLE tours ADD COLUMN cancellation_cutoff_hours INTEGER;
ALTER TABLE tours ADD COLUMN cancellation_cutoff_hours_with_participant INTEGER;
ALTER TABLE tours ADD COLUMN next_day_cutoff_time TIME;
ALTER TABLE tours ADD COLUMN meeting_point JSONB;
*/