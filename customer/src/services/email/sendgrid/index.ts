import sgMail from '@sendgrid/mail';
import { SENDGRID_CONFIG } from './config';
import type { BookingConfirmationTemplateData } from './templates/types';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailOptions {
    to: string;
    templateId: string;
    dynamicTemplateData: Record<string, any>;
}

async function sendEmail({ to, templateId, dynamicTemplateData }: SendEmailOptions) {
    const msg = {
        to,
        from: SENDGRID_CONFIG.from,
        templateId,
        dynamicTemplateData,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
    } catch (error: any) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error('Error body:', error.response.body);
        }
        throw new Error('Failed to send email');
    }
}

export async function sendBookingConfirmationEmail(
    toEmail: string,
    data: BookingConfirmationTemplateData
) {
    await sendEmail({
        to: toEmail,
        templateId: SENDGRID_CONFIG.templates.BOOKING_CONFIRMATION,
        dynamicTemplateData: data,
    });
}

// Export other email functions that we'll implement later
export const sendgridService = {
    sendBookingConfirmationEmail,
}; 