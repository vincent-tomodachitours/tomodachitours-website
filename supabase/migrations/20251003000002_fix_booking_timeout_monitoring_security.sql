-- Fix security issue with booking_request_timeout_monitoring view
-- Change from SECURITY DEFINER to SECURITY INVOKER for safer permissions

-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS booking_request_timeout_monitoring;

CREATE VIEW booking_request_timeout_monitoring
WITH (security_invoker = true)
AS
SELECT 
    b.id,
    b.customer_name,
    b.customer_email,
    b.tour_type,
    COALESCE(t.name, b.tour_type) AS tour_name,
    b.booking_date,
    b.status,
    b.request_submitted_at,
    EXTRACT(EPOCH FROM (NOW() - b.request_submitted_at)) / 3600 AS hours_pending,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - b.request_submitted_at)) / 3600 >= 48 THEN 'OVERDUE_AUTO_REJECT'
        WHEN EXTRACT(EPOCH FROM (NOW() - b.request_submitted_at)) / 3600 >= 24 THEN 'OVERDUE_CUSTOMER_NOTIFICATION'
        WHEN EXTRACT(EPOCH FROM (NOW() - b.request_submitted_at)) / 3600 >= 12 THEN 'OVERDUE_ADMIN_REMINDER'
        ELSE 'ON_TIME'
    END AS timeout_status,
    EXISTS(
        SELECT 1 FROM booking_request_events bre 
        WHERE bre.booking_id = b.id AND bre.event_type = 'timeout_reminder'
    ) AS admin_reminder_sent,
    EXISTS(
        SELECT 1 FROM booking_request_events bre 
        WHERE bre.booking_id = b.id AND bre.event_type = 'customer_delay_notification'
    ) AS customer_notification_sent
FROM bookings b
LEFT JOIN tours t ON t.type::text = b.tour_type::text
WHERE b.status = 'PENDING_CONFIRMATION'
ORDER BY b.request_submitted_at ASC;

-- Add comment
COMMENT ON VIEW booking_request_timeout_monitoring IS 'Monitoring view for booking request timeout status and processing (SECURITY INVOKER)';

-- Grant permissions for the monitoring view
GRANT SELECT ON booking_request_timeout_monitoring TO authenticated;

-- Note: This view now uses SECURITY INVOKER, which means it runs with the permissions
-- of the querying user rather than the view creator. This is safer but requires that
-- users have appropriate permissions on the underlying tables (bookings, tours, booking_request_events).
-- The existing RLS policies on these tables will properly restrict access.