# Booking Request Status Notification Email Templates

This document describes the SendGrid email templates that need to be created for the booking request status notification system.

## Template 1: Request Approved Notification

**Template ID**: `d-booking-request-approved` (to be created in SendGrid)
**Purpose**: Sent to customers when their booking request is approved and payment is processed
**Recipient**: Customer who submitted the request

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "customerName": "John Doe",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `Booking Confirmed - {{tourName}} on {{tourDate}}`

**Body**:
```html
<h1>🎉 Booking Confirmed!</h1>

<p>Dear {{customerName}},</p>

<p>Great news! Your booking request has been approved and your payment has been processed successfully.</p>

<h2>Confirmed Booking Details</h2>
<ul>
  <li><strong>Booking ID:</strong> {{bookingId}}</li>
  <li><strong>Tour:</strong> {{tourName}}</li>
  <li><strong>Date:</strong> {{tourDate}}</li>
  <li><strong>Time:</strong> {{tourTime}}</li>
  <li><strong>Participants:</strong> {{adults}} adults{{#if children}}, {{children}} children{{/if}}{{#if infants}}, {{infants}} infants{{/if}}</li>
  <li><strong>Amount Charged:</strong> {{totalAmount}}</li>
</ul>

<h2>Meeting Point</h2>
<p><strong>Location:</strong> {{meetingPoint.location}}</p>
<p><a href="{{meetingPoint.google_maps_url}}">View on Google Maps</a></p>
{{#if meetingPoint.additional_info}}<p><em>{{meetingPoint.additional_info}}</em></p>{{/if}}

<h2>What to Expect</h2>
<ul>
  <li>Please arrive at the meeting point 10 minutes before the tour time</li>
  <li>Look for your guide holding a Tomodachi Tours sign</li>
  <li>Bring comfortable walking shoes and weather-appropriate clothing</li>
  <li>Don't forget your camera for amazing photo opportunities!</li>
</ul>

<h2>Important Information</h2>
<ul>
  <li><strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before the tour</li>
  <li><strong>Weather:</strong> Tours run rain or shine (we provide umbrellas if needed)</li>
  <li><strong>Contact:</strong> If you need to reach us on the day of the tour, call +81-XX-XXXX-XXXX</li>
</ul>

<p>We're excited to show you the beautiful sights of Uji! If you have any questions before your tour, please don't hesitate to contact us.</p>

<p>Best regards,<br>
The Tomodachi Tours Team</p>
```

## Template 2: Request Rejected Notification

**Template ID**: `d-booking-request-rejected` (to be created in SendGrid)
**Purpose**: Sent to customers when their booking request is rejected
**Recipient**: Customer who submitted the request

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "customerName": "John Doe",
  "rejectionReason": "Unfortunately, the tour is fully booked on your requested date",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `Booking Request Update - {{tourName}} on {{tourDate}}`

**Body**:
```html
<h1>Booking Request Update</h1>

<p>Dear {{customerName}},</p>

<p>Thank you for your interest in our {{tourName}}. Unfortunately, we are unable to accommodate your booking request at this time.</p>

<h2>Request Details</h2>
<ul>
  <li><strong>Booking ID:</strong> {{bookingId}}</li>
  <li><strong>Tour:</strong> {{tourName}}</li>
  <li><strong>Requested Date:</strong> {{tourDate}}</li>
  <li><strong>Requested Time:</strong> {{tourTime}}</li>
  <li><strong>Participants:</strong> {{adults}} adults{{#if children}}, {{children}} children{{/if}}{{#if infants}}, {{infants}} infants{{/if}}</li>
</ul>

<h2>Reason</h2>
<p>{{rejectionReason}}</p>

<h2>Alternative Options</h2>
<p>We'd love to help you experience Uji! Here are some alternatives:</p>
<ul>
  <li><strong>Different Dates:</strong> Check our website for available dates</li>
  <li><strong>Other Tours:</strong> Consider our Kyoto tours which have more frequent availability</li>
  <li><strong>Waitlist:</strong> Contact us to be added to our waitlist for cancellations</li>
</ul>

<h2>No Charge Applied</h2>
<p><strong>Important:</strong> Your payment method has not been charged. No payment was processed for this request.</p>

<p>We sincerely apologize for any inconvenience. Please don't hesitate to contact us if you'd like to explore alternative dates or tours.</p>

<p>Best regards,<br>
The Tomodachi Tours Team</p>

<p><em>Visit our website: <a href="https://tomodachitours.com">tomodachitours.com</a></em></p>
```

## Template 3: Payment Failed Notification

**Template ID**: `d-booking-request-payment-failed` (to be created in SendGrid)
**Purpose**: Sent to customers when their approved booking request fails payment processing
**Recipient**: Customer who submitted the request

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "customerName": "John Doe",
  "paymentError": "Your card was declined. Please contact your bank or try a different payment method.",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `Payment Issue - {{tourName}} Booking {{bookingId}}`

