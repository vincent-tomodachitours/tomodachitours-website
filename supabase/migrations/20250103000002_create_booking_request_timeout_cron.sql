-- Create cron jobs for booking request timeout handling
-- This migration sets up automated cron jobs to handle booking request timeouts

-- First, ensure pg_cron extension is enabled (should already be from previous migration)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to call the timeout handler Edge Function
CREATE OR REPLACE FUNCTION call_booking_request_timeout_handler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    response_status integer;
    response_body text;
    supabase_url text;
    service_role_key text;
BEGIN
    -- Get environment variables (these should be set in Supabase)
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If environment variables are not set, use defaults for local development
    IF supabase_url IS NULL OR supabase_url = '' THEN
        supabase_url := 'http://127.0.0.1:54321';
    END IF;
    
    IF service_role_key IS NULL OR service_role_key = '' THEN
        -- In production, this should be set properly
        RAISE WARNING 'Service role key not configured for timeout handler';
        RETURN;
    END IF;

    -- Call the timeout handler Edge Function
    SELECT status, content INTO response_status, response_body
    FROM http((
        'POST',
        supabase_url || '/functions/v1/booking-request-timeout-handler',
        ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{"action": "process_all"}'
    ));

    -- Log the result
    IF response_status = 200 THEN
        RAISE NOTICE 'Booking request timeout handler completed successfully: %', response_body;
    ELSE
        RAISE WARNING 'Booking request timeout handler failed with status %: %', response_status, response_body;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error calling booking request timeout handler: %', SQLERRM;
END;
$$;

-- Create a simpler function for manual testing that doesn't require HTTP calls
CREATE OR REPLACE FUNCTION process_booking_request_timeouts_local()
RETURNS TABLE(
    action_type text,
    processed_count integer,
    details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    admin_reminders_count integer := 0;
    customer_notifications_count integer := 0;
    auto_rejections_count integer := 0;
    cleanup_count integer := 0;
    reminder_cutoff timestamp with time zone;
    notification_cutoff timestamp with time zone;
    rejection_cutoff timestamp with time zone;
    cleanup_cutoff timestamp with time zone;
    booking_record record;
BEGIN
    -- Set cutoff times
    reminder_cutoff := NOW() - INTERVAL '12 hours';
    notification_cutoff := NOW() - INTERVAL '24 hours';
    rejection_cutoff := NOW() - INTERVAL '48 hours';
    cleanup_cutoff := NOW() - INTERVAL '72 hours';

    -- Process admin reminders
    FOR booking_record IN
        SELECT b.id, b.customer_name, b.customer_email, b.request_submitted_at
        FROM bookings b
        WHERE b.status = 'PENDING_CONFIRMATION'
        AND b.request_submitted_at < reminder_cutoff
        AND b.admin_reviewed_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM booking_request_events bre
            WHERE bre.booking_id = b.id
            AND bre.event_type = 'timeout_reminder'
        )
    LOOP
        -- Log admin reminder event
        INSERT INTO booking_request_events (
            booking_id,
            event_type,
            event_data,
            created_by
        ) VALUES (
            booking_record.id,
            'timeout_reminder',
            jsonb_build_object(
                'reminder_type', 'admin',
                'hours_pending', EXTRACT(EPOCH FROM (NOW() - booking_record.request_submitted_at)) / 3600,
                'sent_at', NOW()
            ),
            'system_cron'
        );
        
        admin_reminders_count := admin_reminders_count + 1;
    END LOOP;

    -- Process customer delay notifications
    FOR booking_record IN
        SELECT b.id, b.customer_name, b.customer_email, b.request_submitted_at
        FROM bookings b
        WHERE b.status = 'PENDING_CONFIRMATION'
        AND b.request_submitted_at < notification_cutoff
        AND NOT EXISTS (
            SELECT 1 FROM booking_request_events bre
            WHERE bre.booking_id = b.id
            AND bre.event_type = 'customer_delay_notification'
        )
    LOOP
        -- Log customer delay notification event
        INSERT INTO booking_request_events (
            booking_id,
            event_type,
            event_data,
            created_by
        ) VALUES (
            booking_record.id,
            'customer_delay_notification',
            jsonb_build_object(
                'hours_pending', EXTRACT(EPOCH FROM (NOW() - booking_record.request_submitted_at)) / 3600,
                'sent_at', NOW()
            ),
            'system_cron'
        );
        
        customer_notifications_count := customer_notifications_count + 1;
    END LOOP;

    -- Process auto-rejections
    FOR booking_record IN
        SELECT b.id, b.customer_name, b.customer_email, b.request_submitted_at
        FROM bookings b
        WHERE b.status = 'PENDING_CONFIRMATION'
        AND b.request_submitted_at < rejection_cutoff
    LOOP
        -- Update booking status to REJECTED
        UPDATE bookings
        SET 
            status = 'REJECTED',
            admin_reviewed_at = NOW(),
            admin_reviewed_by = 'system_auto_reject',
            rejection_reason = 'Automatically rejected after 48 hours without admin review'
        WHERE id = booking_record.id;

        -- Log auto-rejection event
        INSERT INTO booking_request_events (
            booking_id,
            event_type,
            event_data,
            created_by
        ) VALUES (
            booking_record.id,
            'auto_rejected',
            jsonb_build_object(
                'hours_pending', 48,
                'rejection_reason', 'Automatically rejected after 48 hours without admin review',
                'auto_rejected_at', NOW()
            ),
            'system_cron'
        );
        
        auto_rejections_count := auto_rejections_count + 1;
    END LOOP;

    -- Cleanup payment method references for old rejected bookings
    FOR booking_record IN
        SELECT b.id, b.payment_method_id
        FROM bookings b
        WHERE b.status = 'REJECTED'
        AND b.payment_method_id IS NOT NULL
        AND b.admin_reviewed_at < cleanup_cutoff
    LOOP
        -- Clear payment method reference
        UPDATE bookings
        SET payment_method_id = NULL
        WHERE id = booking_record.id;

        -- Log cleanup event
        INSERT INTO booking_request_events (
            booking_id,
            event_type,
            event_data,
            created_by
        ) VALUES (
            booking_record.id,
            'payment_method_cleanup',
            jsonb_build_object(
                'payment_method_id', booking_record.payment_method_id,
                'cleaned_at', NOW()
            ),
            'system_cron'
        );
        
        cleanup_count := cleanup_count + 1;
    END LOOP;

    -- Return results
    RETURN QUERY VALUES
        ('admin_reminders', admin_reminders_count, jsonb_build_object('cutoff_time', reminder_cutoff)),
        ('customer_notifications', customer_notifications_count, jsonb_build_object('cutoff_time', notification_cutoff)),
        ('auto_rejections', auto_rejections_count, jsonb_build_object('cutoff_time', rejection_cutoff)),
        ('payment_cleanups', cleanup_count, jsonb_build_object('cutoff_time', cleanup_cutoff));
