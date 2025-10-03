# Booking Request Timeout Handler

This Edge Function handles automated timeout processing for booking requests that require manual approval. It implements the timeout handling system for the Uji tour booking request workflow.

## Overview

The timeout handler processes booking requests that have been pending for configurable amounts of time and takes appropriate actions:

1. **Admin Reminders** (default: 12 hours) - Sends reminder emails to admin team
2. **Customer Delay Notifications** (default: 24 hours) - Notifies customers about processing delays
3. **Auto-Rejection** (default: 48 hours) - Automatically rejects expired requests
4. **Payment Method Cleanup** (default: 72 hours) - Cleans up payment method references

## Function Actions

### `send_admin_reminders`
Sends reminder emails to admin team for booking requests that have been pending for the configured reminder time without admin review.

### `send_customer_notifications`
Sends delay notification emails to customers whose booking requests have been pending for the configured notification time.

### `auto_reject_expired`
Automatically rejects booking requests that have exceeded the configured auto-rejection time without admin review.

### `cleanup_payment_methods`
Cleans up payment method references for rejected bookings that are older than the cleanup threshold.

### `process_all`
Runs all timeout actions in sequence (recommended for cron jobs).

## Configuration

The function accepts a `config` object with the following optional parameters:

```json
{
  "reminder_hours": 12,
  "customer_notification_hours": 24,
  "auto_reject_hours": 48,
  "cleanup_payment_methods": true
}
```

## Email Templates

The function uses the following SendGrid templates:

- `d-timeout-admin-reminder` - Admin reminder emails
- `d-timeout-customer-delay` - Customer delay notifications
- `d-timeout-auto-rejection` - Customer auto-rejection notifications
- `d-timeout-auto-rejection-admin` - Admin auto-rejection notifications

See `EMAIL_TEMPLATES.md` for template details and creation instructions.

## Database Integration

### Tables Used

- `bookings` - Main booking records
- `booking_request_events` - Event logging for timeout actions
- `email_failures` - Email delivery failure logging

### Events Logged

- `timeout_reminder` - Admin reminder sent
- `customer_delay_notification` - Customer delay notification sent
- `auto_rejected` - Booking automatically rejected
- `payment_method_cleanup` - Payment method reference cleaned up

## Cron Job Integration

The function is designed to be called by a cron job. The database migration `20250103000002_create_booking_request_timeout_cron.sql` sets up:

1. **HTTP-based cron job** - Calls the Edge Function every 2 hours
2. **Local processing function** - Fallback processing every hour
3. **Monitoring view** - `booking_request_timeout_monitoring` for status tracking

## Usage

### Manual Testing

```bash
# Test admin reminders
curl -X POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "send_admin_reminders"}'

# Test customer notifications
curl -X POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "send_customer_notifications"}'

# Test auto-rejection
curl -X POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "auto_reject_expired"}'

# Process all actions
curl -X POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"action": "process_all"}'
```

### Database Testing

```sql
-- Manually trigger timeout processing
SELECT * FROM trigger_booking_request_timeout_processing();

-- Check monitoring view
SELECT * FROM booking_request_timeout_monitoring;

-- View recent timeout events
SELECT * FROM booking_request_events 
WHERE event_type IN ('timeout_reminder', 'customer_delay_notification', 'auto_rejected')
ORDER BY created_at DESC;
```

### Test Script

Run the comprehensive test suite:

```bash
npm run test:timeouts
```

This script creates test data, runs timeout processing, and verifies results.

## Monitoring

### Monitoring View

The `booking_request_timeout_monitoring` view provides real-time status of pending booking requests:

```sql
SELECT * FROM booking_request_timeout_monitoring 
WHERE timeout_status != 'ON_TIME';
```

### Key Metrics

- **Hours Pending** - How long each request has been waiting
- **Timeout Status** - Current timeout category (ON_TIME, OVERDUE_ADMIN_REMINDER, etc.)
- **Notification Status** - Whether reminders/notifications have been sent

### Alerts

Monitor for:
- Requests with `timeout_status = 'OVERDUE_AUTO_REJECT'`
- High volume of auto-rejections (may indicate process issues)
- Email delivery failures in `email_failures` table

## Error Handling

### Email Failures
- Failed emails are logged to `email_failures` table
- Processing continues even if emails fail
- Manual follow-up can be performed using logged data

### Payment Method Cleanup
- Only clears database references, doesn't delete from Stripe
- Stripe payment methods remain available for customer reuse
- Cleanup can be disabled via configuration

### Retry Logic
- Function can be safely re-run multiple times
- Duplicate processing is prevented by event logging
- Idempotent operations ensure consistent state

## Security

### Authentication
- Requires `SERVICE_ROLE_KEY` for execution
- Admin-only access to monitoring views
- RLS policies protect sensitive data

### Data Protection
- No sensitive payment data is processed
- Customer emails are handled securely
- Event logging includes minimal PII

## Performance

### Optimizations
- Indexed queries for timeout lookups
- Batch processing of multiple requests
- Efficient event deduplication

### Scaling
- Function handles hundreds of requests efficiently
- Database queries are optimized for large datasets
- Email sending is batched where possible

## Deployment

### Prerequisites
1. SendGrid templates created (see EMAIL_TEMPLATES.md)
2. Database migrations applied
3. Environment variables configured:
   - `SENDGRID_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Deployment Steps
1. Deploy the Edge Function: `supabase functions deploy booking-request-timeout-handler`
2. Apply database migration: `supabase db push`
3. Configure cron jobs (may require manual setup in production)
4. Test with sample data

### Production Configuration
- Adjust timeout thresholds based on business requirements
- Set up monitoring and alerting
- Configure email template IDs
- Enable cron jobs with appropriate scheduling

## Troubleshooting

### Common Issues

**Emails not sending**
- Check SendGrid API key configuration
- Verify template IDs are correct
- Check `email_failures` table for error details

**Cron jobs not running**
- Verify pg_cron extension is enabled
- Check cron job scheduling with `SELECT * FROM cron.job;`
- Ensure service role key is configured for HTTP calls

**Auto-rejections not working**
- Check booking status constraints
- Verify timeout thresholds are configured correctly
- Review `booking_request_events` for processing history

**Performance issues**
- Check database indexes are created
- Monitor query execution times
- Consider adjusting batch sizes for large datasets

### Debug Queries

```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname LIKE 'booking-request%';

-- View recent timeout processing
SELECT * FROM booking_request_events 
WHERE created_by LIKE 'system%' 
ORDER BY created_at DESC LIMIT 20;

-- Check for stuck requests
SELECT * FROM booking_request_timeout_monitoring 
WHERE timeout_status = 'OVERDUE_AUTO_REJECT';

-- Email failure analysis
SELECT email_type, COUNT(*), MAX(failed_at) 
FROM email_failures 
GROUP BY email_type 
ORDER BY COUNT(*) DESC;
```

## Related Documentation

- [Booking Request System Design](../../../.kiro/specs/uji-tour-booking-requests/design.md)
- [Email Templates](./EMAIL_TEMPLATES.md)
- [Database Schema](../../migrations/20250103000000_add_booking_request_schema.sql)
- [Cron Job Setup](../../migrations/20250103000002_create_booking_request_timeout_cron.sql)