**Body**:
```html
<h1>Payment Processing Issue</h1>

<p>Dear {{customerName}},</p>

<p>Good news! Your booking request for {{tourName}} has been approved. However, we encountered an issue processing your payment.</p>

<h2>Booking Details</h2>
<ul>
  <li><strong>Booking ID:</strong> {{bookingId}}</li>
  <li><strong>Tour:</strong> {{tourName}}</li>
  <li><strong>Date:</strong> {{tourDate}}</li>
  <li><strong>Time:</strong> {{tourTime}}</li>
  <li><strong>Participants:</strong> {{adults}} adults{{#if children}}, {{children}} children{{/if}}{{#if infants}}, {{infants}} infants{{/if}}</li>
  <li><strong>Amount:</strong> {{totalAmount}}</li>
</ul>

<h2>Payment Issue</h2>
<p><strong>Error:</strong> {{paymentError}}</p>

<h2>Next Steps</h2>
<p>To secure your booking, please:</p>
<ol>
  <li><strong>Contact your bank</strong> to ensure your card can process international transactions</li>
  <li><strong>Check your card details</strong> for any errors or expiration</li>
  <li><strong>Reply to this email</strong> or call us to provide alternative payment information</li>
  <li><strong>Act quickly</strong> - we'll hold your spot for 24 hours</li>
</ol>

<h2>Alternative Payment Methods</h2>
<ul>
  <li>Different credit/debit card</li>
  <li>Bank transfer (contact us for details)</li>
  <li>PayPal (if available)</li>
</ul>

<h2>Time Sensitive</h2>
<p><strong>⚠️ Important:</strong> Your booking is approved but not yet confirmed. We'll hold your spot for 24 hours while you resolve the payment issue. After that, the booking may be released to other customers.</p>

<p>Please contact us as soon as possible at contact@tomodachitours.com or reply to this email.</p>

<p>Best regards,<br>
The Tomodachi Tours Team</p>
```

## Template 4: Admin Payment Failed Notification

**Template ID**: `d-booking-request-admin-payment-failed` (to be created in SendGrid)
**Purpose**: Sent to admin team when payment processing fails for an approved booking request
**Recipients**: Admin team (spirivincent03@gmail.com, contact@tomodachitours.com, yutaka.m@tomodachitours.com)

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "paymentMethodId": "pm_1234567890",
  "errorDetails": "Your card was declined. Please contact your bank.",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `URGENT: Payment Failed - Booking {{bookingId}} - {{customerName}}`

**Body**:
```html
<h1>🚨 Payment Processing Failed</h1>

<p>A booking request was approved but payment processing failed. Immediate action required.</p>

<h2>Customer Information</h2>
<ul>
  <li><strong>Name:</strong> {{customerName}}</li>
  <li><strong>Email:</strong> {{customerEmail}}</li>
  {{#if customerPhone}}<li><strong>Phone:</strong> {{customerPhone}}</li>{{/if}}
</ul>

<h2>Booking Details</h2>
<ul>
  <li><strong>Booking ID:</strong> {{bookingId}}</li>
  <li><strong>Tour:</strong> {{tourName}}</li>
  <li><strong>Date:</strong> {{tourDate}}</li>
  <li><strong>Time:</strong> {{tourTime}}</li>
  <li><strong>Participants:</strong> {{adults}} adults{{#if children}}, {{children}} children{{/if}}{{#if infants}}, {{infants}} infants{{/if}}</li>
  <li><strong>Amount:</strong> {{totalAmount}}</li>
</ul>

<h2>Payment Error Details</h2>
<ul>
  <li><strong>Payment Method ID:</strong> {{paymentMethodId}}</li>
  <li><strong>Error:</strong> {{errorDetails}}</li>
  <li><strong>Status:</strong> PENDING_CONFIRMATION (payment failed)</li>
</ul>

<h2>Required Actions</h2>
<ol>
  <li><strong>Contact Customer:</strong> Reach out within 2 hours to resolve payment issue</li>
  <li><strong>Admin Dashboard:</strong> Check for retry options or manual payment processing</li>
  <li><strong>Alternative Payment:</strong> Offer bank transfer or different payment method</li>
  <li><strong>Time Limit:</strong> Resolve within 24 hours or consider releasing the booking</li>
</ol>

<h2>Customer Notification</h2>
<p>✅ Customer has been automatically notified about the payment issue and next steps.</p>

<p><strong>⚠️ Priority:</strong> This booking is approved but not confirmed. Customer expects confirmation soon.</p>
```

## Template Creation Instructions

1. **Log into SendGrid Dashboard**
   - Go to Email API > Dynamic Templates
   - Click "Create a Dynamic Template"

2. **Create Each Template**:
   - **Request Approved**: Name "Booking Request Approved"
   - **Request Rejected**: Name "Booking Request Rejected"  
   - **Payment Failed**: Name "Booking Request Payment Failed"
   - **Admin Payment Failed**: Name "Admin Payment Failed Notification"

3. **For Each Template**:
   - Create a new version
   - Use the HTML content above
   - Test with sample data
   - Note the template ID (format: d-xxxxxxxxx)

4. **Update Function Code**:
   - Replace placeholder template IDs in `manage-booking-request/index.ts`
   - Update the `SENDGRID_TEMPLATES` constant with actual IDs

## Testing

After creating templates, test with:

### Test Approval
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

### Test Rejection
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

## Integration with Email Failure Logging

The function automatically logs email failures to the `email_failures` table when SendGrid is unavailable or fails. This ensures no status notifications are lost and manual follow-up can be performed.

## Email Template Design Guidelines

- **Consistent Branding**: Use Tomodachi Tours colors and fonts
- **Mobile Responsive**: Ensure templates work on mobile devices
- **Clear CTAs**: Include clear next steps for customers
- **Professional Tone**: Maintain friendly but professional communication
- **Error Handling**: Gracefully handle missing template variables