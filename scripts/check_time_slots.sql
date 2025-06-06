-- Check all time slots for each tour
SELECT 
    ts.tour_name,
    tts.time_slot
FROM tour_time_slots tts
JOIN tour_settings ts ON tts.tour_id = ts.id
ORDER BY ts.tour_name, tts.time_slot;

-- Check if we have any time slots at all
SELECT COUNT(*) as total_time_slots FROM tour_time_slots; 