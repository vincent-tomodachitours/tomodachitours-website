-- SQL to remove unused columns from Supabase tables
-- Run these commands carefully and test in a staging environment first

-- ============================================================================
-- COMPLETELY UNUSED TABLES (can be dropped entirely)
-- ============================================================================

-- Admin activity and audit logs are not used anywhere in the codebase
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;

-- Payment tables are not used in current implementation
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;

-- Discount codes table is not used
DROP TABLE IF EXISTS discount_codes CASCADE;

-- ============================================================================
-- UNUSED COLUMNS IN ACTIVE TABLES
-- ============================================================================

-- BOOKINGS TABLE - Remove unused columns
ALTER TABLE bookings DROP COLUMN IF EXISTS bokun_synced;
ALTER TABLE bookings DROP COLUMN IF EXISTS bokun_booking_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS external_source;
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS backup_payment_used;
ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_guide_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS guide_notes;
ALTER TABLE bookings DROP COLUMN IF EXISTS paid_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS discount_amount;

-- TOURS TABLE - Remove unused columns
ALTER TABLE tours DROP COLUMN IF EXISTS reviews;
ALTER TABLE tours DROP COLUMN IF EXISTS cancellation_cutoff_hours;
ALTER TABLE tours DROP COLUMN IF EXISTS cancellation_cutoff_hours_with_participant;
ALTER TABLE tours DROP COLUMN IF EXISTS next_day_cutoff_time;
ALTER TABLE tours DROP COLUMN IF EXISTS meeting_point;
ALTER TABLE tours DROP COLUMN IF EXISTS min_participants;

-- ============================================================================
-- BOKUN TABLES - These are used but only in admin context
-- ============================================================================
-- Keep these tables as they are actively used in admin booking service:
-- - bokun_availability_cache
-- - bokun_bookings_cache  
-- - bokun_cache_metadata
-- - bokun_products

-- ============================================================================
-- EMPLOYEE TABLES - Not used in current codebase
-- ============================================================================
-- These tables exist but are not referenced in the current codebase
-- Consider dropping if not needed for future features
-- DROP TABLE IF EXISTS employee_shifts CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;

-- ============================================================================
-- TRIPADVISOR TABLE - Not used in current implementation
-- ============================================================================
-- This table exists but TripAdvisor integration is not using it
-- DROP TABLE IF EXISTS tripadvisor_reviews_cache CASCADE;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- Tables dropped: 4 (admin_activity_log, admin_audit_logs, payment_attempts, payment_providers, discount_codes)
-- Columns removed from bookings: 10
-- Columns removed from tours: 6
-- Tables kept but unused: 3 (employee_shifts, employees, tripadvisor_reviews_cache)
-- Tables actively used: 5 (bookings, tours, bokun_*, tripadvisor_reviews_cache)