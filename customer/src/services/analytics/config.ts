// Analytics configuration and environment checks
import privacyManager from '../privacyManager';

// Analytics configuration
export const GA_MEASUREMENT_ID: string = process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Helper function to check if tracking should be enabled (dynamic check)
export const getShouldTrack = (): boolean => {
    const isProduction = process.env.NODE_ENV === 'production';
    const analyticsEnabled = isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

    // Check privacy consent for analytics tracking
    const hasAnalyticsConsent = privacyManager.canTrackAnalytics();

    return analyticsEnabled && hasAnalyticsConsent;
};

// Helper function to check if marketing tracking is allowed
export const getShouldTrackMarketing = (): boolean => {
    const isProduction = process.env.NODE_ENV === 'production';
    const analyticsEnabled = isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

    // Check privacy consent for marketing tracking
    const hasMarketingConsent = privacyManager.canTrackMarketing();

    return analyticsEnabled && hasMarketingConsent;
};

export const isTestEnvironment: boolean = typeof (global as any).jest !== 'undefined' || process.env.NODE_ENV === 'test';

// Define gtag function type
type GtagFunction = (...args: any[]) => void;

// Initialize gtag if not already available (only in browser environment)
let gtag: GtagFunction;

if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    gtag = function (..._args: any[]) {
        (window as any).dataLayer.push(arguments);
    };
    // Make gtag available globally
    (window as any).gtag = gtag;
} else {
    // Fallback for server-side rendering or build time
    gtag = function (..._args: any[]) {
        // No-op during build
    };
}

export { gtag };