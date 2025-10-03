# Booking Request Timeout Email Templates

This document describes the SendGrid email templates that need to be created for the booking request timeout handling system.

## Template 1: Admin Reminder

**Template ID**: `d-timeout-admin-reminder`
**Purpose**: Sent to admin team when a booking request has been pending for the configured reminder time (default: 12 hours)
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
  "hoursPending": 12,
  "requestSubmittedAt": "Thu, Feb 13, 2025 14:30"
}
```

### Email Content Structure

**Subject**: `⏰ REMINDER: Booking Request {{bookingId}} - {{hoursPending}} hours pending`

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
.customer-info {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.urgent-action {background: #fff3cd;color: #856404;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
.time-info {background: #d1ecf1;color: #0c5460;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
h1 {color: #212529;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>⏰ Booking Request Reminder</h1>
</div>
<div class="content">
<p>A booking request has been pending for <strong>{{hoursPending}} hours</strong> and requires immediate attention.</p>

<div class="time-info">
<p><strong>⚠️ Time Sensitive:</strong> Customer expects response within 24 hours of submission</p>
<p><strong>Submitted:</strong> {{requestSubmittedAt}}</p>
<p><strong>Hours Pending:</strong> {{hoursPending}} hours</p>
</div>

<div class="customer-info">
<h2>Customer Information</h2>
<p><strong>Name:</strong> {{customerName}}</p>
<p><strong>Email:</strong> <a href="mailto:{{customerEmail}}">{{customerEmail}}</a></p>
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
{{#if specialRequests}}<p><strong>Special Requests:</strong> {{specialRequests}}</p>{{/if}}
</div>

<div class="urgent-action">
<h2>Action Required</h2>
<ol>
  <li><strong>Check availability</strong> with the partner company immediately</li>
  <li><strong>Log into admin dashboard</strong> to approve or reject the request</li>
  <li><strong>Respond today</strong> - customer is waiting for confirmation</li>
  <li><strong>If unavailable</strong> - reject with clear explanation for customer</li>
</ol>
<a href="https://admin.tomodachitours.com/booking-requests" class="button">📋 Review Request</a>
</div>

<p><strong>Note:</strong> Payment method is securely stored and ready for processing upon approval.</p>

<div class="footer">
<p>Admin Dashboard: <a href="https://admin.tomodachitours.com">admin.tomodachitours.com</a></p>
<p>Contact: contact@tomodachitours.com</p>
</div>
</div>
</div>
</body>
</html>
```

## Template 2: Customer Delay Notification

