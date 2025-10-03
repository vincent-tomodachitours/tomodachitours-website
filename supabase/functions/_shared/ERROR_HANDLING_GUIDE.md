# Comprehensive Error Handling and Logging System

This document describes the comprehensive error handling and logging system implemented for the Uji tour booking requests feature.

## Overview

The system provides:
- **Detailed logging** for all request lifecycle events
- **Error recovery mechanisms** for payment failures
- **Admin notification system** for system errors
- **Retry logic** for failed operations
- **Circuit breaker pattern** for external service calls

## Components

### 1. BookingRequestLogger (`booking-request-logger.ts`)

Provides structured logging for all booking request events with different severity levels.

#### Key Features:
- Event-based logging with correlation IDs
- Multiple severity levels (INFO, WARNING, ERROR, CRITICAL)
- Structured metadata storage
- Integration with database event tracking

#### Usage Example:
```typescript
const logger = new BookingRequestLogger(supabase);
logger.setCorrelationId('booking-123-456');

// Log request submission
await logger.logRequestSubmitted(
  bookingId,
  customerEmail,
  tourType,
  amount,
  paymentMethodId
);

// Log payment failure
await logger.logPaymentFailed(
  bookingId,
  amount,
  errorMessage,
  errorCode,
  retryCount
);
```

### 2. RetryService (`retry-service.ts`)

Implements exponential backoff retry logic for various operations.

#### Key Features:
- Configurable retry parameters
- Exponential backoff with jitter
- Operation-specific retry configurations
- Circuit breaker pattern for external services

#### Usage Example:
```typescript
// Retry payment processing
const result = await RetryService.retryPaymentProcessing(
  async () => await processPayment(),
  bookingId
);

// Retry email sending
const emailResult = await RetryService.retryEmailSending(
  async () => await sendEmail(),
  'booking_confirmation',
  bookingId
);
```

### 3. AdminNotificationService (`admin-notification-service.ts`)

Handles notifications to administrators for system errors and critical events.

#### Key Features:
- Email notifications with HTML templates
- Slack integration (optional)
- Retry logic for notification delivery
- Fallback to email_failures table

#### Usage Example:
```typescript
const adminService = new AdminNotificationService(supabase, config);

// Notify system error
await adminService.notifySystemError({
  bookingId: 123,
  errorType: 'PAYMENT_FAILURE',
  errorMessage: 'Card declined',
  severity: 'HIGH',
  operation: 'process_payment',
  timestamp: new Date().toISOString()
});
```

### 4. BookingRequestErrorHandler (`error-handler.ts`)

Central error handling service that coordinates logging, recovery, and notifications.

#### Key Features:
- Unified error handling interface
- Automatic error classification
- Recovery attempt coordination
- Admin escalation for critical errors

#### Usage Example:
```typescript
const errorHandler = new BookingRequestErrorHandler(supabase, adminService);

// Handle payment error with automatic retry logic
const result = await errorHandler.handlePaymentError(
  error,
  bookingId,
  paymentMethodId,
  amount,
  customerEmail,
  retryCount
);

// Handle general errors with recovery options
await errorHandler.handleError(
  error,
  context,
  { enableRetry: true, notifyAdmins: true, severity: 'HIGH' }
);
```

## Error Types and Recovery Strategies

### Payment Errors

**Retryable Errors:**
- Network timeouts
- Rate limits
- Temporary processing errors
- Service unavailable

**Non-Retryable Errors:**
- Card declined
- Insufficient funds
- Invalid card details
- Authentication required

**Recovery Strategy:**
1. Retry up to 2 times with exponential backoff
2. Log all attempts with detailed metadata
3. Notify admins if all retries fail
4. Store payment method for manual retry

### Email Errors

**Retryable Errors:**
- Network timeouts
- Rate limits
- SendGrid temporary failures
- SMTP errors

**Non-Retryable Errors:**
- Invalid email addresses
- Blocked/bounced emails
- Unsubscribed recipients

