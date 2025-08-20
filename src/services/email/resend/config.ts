export const RESEND_CONFIG = {
    from: 'Tomodachi Tours <contact@tomodachitours.com>',
    templates: {
        // We'll use React components instead of template IDs
        BOOKING_CONFIRMATION: 'booking-confirmation',
        BOOKING_NOTIFICATION: 'booking-notification',
        CANCELLATION_CONFIRMATION: 'cancellation-confirmation',
        CANCELLATION_NOTIFICATION: 'cancellation-notification'
    }
};

// Validate required environment variables
if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY environment variable not found');
}