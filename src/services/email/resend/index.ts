import { Resend } from 'resend';
import { RESEND_CONFIG } from './config';
import type { BookingConfirmationTemplateData } from '../sendgrid/templates/types';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: RESEND_CONFIG.from,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend Error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log(`Email sent successfully to ${to}`, data);
        return data;
    } catch (error: any) {
        console.error('Resend Error:', error);
        throw new Error('Failed to send email');
    }
}

// Generate HTML template for booking confirmation
function generateBookingConfirmationHTML(data: BookingConfirmationTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #1a4789;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .booking-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .meeting-point {
      background: #e8f4ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1a4789;
    }
    h1 {
      color: #ffffff;
      font-size: 24px;
      margin: 0;
    }
    h2 {
      color: #1a4789;
      font-size: 20px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #2c5aa0;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      margin: 15px 0;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      border: 2px solid #2c5aa0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank you for your booking!</h1>
    </div>
    
    <div class="content">
      <p>Booking confirmation: <strong>${data.bookingId}</strong></p>
      
      <div class="booking-details">
        <h2>${data.tourName}</h2>
        <p><strong>Date:</strong> ${data.tourDate}</p>
        <p><strong>Time:</strong> ${data.tourTime}</p>
        <p><strong>Participants:</strong> ${data.adults} Adults, ${data.children} Children${data.infants ? `, ${data.infants} Infants` : ''}</p>
        <p><strong>Total Amount:</strong> ¥${data.totalAmount}</p>
      </div>
      
      <div class="meeting-point">
        <h2>📍 Meeting Point</h2>
        <p>${data.meetingPoint.location}</p>
        ${data.meetingPoint.additional_info ? `<p><strong>Important:</strong> ${data.meetingPoint.additional_info}</p>` : ''}
        <a href="${data.meetingPoint.google_maps_url}" class="button">📍 Open in Google Maps</a>
      </div>
      
      <h2>What to do on the day</h2>
      <p>Your tour guide will contact you on WhatsApp a few days prior to the tour.</p>
      <p><strong>Please ensure WhatsApp is working on your phone for clear communication.</strong></p>
      
      <div class="footer">
        <p>Need help? Contact us:</p>
        <p>Whatsapp: +81 090-5960-9701</p>
        <p>✉️ contact@tomodachitours.com</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
}

export async function sendBookingConfirmationEmail(
    toEmail: string,
    data: BookingConfirmationTemplateData
) {
    const html = generateBookingConfirmationHTML(data);

    await sendEmail({
        to: toEmail,
        subject: 'Order Confirmed | Ticket Instructions',
        html,
    });
}

export const resendService = {
    sendBookingConfirmationEmail,
};