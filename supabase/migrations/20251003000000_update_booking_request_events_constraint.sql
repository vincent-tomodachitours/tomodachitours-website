-- Update booking_request_events table to support all event types from BookingRequestEventType enum
ALTER TABLE booking_request_events 
DROP CONSTRAINT IF EXISTS booking_request_events_event_type_check;

-- Add updated constraint with all supported event types
ALTER TABLE booking_request_events 
ADD CONSTRAINT booking_request_events_event_type_check 
CHECK (event_type IN (
    -- Request lifecycle events
    'request.submitted',
    'request.approved', 
    'request.rejected',
    'request.timeout',
    'request.expired',
    
    -- Payment events
    'payment.processing',
    'payment.success',
    'payment.failed',
    'payment.retry',
    'payment.abandoned',
    
    -- Email events
    'email.sent',
    'email.failed',
    'email.retry',
    
    -- System events
    'system.error',
    'validation.error',
    'database.error',
    'external_service.error',
    
    -- Admin events
    'admin.action',
    'admin.notification',
    'admin.error',
    
    -- Legacy event types for backward compatibility
    'submitted',
    'approved',
    'rejected',
    'payment_failed'
));

-- Add comment explaining the event types
COMMENT ON CONSTRAINT booking_request_events_event_type_check ON booking_request_events IS 
'Constraint allowing all event types from BookingRequestEventType enum plus legacy types for backward compatibility';