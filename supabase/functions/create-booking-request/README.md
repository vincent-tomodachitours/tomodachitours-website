# Create Booking Request Function

This Supabase Edge Function handles the creation of booking requests for Uji tours, which require manual approval before payment processing.

## Purpose

Unlike regular tours that have instant confirmation, Uji tours require availability verification through a third-party company. This function creates booking requests with deferred payment processing.

## Features

- ✅ Validates booking request data
- ✅ Creates booking with `PENDING_CONFIRMATION` status
- ✅ Stores Stripe Payment Method ID for deferred payment
- ✅ Sends confirmation email to customer
- ✅ Sends notification email to admin team
- ✅ Logs booking request events
- ✅ Integrates with existing email failure logging system
- ✅ Validates tour type (only Uji tours allowed)

## API Endpoint

```
POST /functions/v1/create-booking-request
```

## Request Schema

```json
{
  "tour_type": "uji-tour",
  "booking_date": "2025-02-15",
  "booking_time": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "payment_method_id": "pm_1234567890",
  "total_amount": 13000,
  "discount_code": "SAVE10",
  "original_amount": 14000,
  "special_requests": "Vegetarian meal preference"
}
```

### Required Fields
- `tour_type` (string): Must be "uji-tour" or "uji-walking-tour"
- `booking_date` (string): Date in YYYY-MM-DD format
- `booking_time` (string): Time in HH:MM format
- `adults` (number): Number of adults (minimum 1)
- `customer_name` (string): Customer's full name
- `customer_email` (string): Valid email address
- `payment_method_id` (string): Stripe Payment Method ID
- `total_amount` (number): Total amount in yen

### Optional Fields
- `children` (number): Number of children (default: 0)
- `infants` (number): Number of infants (default: 0)
- `customer_phone` (string): Customer's phone number
- `discount_code` (string): Discount code if applied
- `original_amount` (number): Original amount before discount
- `special_requests` (string): Special requests or notes

## Response

### Success Response (200)
```json
{
  "success": true,
  "booking_id": 123,
  "status": "PENDING_CONFIRMATION",
  "message": "Your booking request has been submitted successfully. You will receive a confirmation email shortly, and we will review your request within 24 hours."
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Email Templates

The function sends two types of emails:

1. **Customer Confirmation** (`d-booking-request-confirmation`)
   - Sent to the customer who submitted the request
   - Explains the request process and next steps
   - Includes booking details and meeting point information

2. **Admin Notification** (`d-booking-request-admin-notification`)
   - Sent to admin team for review
   - Contains all booking details and customer information
   - Prompts for approval/rejection action

See `EMAIL_TEMPLATES.md` for detailed template specifications.

## Database Changes

The function creates records in:

1. **bookings table**: Main booking record with `PENDING_CONFIRMATION` status
2. **booking_request_events table**: Event log entry for the submission
3. **email_failures table**: If email sending fails (for manual follow-up)

## Error Handling

- **Validation Errors**: Returns 400 with specific validation messages
- **Database Errors**: Returns 500 with generic error message
- **Email Failures**: Logs to `email_failures` table but doesn't fail the request
- **Invalid Tour Type**: Returns 400 if not a Uji tour

## Security Features

- Input validation and sanitization
- SQL injection prevention through parameterized queries
- XSS protection in email templates
- Rate limiting (inherited from middleware)
- CORS headers for cross-origin requests

## Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Test the function
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-booking-request' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "tour_type": "uji-tour",
    "booking_date": "2025-02-15",
    "booking_time": "10:00",
    "adults": 2,
    "children": 0,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "payment_method_id": "pm_test_123",
    "total_amount": 13000
  }'
```

### Test Cases
- ✅ Valid Uji tour request
- ✅ Invalid tour type (non-Uji)
- ✅ Missing required fields
- ✅ Invalid email format
- ✅ Invalid date/time format
- ✅ Zero adults
- ✅ SendGrid email failure handling

## Dependencies

- `@supabase/supabase-js`: Database operations
- `@sendgrid/mail`: Email sending
- `zod`: Input validation
- Validation middleware: Request validation and security headers

## Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `SENDGRID_API_KEY`: SendGrid API key for email sending

## Integration Points

- **Frontend**: Called from checkout flow when Uji tour is selected
- **Admin Dashboard**: Booking requests appear in admin interface for approval
- **Email System**: Uses existing SendGrid configuration and failure logging
- **Payment System**: Stores payment method for later processing on approval

## Next Steps

1. Create SendGrid email templates using the specifications in `EMAIL_TEMPLATES.md`
2. Update template IDs in the function code
3. Test email delivery in staging environment
4. Deploy to production and monitor for errors