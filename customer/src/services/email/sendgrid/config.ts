export const SENDGRID_CONFIG = {
    templates: {
        BOOKING_CONFIRMATION: 'd-80e109cadad44eeab06c1b2396b504b2', // Replace with your actual template ID
        BOOKING_NOTIFICATION: 'd-3337db456cc04cebb2009460bd23a629',
        CANCELLATION_CONFIRMATION: 'd-50d0cfd6a7294a5f91f415b8e4248535',
        CANCELLATION_NOTIFICATION: 'd-827197c8d2b34edc8c706c00dff6cf87'
    },
    from: {
        email: 'contact@tomodachitours.com',
        name: 'Tomodachi Tours'
    }
} as const;

// Validate required environment variables
if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY environment variable is required');
} 