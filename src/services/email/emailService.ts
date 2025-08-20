import { sendgridService } from './sendgrid';
import { resendService } from './resend';
import type { BookingConfirmationTemplateData } from './sendgrid/templates/types';

type EmailProvider = 'sendgrid' | 'resend';

class EmailService {
    private primaryProvider: EmailProvider;
    private fallbackProvider: EmailProvider;

    constructor() {
        // Determine primary provider based on available API keys
        this.primaryProvider = process.env.SENDGRID_API_KEY ? 'sendgrid' : 'resend';
        this.fallbackProvider = this.primaryProvider === 'sendgrid' ? 'resend' : 'sendgrid';
    }

    async sendBookingConfirmationEmail(
        toEmail: string,
        data: BookingConfirmationTemplateData
    ): Promise<void> {
        try {
            // Try primary provider first
            await this.sendWithProvider(this.primaryProvider, toEmail, data);
            console.log(`Email sent successfully with ${this.primaryProvider}`);
        } catch (primaryError) {
            console.error(`Failed to send email with ${this.primaryProvider}:`, primaryError);

            try {
                // Try fallback provider
                await this.sendWithProvider(this.fallbackProvider, toEmail, data);
                console.log(`Email sent successfully with fallback provider ${this.fallbackProvider}`);
            } catch (fallbackError) {
                console.error(`Failed to send email with fallback provider ${this.fallbackProvider}:`, fallbackError);
                throw new Error(`Failed to send email with both providers. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
            }
        }
    }

    private async sendWithProvider(
        provider: EmailProvider,
        toEmail: string,
        data: BookingConfirmationTemplateData
    ): Promise<void> {
        switch (provider) {
            case 'sendgrid':
                if (!process.env.SENDGRID_API_KEY) {
                    throw new Error('SendGrid API key not configured');
                }
                return sendgridService.sendBookingConfirmationEmail(toEmail, data);

            case 'resend':
                if (!process.env.RESEND_API_KEY) {
                    throw new Error('Resend API key not configured');
                }
                return resendService.sendBookingConfirmationEmail(toEmail, data);

            default:
                throw new Error(`Unknown email provider: ${provider}`);
        }
    }

    getCurrentProvider(): EmailProvider {
        return this.primaryProvider;
    }

    switchProvider(): void {
        const temp = this.primaryProvider;
        this.primaryProvider = this.fallbackProvider;
        this.fallbackProvider = temp;
        console.log(`Switched email provider to ${this.primaryProvider}`);
    }
}

export const emailService = new EmailService();
export { EmailService };