-- 1. Check total number of bookings per tour
SELECT 
    ts.tour_name,
    COUNT(b.id) as total_bookings,
    COUNT(DISTINCT b.booking_date) as unique_dates,
    MIN(b.booking_date) as earliest_booking,
    MAX(b.booking_date) as latest_booking
FROM bookings b
JOIN tour_settings ts ON b.tour_id = ts.id
GROUP BY ts.tour_name
ORDER BY ts.tour_name;

-- 2. Check booking status distribution
SELECT 
    ts.tour_name,
    b.status,
    COUNT(*) as count
FROM bookings b
JOIN tour_settings ts ON b.tour_id = ts.id
GROUP BY ts.tour_name, b.status
ORDER BY ts.tour_name, b.status;

-- 3. Check time slot distribution
SELECT 
    ts.tour_name,
    tts.time_slot,
    COUNT(*) as booking_count
FROM bookings b
JOIN tour_settings ts ON b.tour_id = ts.id
JOIN tour_time_slots tts ON b.time_slot_id = tts.id
GROUP BY ts.tour_name, tts.time_slot
ORDER BY ts.tour_name, tts.time_slot;

-- 4. Check discount code usage
SELECT 
    ts.tour_name,
    dc.code,
    COUNT(*) as usage_count
FROM bookings b
JOIN tour_settings ts ON b.tour_id = ts.id
LEFT JOIN discount_codes dc ON b.discount_code_id = dc.id
GROUP BY ts.tour_name, dc.code
ORDER BY ts.tour_name, usage_count DESC;

-- 5. Check for any potential data issues
-- 5.1 Check for bookings with invalid tour_id
SELECT COUNT(*) as invalid_tour_count
FROM bookings b
LEFT JOIN tour_settings ts ON b.tour_id = ts.id
WHERE ts.id IS NULL;

-- 5.2 Check for bookings with invalid time_slot_id
SELECT COUNT(*) as invalid_time_slot_count
FROM bookings b
LEFT JOIN tour_time_slots tts ON b.time_slot_id = tts.id
WHERE tts.id IS NULL;

-- 5.3 Check for bookings with invalid discount_code_id
SELECT COUNT(*) as invalid_discount_code_count
FROM bookings b
LEFT JOIN discount_codes dc ON b.discount_code_id = dc.id
WHERE b.discount_code_id IS NOT NULL AND dc.id IS NULL;

-- 5.4 Check for bookings with zero participants
SELECT COUNT(*) as zero_participants_count
FROM bookings b
WHERE (b.adults + b.children + b.infants) = 0;

-- 6. Sample of recent bookings for each tour
WITH recent_bookings AS (
    SELECT 
        ts.tour_name,
        b.*,
        tts.time_slot,
        dc.code as discount_code,
        ROW_NUMBER() OVER (PARTITION BY ts.tour_name ORDER BY b.created_at DESC) as rn
    FROM bookings b
    JOIN tour_settings ts ON b.tour_id = ts.id
    JOIN tour_time_slots tts ON b.time_slot_id = tts.id
    LEFT JOIN discount_codes dc ON b.discount_code_id = dc.id
)
SELECT 
    tour_name,
    booking_date,
    time_slot,
    adults,
    children,
    infants,
    contact_name,
    contact_email,
    status,
    discount_code,
    created_at
FROM recent_bookings
WHERE rn <= 5
ORDER BY tour_name, created_at DESC; 