**Template ID**: `d-timeout-customer-delay`
**Purpose**: Sent to customers when their booking request has been pending for the configured notification time (default: 24 hours)
**Recipient**: Customer who submitted the request

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "customerName": "John Doe",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "specialRequests": "Vegetarian meal preference",
  "hoursPending": 24,
  "requestSubmittedAt": "Thu, Feb 13, 2025 14:30"
}
```

### Email Content Structure

**Subject**: `Update on Your Booking Request - {{tourName}} ({{bookingId}})`

**Body**:
```html
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #17a2b8;color: white;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.status-update {background: #d1ecf1;color: #0c5460;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
.reassurance {background: #d4edda;color: #155724;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #28a745;}
.contact-info {background: #e8f4ff;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #1a4789;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>📋 Booking Request Update</h1>
</div>
<div class="content">
<p>Dear {{customerName}},</p>

<p>Thank you for your patience regarding your booking request for our {{tourName}}.</p>

<div class="booking-details">
<h2>Your Request Details</h2>
<p><strong>Booking ID:</strong> {{bookingId}}</p>
<p><strong>Tour:</strong> {{tourName}}</p>
<p><strong>Date:</strong> {{tourDate}}</p>
<p><strong>Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
<p><strong>Amount:</strong> {{totalAmount}}</p>
<p><strong>Submitted:</strong> {{requestSubmittedAt}}</p>
{{#if specialRequests}}<p><strong>Special Requests:</strong> {{specialRequests}}</p>{{/if}}
</div>

<div class="status-update">
<h2>Current Status</h2>
<p>Your booking request is still being reviewed by our team. We are working with our partner company to confirm availability for your requested date and time.</p>
<p><strong>Status:</strong> Under Review</p>
<p><strong>Time Pending:</strong> {{hoursPending}} hours</p>
</div>

<div class="reassurance">
<h2>What's Happening</h2>
<p>The Uji tour requires special coordination with our local partner company, which sometimes takes longer than our standard 24-hour response time. Rest assured that:</p>
<ul>
  <li>✅ Your request is active and being processed</li>
  <li>✅ Your payment method is securely stored (no charges yet)</li>
  <li>✅ We will contact you as soon as we have confirmation</li>
  <li>✅ If we cannot accommodate your request, you will not be charged</li>
</ul>
</div>

<div class="contact-info">
<h2>Need to Make Changes?</h2>
<p>If you need to modify your request or have questions, please contact us immediately:</p>
<ul>
  <li><strong>WhatsApp:</strong> +81 090-5960-9701</li>
  <li><strong>Email:</strong> contact@tomodachitours.com</li>
</ul>
<p>We appreciate your understanding and look forward to hosting you on this special tour!</p>
</div>

<div class="footer">
<p>Thank you for choosing Tomodachi Tours</p>
<p>✉️ contact@tomodachitours.com | 📱 +81 090-5960-9701</p>
<p><em>Visit our website: <a href="https://tomodachitours.com">tomodachitours.com</a></em></p>
</div>
</div>
</div>
</body>
</html>
```

## Template 3: Auto-Rejection Customer Notification

**Template ID**: `d-timeout-auto-rejection`
**Purpose**: Sent to customers when their booking request is automatically rejected after the configured timeout (default: 48 hours)
**Recipient**: Customer who submitted the request

### Template Variables

```json
{
  "bookingId": "123",
  "tourName": "Uji Tea Tour",
  "customerName": "John Doe",
  "tourDate": "Friday, February 15, 2025",
  "tourTime": "10:00",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "totalAmount": "¥13,000",
  "specialRequests": "Vegetarian meal preference",
  "hoursPending": 48,
  "rejectionReason": "Your booking request was automatically cancelled after 48 hours without confirmation. This helps us manage availability for other customers."
}
```

### Email Content Structure

**Subject**: `Booking Request Expired - {{tourName}} ({{bookingId}})`

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
.auto-rejection {background: #f8d7da;color: #721c24;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #dc3545;}
.no-charge {background: #d1ecf1;color: #0c5460;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
.alternatives {background: #e8f4ff;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #1a4789;}
.apology {background: #fff3cd;color: #856404;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.button {display: inline-block;padding: 15px 30px;background: #2c5aa0;color: white !important;text-decoration: none;border-radius: 8px;margin: 15px 0;font-weight: bold;font-size: 16px;text-align: center;border: 2px solid #2c5aa0;box-shadow: 0 2px 4px rgba(0,0,0,0.1);transition: all 0.3s ease;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>⏰ Booking Request Expired</h1>
</div>
<div class="content">
<p>Dear {{customerName}},</p>

<p>We regret to inform you that your booking request for our {{tourName}} has been automatically cancelled due to our response time policy.</p>

<div class="booking-details">
<h2>Request Details</h2>
<p><strong>Booking ID:</strong> {{bookingId}}</p>
<p><strong>Tour:</strong> {{tourName}}</p>
<p><strong>Requested Date:</strong> {{tourDate}}</p>
<p><strong>Requested Time:</strong> {{tourTime}}</p>
<p><strong>Participants:</strong> {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}{{#if infants}}, {{infants}} Infants{{/if}}</p>
<p><strong>Time Pending:</strong> {{hoursPending}} hours</p>
</div>

<div class="auto-rejection">
<h2>Why This Happened</h2>
<p>{{rejectionReason}}</p>
<p>We automatically cancel booking requests that cannot be confirmed within 48 hours to ensure fair access to our limited tour spots and to prevent customers from waiting indefinitely.</p>
</div>

<div class="no-charge">
<p><strong>✅ Important:</strong> Your payment method was never charged. No payment was processed for this request.</p>
</div>

<div class="apology">
<h2>Our Sincere Apologies</h2>
<p>We deeply apologize for not being able to confirm your booking within our standard timeframe. The Uji tour requires coordination with our partner company, and sometimes this process takes longer than expected.</p>
</div>

<div class="alternatives">
<h2>We'd Still Love to Host You!</h2>
<p>Please don't let this discourage you from experiencing our tours. Here are your options:</p>
<ul>
  <li><strong>Try Again:</strong> Submit a new request for different dates</li>
  <li><strong>Other Tours:</strong> Consider our Kyoto tours with instant confirmation</li>
  <li><strong>Contact Us:</strong> Call or WhatsApp for personalized assistance</li>
  <li><strong>Waitlist:</strong> We can notify you of last-minute availability</li>
</ul>
<a href="https://tomodachitours.com" class="button">🌸 Browse Available Tours</a>
</div>

<p>Thank you for your interest in Tomodachi Tours. We hope to welcome you on a future adventure!</p>

<div class="footer">
<p>Need help? Contact us:</p>
<p>WhatsApp: +81 090-5960-9701</p>
<p>✉️ contact@tomodachitours.com</p>
<p><em>Visit our website: <a href="https://tomodachitours.com">tomodachitours.com</a></em></p>
</div>
</div>
</div>
</body>
</html>
```

## Template 4: Auto-Rejection Admin Notification

**Template ID**: `d-timeout-auto-rejection-admin`
**Purpose**: Sent to admin team when a booking request is automatically rejected after timeout
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
  "hoursPending": 48,
  "autoRejectedAt": "Sat, Feb 15, 2025 14:30"
}
```

### Email Content Structure

**Subject**: `AUTO-REJECTED: Booking {{bookingId}} - {{customerName}} ({{hoursPending}}h timeout)`

**Body**:
```html
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {font-family: Arial, sans-serif;line-height: 1.6;color: #333;margin: 0;padding: 0;}
.container {max-width: 600px;margin: 0 auto;padding: 20px;}
.header {background: #6c757d;color: white;padding: 20px;text-align: center;border-radius: 8px 8px 0 0;}
.content {background: #ffffff;padding: 30px;border-radius: 0 0 8px 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.customer-info {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.booking-details {background: #f8f9fa;padding: 20px;border-radius: 8px;margin: 20px 0;}
.auto-rejection-info {background: #f8d7da;color: #721c24;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #dc3545;}
.system-action {background: #d1ecf1;color: #0c5460;padding: 15px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #17a2b8;}
.follow-up {background: #fff3cd;color: #856404;padding: 20px;border-radius: 8px;margin: 20px 0;border-left: 4px solid #ffc107;}
h1 {color: #ffffff;font-size: 24px;margin: 0;}
h2 {color: #1a4789;font-size: 20px;margin: 20px 0;}
.footer {text-align: center;margin-top: 30px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🤖 Automatic Rejection Processed</h1>
</div>
<div class="content">
<p>A booking request has been automatically rejected due to timeout policy ({{hoursPending}} hours without admin review).</p>

<div class="customer-info">
<h2>Customer Information</h2>
<p><strong>Name:</strong> {{customerName}}</p>
<p><strong>Email:</strong> <a href="mailto:{{customerEmail}}">{{customerEmail}}</a></p>
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
{{#if specialRequests}}<p><strong>Special Requests:</strong> {{specialRequests}}</p>{{/if}}
</div>

<div class="auto-rejection-info">
<h2>Auto-Rejection Details</h2>
<p><strong>Time Pending:</strong> {{hoursPending}} hours</p>
<p><strong>Auto-Rejected At:</strong> {{autoRejectedAt}}</p>
<p><strong>Reason:</strong> Exceeded maximum response time of 48 hours</p>
<p><strong>Status:</strong> REJECTED (automatic)</p>
</div>

<div class="system-action">
<h2>System Actions Completed</h2>
<ul>
  <li>✅ Booking status updated to REJECTED</li>
  <li>✅ Customer notified via email about cancellation</li>
  <li>✅ Payment method reference will be cleaned up in 24 hours</li>
  <li>✅ Event logged in booking_request_events table</li>
</ul>
</div>

<div class="follow-up">
<h2>Recommended Follow-Up</h2>
<p>Consider the following actions to improve response times:</p>
<ul>
  <li><strong>Process Review:</strong> Analyze why this request wasn't processed in time</li>
  <li><strong>Partner Communication:</strong> Check if partner company response times can be improved</li>
  <li><strong>Customer Outreach:</strong> Consider personal follow-up if this was a high-value booking</li>
  <li><strong>System Monitoring:</strong> Review admin notification settings and response procedures</li>
</ul>
</div>

<p><strong>Note:</strong> The customer has been informed about alternative booking options and encouraged to try again with different dates.</p>

<div class="footer">
<p>Admin Dashboard: <a href="https://admin.tomodachitours.com">admin.tomodachitours.com</a></p>
<p>System: Booking Request Timeout Handler</p>
</div>
</div>
</div>
</body>
</html>
```

## Template Creation Instructions

1. **Log into SendGrid Dashboard**
   - Go to Email API > Dynamic Templates
   - Click "Create a Dynamic Template"

2. **Create Each Template**:
   - **Admin Reminder**: Name "Booking Request Timeout - Admin Reminder"
   - **Customer Delay**: Name "Booking Request Timeout - Customer Delay Notification"  
   - **Auto-Rejection Customer**: Name "Booking Request Timeout - Auto-Rejection Customer"
   - **Auto-Rejection Admin**: Name "Booking Request Timeout - Auto-Rejection Admin"

3. **For Each Template**:
   - Create a new version
   - Use the HTML content above
   - Test with sample data
   - Note the template ID (format: d-xxxxxxxxx)

4. **Update Function Code**:
   - Replace placeholder template IDs in `booking-request-timeout-handler/index.ts`
   - Update the `SENDGRID_TEMPLATES` constant with actual IDs

## Testing

After creating templates, test the timeout handler:

### Test Admin Reminders
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "action": "send_admin_reminders",
    "config": {
      "reminder_hours": 1
    }
  }'
```

### Test Customer Delay Notifications
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "action": "send_customer_notifications",
    "config": {
      "customer_notification_hours": 2
    }
  }'
```

### Test Auto-Rejection
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "action": "auto_reject_expired",
    "config": {
      "auto_reject_hours": 3
    }
  }'
```

### Test All Actions
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/booking-request-timeout-handler' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{
    "action": "process_all",
    "config": {
      "reminder_hours": 12,
      "customer_notification_hours": 24,
      "auto_reject_hours": 48,
      "cleanup_payment_methods": true
    }
  }'
```

## Cron Job Integration

The timeout handler is designed to be called by a cron job. See the database migration for cron job setup.

## Email Flow Summary

### Timeline for a Booking Request

1. **T+0 hours**: Customer submits booking request
2. **T+12 hours**: Admin reminder email sent (if not yet reviewed)
3. **T+24 hours**: Customer delay notification sent
4. **T+48 hours**: Auto-rejection emails sent, booking cancelled
5. **T+72 hours**: Payment method references cleaned up

## Integration with Email Failure Logging

The function automatically logs email failures to the `email_failures` table when SendGrid is unavailable or fails. This ensures no timeout notifications are lost and manual follow-up can be performed.