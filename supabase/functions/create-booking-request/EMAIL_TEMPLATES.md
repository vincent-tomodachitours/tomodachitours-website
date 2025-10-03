# Booking Request Email Templates

This document describes the SendGrid email templates that need to be created for the booking request system.

## Template 1: Customer Request Confirmation

**Template ID**: `d-booking-request-confirmation` (to be created in SendGrid)
**Purpose**: Sent to customers when they submit a booking request
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
  "specialRequests": "Vegetarian meal preference",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `Booking Request Received - {{tourName}} on {{tourDate}}`

**Body**:
```html
<h1>Booking Request Received</h1>

<p>Dear {{customerName}},</p>

<p>Thank you for your interest in our {{tourName}}! We have received your booking request and will review it within 24 hours.</p>

<h2>Request Details</h2>
<ul>
  <li><strong>Booking ID:</strong> {{bookingId}}</li>
  <li><strong>Tour:</strong> {{tourName}}</li>
  <li><strong>Date:</strong> {{tourDate}}</li>
  <li><strong>Time:</strong> {{tourTime}}</li>
  <li><strong>Participants:</strong> {{adults}} adults{{#if children}}, {{children}} children{{/if}}{{#if infants}}, {{infants}} infants{{/if}}</li>
  <li><strong>Total Amount:</strong> {{totalAmount}}</li>
  {{#if specialRequests}}<li><strong>Special Requests:</strong> {{specialRequests}}</li>{{/if}}
</ul>

<h2>What Happens Next?</h2>
<ol>
  <li>We will review your request and check availability with our partner company</li>
  <li>You will receive a confirmation email within 24 hours</li>
  <li>If approved, your payment method will be charged and you'll receive booking confirmation</li>
  <li>If we cannot accommodate your request, we'll notify you and no charge will be made</li>
</ol>

<h2>Meeting Point</h2>
<p><strong>Location:</strong> {{meetingPoint.location}}</p>
<p><a href="{{meetingPoint.google_maps_url}}">View on Google Maps</a></p>
{{#if meetingPoint.additional_info}}<p><em>{{meetingPoint.additional_info}}</em></p>{{/if}}

<p>If you have any questions, please don't hesitate to contact us.</p>

<p>Best regards,<br>
The Tomodachi Tours Team</p>
```

## Template 2: Admin Notification

**Template ID**: `d-booking-request-admin-notification` (to be created in SendGrid)
**Purpose**: Sent to admin team when a new booking request is submitted
**Recipients**: Admin team (spirivincent03@gmail.com, contact@tomodachitours.com, yutaka.m@tomodachitours.com)

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "specialRequests": "Vegetarian meal preference",
  "requestedDate": "Thu, February 13, 2025",
  "requestedTime": "14:30",
  "meetingPoint": {
    "location": "7-Eleven Heart-in - JR Kyoto Station Central Entrance Store",
    "google_maps_url": "https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9",
    "additional_info": "Warning: There are multiple 7-Elevens at Kyoto station..."
  }
}
```

### Email Content Structure

**Subject**: `New Booking Request - {{tourName}} - {{customerName}}`

**Body**:
```html
<h1>New Booking Request</h1>

<p>A new booking request has been submitted and requires review.</p>

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
  <li><strong>Total Amount:</strong> {{totalAmount}}</li>
  <li><strong>Requested:</strong> {{requestedDate}} at {{requestedTime}}</li>
  {{#if specialRequests}}<li><strong>Special Requests:</strong> {{specialRequests}}</li>{{/if}}
</ul>

<h2>Action Required</h2>
<p>Please review this request and:</p>
<ol>
  <li>Check availability with the partner company</li>
  <li>Log into the admin dashboard to approve or reject the request</li>
  <li>Ensure the customer receives a response within 24 hours</li>
</ol>

<p><strong>⚠️ Important:</strong> Payment will only be processed after approval. The customer's payment method is securely stored and ready for charging.</p>

<h2>Meeting Point</h2>
<p><strong>Location:</strong> {{meetingPoint.location}}</p>
<p><a href="{{meetingPoint.google_maps_url}}">View on Google Maps</a></p>
{{#if meetingPoint.additional_info}}<p><em>{{meetingPoint.additional_info}}</em></p>{{/if}}
```

## Template Creation Instructions

1. **Log into SendGrid Dashboard**
   - Go to Email API > Dynamic Templates
   - Click "Create a Dynamic Template"

2. **For Customer Confirmation Template**:
   - Name: "Booking Request Confirmation"
   - Create a new version
   - Use the HTML content above
   - Test with sample data
   - Note the template ID (format: d-xxxxxxxxx)

3. **For Admin Notification Template**:
   - Name: "Booking Request Admin Notification"
   - Create a new version
   - Use the HTML content above
   - Test with sample data
   - Note the template ID (format: d-xxxxxxxxx)

4. **Update Function Code**:
   - Replace placeholder template IDs in `create-booking-request/index.ts`
   - Update the `SENDGRID_TEMPLATES` constant with actual IDs

## Testing

After creating templates, test with:
```bash
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

## Integration with Email Failure Logging

The function automatically logs email failures to the `email_failures` table when SendGrid is unavailable or fails. This ensures no booking requests are lost and manual follow-up can be performed.