END;
$;

-- Schedule cron jobs
-- Note: In production, these should be scheduled appropriately
-- For now, we'll create them but they may need to be enabled manually

-- Run timeout processing every 2 hours
SELECT cron.schedule(
    'booking-request-timeout-handler',
    '0 */2 * * *', -- Every 2 hours at minute 0
    'SELECT call_booking_request_timeout_handler();'
);

-- Alternative: Run local processing every hour (fallback if HTTP calls don't work)
SELECT cron.schedule(
    'booking-request-timeout-local',
    '30 * * * *', -- Every hour at minute 30
    'SELECT * FROM process_booking_request_timeouts_local();'
);

-- Create a function to manually trigger timeout processing (for testing)
CREATE OR REPLACE FUNCTION trigger_booking_request_timeout_processing()
RETURNS TABLE(
    action_type text,
    processed_count integer,
    details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    RETURN QUERY SELECT * FROM process_booking_request_timeouts_local();
END;
$;

-- Create indexes for better performance on timeout queries
CREATE INDEX IF NOT EXISTS idx_bookings_timeout_queries 
ON bookings(status, request_submitted_at, admin_reviewed_at) 
WHERE status IN ('PENDING_CONFIRMATION', 'REJECTED');

CREATE INDEX IF NOT EXISTS idx_booking_request_events_timeout_lookup
ON booking_request_events(booking_id, event_type)
WHERE event_type IN ('timeout_reminder', 'customer_delay_notification', 'auto_rejected');

-- Add comments for documentation
COMMENT ON FUNCTION call_booking_request_timeout_handler() IS 'Calls the booking request timeout handler Edge Function via HTTP';
COMMENT ON FUNCTION process_booking_request_timeouts_local() IS 'Processes booking request timeouts locally without HTTP calls';
COMMENT ON FUNCTION trigger_booking_request_timeout_processing() IS 'Manually triggers timeout processing for testing purposes';

-- Create a view for monitoring timeout processing
CREATE OR REPLACE VIEW booking_request_timeout_monitoring AS
SELECT 
    b.id,
    b.customer_name,
    b.customer_email,
    b.tour_name,
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
WHERE b.status = 'PENDING_CONFIRMATION'
ORDER BY b.request_submitted_at ASC;

COMMENT ON VIEW booking_request_timeout_monitoring IS 'Monitoring view for booking request timeout status and processing';

-- Grant permissions for the monitoring view
GRANT SELECT ON booking_request_timeout_monitoring TO authenticated;

-- Create RLS policy for the monitoring view
CREATE POLICY "Admins can view timeout monitoring"
ON booking_request_timeout_monitoring
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
);

-- Enable RLS on the view
ALTER VIEW booking_request_timeout_monitoring SET (security_barrier = true);