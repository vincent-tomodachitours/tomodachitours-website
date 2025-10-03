# Booking Request Email Templates

This document describes the SendGrid email templates that need to be created for the booking request system.

## Template 1: Customer Request Received

**Template ID**: `d-ab9af3697fa443a6a248b787da1c4533`
**Purpose**: Sent to customers when they submit a booking request (payment method stored, awaiting approval)
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
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #1a4789;color: white;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.meeting-point {background: #e8f4ff;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #1a4789;}
.next-steps {background: #fff3cd;color: #856404;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Booking Request Received</h1>
</div>
<div class="content">
<p>Dear {{customerName}},</p>

<p>Thank you for your interest in our {{tourName}}! We have received your booking request and will review it within 24 hours.</p>

<p>Booking request: <strong>{{bookingId}}</strong></p>

<div class="booking-details">
<h2>{{tourName}}</h2>
<p><strong>Date:</strong> {{tourDate}}</p>
<p><strong>Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
<p><strong>Total Amount:</strong> {{totalAmount}}</p>
{{#if specialRequests}}<p><strong>Special Requests:</strong> {{specialRequests}}</p>{{/if}}
</div>

<div class="next-steps">
<h2>What Happens Next?</h2>
<ol>
  <li>We will review your request and check availability with our partner company</li>
  <li>You will receive a confirmation email within 24 hours</li>
  <li>If approved, your payment method will be charged and you'll receive booking confirmation</li>
  <li>If we cannot accommodate your request, we'll notify you and no charge will be made</li>
</ol>
</div>

<div class="meeting-point">
<h2>📍 Meeting Point</h2>
<p>{{meetingPoint.location}}</p>
{{#if meetingPoint.additional_info}}<p><strong>Important:</strong> {{meetingPoint.additional_info}}</p>{{/if}}
<a href="{{meetingPoint.google_maps_url}}" class="button">📍 Open in Google Maps</a>
</div>

<p>If you have any questions, please don't hesitate to contact us.</p>

<div class="footer">
<p>Need help? Contact us:</p>
<p>Whatsapp: +81 090-5960-9701</p>
<p>✉️ contact@tomodachitours.com</p>
</div>
</div>
</div>
</body>
</html>
```

## Template 2: Company Booking Request Notification

**Template ID**: `d-e3a27de126df45908ad6036088fb9c15`
**Purpose**: Sent to company team when a new booking request is submitted
**Recipients**: Admin team (spirivincent03@gmail.com, contact@tomodachitours.com, yutaka.m@tomodachitours.com)

### Template Variables

```json
{
  "bookingId": "123",
  "tourType": "uji-tour",
  "tourName": "Uji Tea Tour",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "adultPlural": true,
  "totalAmount": "13,000",
  "specialRequests": "Vegetarian meal preference",
  "requestedDate": "Thu, February 13, 2025",
  "requestedTime": "14:30",
  "paymentMethodId": "pm_1234567890",
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
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 20px;
}
table {
  border-collapse: collapse;
  width: auto;
  border: 1px solid black;
  margin-top: 15px;
}
td {
  padding: 6px 10px;
  vertical-align: top;
}
td:first-child {
  background-color: #e9e9e9;
  text-align: right;
  padding-right: 8px;
  font-weight: normal;
  width: 150px;
}
td:last-child {
  background-color: white;
  padding-left: 10px;
}
.section-break {
  border-top: 1px solid black;
  padding-top: 20px;
}
a {
  color: #0066cc;
  text-decoration: none;
}
.notes {
  white-space: pre-line;
}
.request-status {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px;
  border: 1px solid #ffeaa7;
  margin-bottom: 15px;
  border-radius: 4px;
}
</style>
</head>
<body>
<div class="request-status">
<strong>⚠️ BOOKING REQUEST - REQUIRES APPROVAL</strong><br>
This is a booking request that needs admin review and approval before payment processing.
</div>

<div>The following booking request was just submitted and requires review.</div>

<table>
<tr>
<td><strong>Booking ref.</strong></td>
<td>{{bookingId}}</td>
</tr>
<tr>
<td><strong>Product booking ref.</strong></td>
<td></td>
</tr>
<tr>
<td><strong>Ext. booking ref</strong></td>
<td></td>
</tr>
<tr>
<td><strong>Product</strong></td>
<td>{{tourType}} - {{tourName}}</td>
</tr>
<tr>
<td><strong>Supplier</strong></td>
<td>Tomodachi Tours</td>
</tr>
<tr>
<td><strong>Sold by</strong></td>
<td>Tomodachi Tours</td>
</tr>
<tr>
<td><strong>Booking channel</strong></td>
<td>Direct (Request)</td>
</tr>
<tr class="section-break">
<td><strong>Customer</strong></td>
<td>{{customerName}}</td>
</tr>
<tr>
<td><strong>Customer email</strong></td>
<td><a href="mailto:{{customerEmail}}">{{customerEmail}}</a></td>
</tr>
<tr>
<td><strong>Customer phone</strong></td>
<td>{{customerPhone}}</td>
</tr>
<tr>
<td><strong>Date</strong></td>
<td>{{tourDate}} @ {{tourTime}}</td>
</tr>
<tr>
<td><strong>Rate</strong></td>
<td>{{tourName}}</td>
</tr>
<tr>
<td><strong>PAX</strong></td>
<td>{{adults}} Adult{{#if adultPlural}}s{{/if}}{{#if children}}<br>{{children}} Children{{/if}}{{#if infants}}<br>{{infants}} Infants{{/if}}</td>
</tr>
<tr>
<td><strong>Extras</strong></td>
<td>{{#if specialRequests}}{{specialRequests}}{{else}}None{{/if}}</td>
</tr>
<tr>
<td><strong>Requested</strong></td>
<td>{{requestedDate}} @ {{requestedTime}}</td>
</tr>
<tr>
<td><strong>Status</strong></td>
<td><strong style="color: #856404;">PENDING_CONFIRMATION</strong></td>
</tr>
<tr class="section-break">
<td><strong>Notes</strong></td>
<td class="notes">--- Inclusions: ---
English-Speaking Guide
Approximately 3 hours

--- Booking languages: ---
GUIDE : English

--- Payment: ---
Amount: JPY {{totalAmount}}
Payment Method: Stored securely ({{paymentMethodId}})
Status: Will be charged upon approval

--- Action Required: ---
1. Check availability with partner company
2. Log into admin dashboard to approve/reject
3. Respond within 24 hours</td>
</tr>
</table>

<div style="margin-top: 20px; padding: 15px; background-color: #e8f4ff; border-left: 4px solid #1a4789;">
<strong>📍 Meeting Point:</strong><br>
{{meetingPoint.location}}<br>
{{#if meetingPoint.additional_info}}<em>{{meetingPoint.additional_info}}</em><br>{{/if}}
<a href="{{meetingPoint.google_maps_url}}">View on Google Maps</a>
</div>

<div style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7;">
<strong>Admin Actions:</strong><br>
• <a href="https://admin.tomodachitours.com">Admin Dashboard</a><br>
• Contact: contact@tomodachitours.com
</div>
</body>
</html>
```

## Template 3: Request Rejected Notification

**Template ID**: `d-236d283e8a5a4271995de8ec5064c49b`
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
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #dc3545;color: white;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.rejection-reason {background: #f8d7da;color: #721c24;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #dc3545;}
.alternatives {background: #e8f4ff;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #1a4789;}
.no-charge {background: #d1ecf1;color: #0c5460;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Booking Request Update</h1>
</div>
<div class="content">
<p>Dear {{customerName}},</p>

<p>Thank you for your interest in our {{tourName}}. Unfortunately, we are unable to accommodate your booking request at this time.</p>

<p>Booking reference: <strong>{{bookingId}}</strong></p>

<div class="booking-details">
<h2>{{tourName}}</h2>
<p><strong>Requested Date:</strong> {{tourDate}}</p>
<p><strong>Requested Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
</div>

<div class="rejection-reason">
<h2>Reason</h2>
<p>{{rejectionReason}}</p>
</div>

<div class="alternatives">
<h2>Alternative Options</h2>
<p>We'd love to help you experience Uji! Here are some alternatives:</p>
<ul>
  <li><strong>Different Dates:</strong> Check our website for available dates</li>
  <li><strong>Other Tours:</strong> Consider our Kyoto tours which have more frequent availability</li>
  <li><strong>Waitlist:</strong> Contact us to be added to our waitlist for cancellations</li>
</ul>
<a href="https://tomodachitours.com" class="button">🌸 Browse Other Tours</a>
</div>

<div class="no-charge">
<p><strong>Important:</strong> Your payment method has not been charged. No payment was processed for this request.</p>
</div>

<p>We sincerely apologize for any inconvenience. Please don't hesitate to contact us if you'd like to explore alternative dates or tours.</p>

<div class="footer">
<p>Need help? Contact us:</p>
<p>Whatsapp: +81 090-5960-9701</p>
<p>✉️ contact@tomodachitours.com</p>
<p><em>Visit our website: <a href="https://tomodachitours.com">tomodachitours.com</a></em></p>
</div>
</div>
</div>
</body>
</html>
```

## Template 4: Payment Failed Notification (Customer)

**Template ID**: `d-0cafd30a53044f2fb64d676a9964d982`
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
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #ffc107;color: #212529;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.payment-error {background: #f8d7da;color: #721c24;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #dc3545;}
.next-steps {background: #e8f4ff;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #1a4789;}
.time-sensitive {background: #fff3cd;color: #856404;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
h1 {color: #212529;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>⚠️ Payment Processing Issue</h1>
</div>
<div class="content">
<p>Dear {{customerName}},</p>

<p>Good news! Your booking request for {{tourName}} has been approved. However, we encountered an issue processing your payment.</p>

<p>Booking reference: <strong>{{bookingId}}</strong></p>

<div class="booking-details">
<h2>{{tourName}}</h2>
<p><strong>Date:</strong> {{tourDate}}</p>
<p><strong>Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
<p><strong>Amount:</strong> {{totalAmount}}</p>
</div>

<div class="payment-error">
<h2>Payment Issue</h2>
<p><strong>Error:</strong> {{paymentError}}</p>
</div>

<div class="next-steps">
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
</div>

<div class="time-sensitive">
<p><strong>⚠️ Important:</strong> Your booking is approved but not yet confirmed. We'll hold your spot for 24 hours while you resolve the payment issue. After that, the booking may be released to other customers.</p>
</div>

<p>Please contact us as soon as possible at contact@tomodachitours.com or reply to this email.</p>

<div class="footer">
<p>Need help? Contact us:</p>
<p>Whatsapp: +81 090-5960-9701</p>
<p>✉️ contact@tomodachitours.com</p>
</div>
</div>
</div>
</body>
</html>
```

## Template 5: Payment Failed Notification (Company)

**Template ID**: `d-752cc6754d7148c99dbec67c462db656`
**Purpose**: Sent to company team when payment processing fails for an approved booking request
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
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #dc3545;color: white;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.customer-info {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.error-details {background: #f8d7da;color: #721c24;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #dc3545;}
.actions {background: #fff3cd;color: #856404;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
.priority {background: #d1ecf1;color: #0c5460;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🚨 Payment Processing Failed</h1>
</div>
<div class="content">
<p>A booking request was approved but payment processing failed. Immediate action required.</p>

<div class="customer-info">
<h2>Customer Information</h2>
<p><strong>Name:</strong> {{customerName}}</p>
<p><strong>Email:</strong> {{customerEmail}}</p>
{{#if customerPhone}}<p><strong>Phone:</strong> {{customerPhone}}</p>{{/if}}
</div>

<div class="booking-details">
<h2>Booking Details</h2>
<p><strong>Booking ID:</strong> {{bookingId}}</p>
<p><strong>Tour:</strong> {{tourName}}</p>
<p><strong>Date:</strong> {{tourDate}}</p>
<p><strong>Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
<p><strong>Amount:</strong> {{totalAmount}}</p>
</div>

<div class="error-details">
<h2>Payment Error Details</h2>
<p><strong>Payment Method ID:</strong> {{paymentMethodId}}</p>
<p><strong>Error:</strong> {{errorDetails}}</p>
<p><strong>Status:</strong> PENDING_CONFIRMATION (payment failed)</p>
</div>

<div class="actions">
<h2>Required Actions</h2>
<ol>
  <li><strong>Contact Customer:</strong> Reach out within 2 hours to resolve payment issue</li>
  <li><strong>Admin Dashboard:</strong> Check for retry options or manual payment processing</li>
  <li><strong>Alternative Payment:</strong> Offer bank transfer or different payment method</li>
  <li><strong>Time Limit:</strong> Resolve within 24 hours or consider releasing the booking</li>
</ol>
</div>

<div class="priority">
<h2>Customer Notification</h2>
<p>✅ Customer has been automatically notified about the payment issue and next steps.</p>
<p><strong>⚠️ Priority:</strong> This booking is approved but not confirmed. Customer expects confirmation soon.</p>
</div>

<div class="footer">
<p>Admin Dashboard: <a href="https://admin.tomodachitours.com">admin.tomodachitours.com</a></p>
<p>Contact: contact@tomodachitours.com</p>
</div>
</div>
</div>
</body>
</html>
```

## Template Creation Status

✅ **All Templates Created in SendGrid**

The following templates have been created and are ready to use:

1. **Customer Request Received**: `d-ab9af3697fa443a6a248b787da1c4533`
2. **Company Notification**: `d-e3a27de126df45908ad6036088fb9c15`
3. **Request Rejected**: `d-236d283e8a5a4271995de8ec5064c49b`
4. **Payment Failed (Customer)**: `d-0cafd30a53044f2fb64d676a9964d982`
5. **Payment Failed (Company)**: `d-752cc6754d7148c99dbec67c462db656`

✅ **Function Code Updated**
- Template IDs have been updated in both `create-booking-request/index.ts` and `manage-booking-request/index.ts`
- All `SENDGRID_TEMPLATES` constants now use the actual template IDs

## Email Flow Summary

### 1. Customer Submits Booking Request
- **Template Used**: Customer Request Received (`d-booking-request-confirmation`)
- **Sent To**: Customer
- **Trigger**: When booking request is submitted via `create-booking-request` function

### 2. Company Gets Notified
- **Template Used**: Company Booking Request Notification (`d-booking-request-admin-notification`)
- **Sent To**: Admin team
- **Trigger**: When booking request is submitted via `create-booking-request` function

### 3. Admin Approves Request (Success Path)
- **Template Used**: Existing booking confirmation template (same as instant bookings)
- **Sent To**: Customer
- **Trigger**: When admin approves via `manage-booking-request` function and payment succeeds

### 4. Admin Rejects Request
- **Template Used**: Request Rejected (`d-booking-request-rejected`)
- **Sent To**: Customer
- **Trigger**: When admin rejects via `manage-booking-request` function

### 5. Payment Fails After Approval
- **Template Used**: Payment Failed Customer (`d-booking-request-payment-failed`)
- **Sent To**: Customer
- **Template Used**: Payment Failed Company (`d-booking-request-admin-payment-failed`)
- **Sent To**: Admin team
- **Trigger**: When admin approves but payment processing fails

## Testing

After creating templates, test with:

### Test Customer Request Submission
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