**Recovery Strategy:**
1. Retry up to 3 times with exponential backoff
2. Store failed emails in email_failures table
3. Continue with booking process (don't fail booking for email issues)
4. Notify admins for persistent failures

### Database Errors

**Retryable Errors:**
- Connection timeouts
- Deadlocks
- Lock timeouts
- Network issues

**Non-Retryable Errors:**
- Constraint violations
- Data validation errors
- Permission errors

**Recovery Strategy:**
1. Retry up to 2 times with shorter delays
2. Log all database operations
3. Escalate to critical alerts for persistent failures

## Logging Levels and Events

### Event Types

- `REQUEST_SUBMITTED` - Customer submits booking request
- `REQUEST_APPROVED` - Admin approves request
- `REQUEST_REJECTED` - Admin rejects request
- `PAYMENT_PROCESSING` - Payment processing starts
- `PAYMENT_SUCCESS` - Payment completed successfully
- `PAYMENT_FAILED` - Payment failed
- `EMAIL_SENT` - Email sent successfully
- `EMAIL_FAILED` - Email delivery failed
- `SYSTEM_ERROR` - System-level error occurred
- `ADMIN_NOTIFICATION` - Admin notification sent

### Severity Levels

- **INFO** - Normal operations, successful events
- **WARNING** - Recoverable errors, retry attempts
- **ERROR** - Failed operations, non-critical errors
- **CRITICAL** - System failures, requires immediate attention

## Admin Notifications

### System Error Notifications

Sent for:
- Critical system failures
- Payment processing failures after retries
- Database connection issues
- Email service failures

### Payment Failure Notifications

Include:
- Booking details
- Customer information
- Error details
- Retry count
- Required actions

### Email Templates

- **System Error Alert** - Detailed error information with stack traces
- **Payment Failure Alert** - Booking-specific payment failure details
- **Critical Alert** - Immediate attention required notifications

## Configuration

### Environment Variables

```bash
# SendGrid configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# Admin notification emails
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Slack integration (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Retry Configuration

```typescript
// Payment retry configuration
const paymentRetryConfig = {
  maxRetries: 2,
  baseDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
};

// Email retry configuration
const emailRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  backoffMultiplier: 2
};
```

## Monitoring and Analytics

### Key Metrics

- Request submission rate
- Payment success/failure rates
- Email delivery success rates
- Error frequency by type
- Recovery success rates
- Admin response times

### Database Tables

- `booking_request_events` - All booking request lifecycle events
- `email_failures` - Failed email attempts for manual follow-up
- `payment_attempts` - Payment processing attempts and results

## Best Practices

### Error Handling

1. **Always use correlation IDs** for request tracking
2. **Log before and after critical operations**
3. **Include sufficient context** in error messages
4. **Don't fail bookings for non-critical errors** (like email failures)
5. **Escalate appropriately** based on error severity

### Retry Logic

1. **Use exponential backoff** to avoid overwhelming services
2. **Classify errors correctly** (retryable vs non-retryable)
3. **Set reasonable retry limits** to avoid infinite loops
4. **Log all retry attempts** for debugging

### Admin Notifications

1. **Include actionable information** in notifications
2. **Use appropriate severity levels** to avoid alert fatigue
3. **Provide context and next steps** in notifications
4. **Test notification delivery** regularly

## Testing

The system includes comprehensive tests for:
- Retry logic with various error scenarios
- Error classification and handling
- Admin notification delivery
- Circuit breaker functionality
- Database operation retries

Run tests with:
```bash
deno test --allow-all supabase/functions/_shared/__tests__/error-handling-integration.test.ts
```

## Troubleshooting

### Common Issues

1. **High retry rates** - Check external service health
2. **Failed admin notifications** - Verify SendGrid configuration
3. **Database connection errors** - Check Supabase service status
4. **Circuit breaker activation** - External service may be down

### Debug Information

All errors include:
- Correlation ID for request tracking
- Stack traces for system errors
- Retry attempt counts
- Timestamp information
- Contextual metadata

### Manual Recovery

For failed operations:
1. Check `booking_request_events` table for event history
2. Review `email_failures` table for unsent emails
3. Use admin dashboard to retry failed payments
4. Monitor system logs for error patterns