# Google Ads Server-Side Conversion Backup System

This Supabase Edge Function provides server-side conversion tracking as a backup for client-side Google Ads conversion tracking. It implements the Google Ads Conversion API to ensure reliable conversion attribution even when client-side tracking fails.

## Features

- **Booking Validation**: Validates successful bookings before firing conversions
- **Google Ads API Integration**: Direct integration with Google Ads Conversion API
- **Enhanced Conversions**: Supports enhanced conversions with hashed customer data
- **Conversion Reconciliation**: Compares client-side vs server-side conversion data
- **Automatic Backup**: Fires server-side conversions when client-side tracking fails

## API Endpoints

### 1. Validate and Convert
**Endpoint**: `POST /functions/v1/google-ads-conversion?action=validate_and_convert`

Validates a booking and fires a server-side conversion if the booking is successful.

**Request Body**:
```json
{
  "booking_id": "uuid-of-booking"
}
```

**Response**:
```json
{
  "success": true,
  "booking_data": {
    "booking_id": "uuid",
    "payment_status": "confirmed",
    "amount": 5000,
    "currency": "JPY",
    "customer_email": "customer@example.com",
    "tour_id": "tour-123"
  },
  "conversion_data": {
    "conversion_action": "customers/123/conversionActions/456",
    "conversion_value": 5000,
    "currency": "JPY",
    "order_id": "uuid"
  }
}
```

### 2. Manual Conversion
**Endpoint**: `POST /functions/v1/google-ads-conversion?action=manual_conversion`

Fires a manual conversion with provided conversion data.

**Request Body**:
```json
{
  "conversion_action": "customers/123/conversionActions/456",
  "conversion_value": 5000,
  "currency": "JPY",
  "order_id": "order-123",
  "gclid": "gclid-value",
  "user_identifiers": {
    "hashed_email": "hashed-email-value",
    "hashed_phone_number": "hashed-phone-value"
  }
}
```

### 3. Conversion Reconciliation
**Endpoint**: `POST /functions/v1/google-ads-conversion?action=reconcile`

Compares client-side and server-side conversion tracking for a date range.

**Request Body**:
```json
{
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z"
}
```

**Response**:
```json
{
  "date_range": "2024-01-01T00:00:00Z to 2024-01-31T23:59:59Z",
  "client_side_conversions": 45,
  "server_side_conversions": 47,
  "matched_conversions": 43,
  "discrepancies": [
    {
      "booking_id": "uuid",
      "client_tracked": false,
      "server_tracked": true,
      "issue": "Client-side tracking failed"
    }
  ],
  "accuracy_percentage": 95.65
}
```

## Setup Instructions

### 1. Google Ads API Setup

1. **Enable Google Ads API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Ads API for your project

2. **Get Developer Token**:
   - Visit [Google Ads API Center](https://ads.google.com/nav/selectaccount?authuser=0&dst=/aw/apicenter)
   - Apply for a developer token (may require approval)

3. **Create OAuth 2.0 Credentials**:
   - In Google Cloud Console, create OAuth 2.0 client credentials
   - Add authorized redirect URIs for OAuth flow

4. **Generate Refresh Token**:
   - Use OAuth 2.0 flow to generate a refresh token
   - Store the refresh token securely

### 2. Environment Variables

Set the following environment variables in your Supabase project:

```bash
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id

# Conversion Actions
GOOGLE_ADS_PURCHASE_CONVERSION_ACTION=conversion_action_id
```

### 3. Database Setup

Run the migration to create the conversion tracking log table:

```sql
-- This is handled by the migration file
-- supabase/migrations/20250827000000_create_conversion_tracking_log.sql
```

### 4. Deploy Function

Deploy the function to Supabase:

```bash
supabase functions deploy google-ads-conversion
```

## Usage Examples

### Client-Side Integration

```javascript
import { serverSideConversionService } from './services/serverSideConversionService'

// Fire server-side conversion after successful booking
async function handleBookingSuccess(bookingId) {
  try {
    // Schedule backup conversion (fires after 30 seconds if client-side fails)
    serverSideConversionService.scheduleBackupConversion(bookingId)
    
    // Or fire immediately
    const result = await serverSideConversionService.validateAndFireConversion(bookingId)
    console.log('Server-side conversion:', result)
  } catch (error) {
    console.error('Server-side conversion error:', error)
  }
}

// Log client-side conversion attempts
async function trackClientConversion(bookingId, success, details) {
  await serverSideConversionService.logClientConversion(bookingId, success, details)
}
```

### Testing

Use the test script to validate the system:

```bash
# Run full test suite
node scripts/test-server-side-conversions.js

# Test specific booking
node scripts/test-server-side-conversions.js validate booking-id-123

# Test reconciliation for last 30 days
node scripts/test-server-side-conversions.js reconcile 30
```

## Monitoring and Debugging

### Conversion Tracking Logs

Query the conversion tracking logs to monitor system performance:

```sql
SELECT 
  booking_id,
  conversion_type,
  success,
  details,
  created_at
FROM conversion_tracking_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Reconciliation Reports

Run regular reconciliation reports to ensure tracking accuracy:

```javascript
const result = await serverSideConversionService.reconcileConversions(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
)

console.log(`Accuracy: ${result.accuracy_percentage}%`)
console.log(`Discrepancies: ${result.discrepancies.length}`)
```

## Error Handling

The system includes comprehensive error handling:

- **API Failures**: Retries with exponential backoff
- **Authentication Errors**: Automatic token refresh
- **Validation Failures**: Detailed error logging
- **Network Issues**: Graceful degradation

## Security Considerations

- All customer data is hashed using SHA-256 before transmission
- OAuth tokens are securely managed and refreshed automatically
- API requests include proper authentication headers
- Sensitive data is not logged in plain text

## Performance Optimization

- Conversion uploads are batched when possible
- Database queries are optimized with proper indexing
- Function execution is monitored for performance
- Automatic cleanup of old tracking logs

## Compliance

The system ensures compliance with:

- **GDPR**: Customer data is hashed and anonymized
- **Google Ads Policies**: Follows Google Ads API best practices
- **Privacy Regulations**: Minimal data collection and secure handling