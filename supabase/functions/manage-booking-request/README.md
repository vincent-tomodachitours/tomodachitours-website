# Manage Booking Request Function

This Supabase Edge Function handles the approval and rejection of Uji tour booking requests by admin users.

## Overview

The `manage-booking-request` function is responsible for:
- Processing admin approval/rejection actions for booking requests
- Handling payment processing for approved requests using stored payment methods
- Sending status notification emails to customers
- Logging booking request events for audit trails
- Managing booking status transitions

## API Endpoints

### POST /functions/v1/manage-booking-request

Processes admin actions on booking requests.

#### Request Body

```json
{
  "booking_id": 123,
  "action": "approve" | "reject",
  "admin_id": "admin_user_id",
  "rejection_reason": "Optional reason for rejection"
}
```

#### Request Parameters

- `booking_id` (number, required): The ID of the booking request to process
- `action` (string, required): Either "approve" or "reject"
- `admin_id` (string, required): ID of the admin user performing the action
- `rejection_reason` (string, optional): Reason for rejection (required when action is "reject")

#### Response Format

**Success Response (Approval)**:
```json
{
  "success": true,
  "message": "Booking request approved and payment processed successfully",
  "booking_id": 123,
  "status": "CONFIRMED"
}
```

**Success Response (Rejection)**:
```json
{
  "success": true,
  "message": "Booking request rejected successfully",
  "booking_id": 123,
  "status": "REJECTED"
}
```

**Error Response (Payment Failed)**:
```json
{
  "success": false,
  "error": "Payment processing failed: Your card was declined",
  "booking_id": 123,
  "status": "PENDING_CONFIRMATION"
}
```

**Error Response (Validation)**:
```json
{
  "success": false,
  "error": "booking_id: Required, action: Invalid enum value"
}
```

## Workflow

### Approval Process

1. **Validation**: Validates request data and checks booking exists
2. **Status Check**: Ensures booking is in `PENDING_CONFIRMATION` status
3. **Payment Processing**: Processes payment using stored payment method
4. **Status Update**: Updates booking to `CONFIRMED` if payment succeeds
5. **Event Logging**: Logs approval event to `booking_request_events` table
6. **Email Notification**: Sends approval confirmation email to customer

### Rejection Process

1. **Validation**: Validates request data and checks booking exists
2. **Status Check**: Ensures booking is in `PENDING_CONFIRMATION` status
3. **Status Update**: Updates booking to `REJECTED` status
4. **Event Logging**: Logs rejection event with reason
5. **Email Notification**: Sends rejection notification email to customer

### Payment Failure Handling

When payment processing fails during approval:
1. Booking remains in `PENDING_CONFIRMATION` status
2. Payment failure event is logged
3. Customer receives payment failure notification email
4. Admin team receives payment failure alert email
5. Error response is returned with payment failure details

## Database Operations

### Booking Status Updates

The function updates the `bookings` table with:
- `status`: Updated to `CONFIRMED` or `REJECTED`
- `admin_reviewed_at`: Timestamp of admin action
- `admin_reviewed_by`: ID of admin who performed action
- `rejection_reason`: Reason for rejection (if applicable)
- `payment_provider`: Set to 'stripe' for successful payments
- `charge_id`: Stripe payment intent ID for successful payments
- `paid_amount`: Amount charged for successful payments

### Event Logging

Events are logged to `booking_request_events` table:
- `approved`: When request is approved and payment succeeds
- `rejected`: When request is rejected by admin
- `payment_failed`: When payment processing fails after approval

## Email Notifications

### Customer Notifications

- **Approval**: Booking confirmation with tour details and meeting point
- **Rejection**: Rejection notice with reason and alternative suggestions
- **Payment Failed**: Payment issue notice with resolution steps

### Admin Notifications

- **Payment Failed**: Alert to admin team when payment processing fails

### Email Template IDs

The function uses these SendGrid template IDs:
- `d-booking-request-approved`: Customer approval notification
- `d-booking-request-rejected`: Customer rejection notification
- `d-booking-request-payment-failed`: Customer payment failure notification
- `d-booking-request-admin-payment-failed`: Admin payment failure alert

## Error Handling

### Payment Processing Errors

- Stripe payment failures are caught and handled gracefully
- Booking remains in pending status for retry attempts
- Both customer and admin are notified of payment issues
- Detailed error messages are logged for troubleshooting

### Email Delivery Failures

- Email failures are logged to `email_failures` table
- Function continues processing even if emails fail
- Manual follow-up can be performed using logged failure data

### Validation Errors

- Request data is validated using Zod schemas
- Clear error messages are returned for invalid requests
- Booking status is validated before processing actions

## Security Features

- CORS headers for cross-origin requests
- Security headers added to all responses
- Input validation and sanitization
- Admin authorization (admin_id required)
- Payment method security through Stripe

## Usage Examples

### Approve a Booking Request

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-booking-request' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "booking_id": 123,
    "action": "approve",
    "admin_id": "admin_user_123"
  }'
```

### Reject a Booking Request

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-booking-request' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "booking_id": 123,
    "action": "reject",
    "admin_id": "admin_user_123",
    "rejection_reason": "Tour unavailable on requested date"
  }'
```

## Integration

This function integrates with:
- **Stripe**: For payment processing using stored payment methods
- **SendGrid**: For email notifications
- **Supabase Database**: For booking and event data
- **Admin Dashboard**: For UI-driven booking management

## Monitoring

The function logs detailed information for monitoring:
- Payment processing results
- Email delivery status
- Database operation results
- Error conditions and stack traces

## Dependencies

- `@supabase/supabase-js`: Database operations
- `stripe`: Payment processing
- `@sendgrid/mail`: Email notifications
- `zod`: Request validation

## Environment Variables

Required environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `SENDGRID_API_KEY`: SendGrid API key for email notifications