// Analytics configuration and environment checks
import privacyManager from '../privacyManager.js';

// Analytics configuration
export const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Helper function to check if tracking should be enabled (dynamic check)
export const getShouldTrack = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const analyticsEnabled = isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

    // Check privacy consent for analytics tracking
    const hasAnalyticsConsent = privacyManager.canTrackAnalytics();

    return analyticsEnabled && hasAnalyticsConsent;
};

// Helper function to check if marketing tracking is allowed
export const getShouldTrackMarketing = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const analyticsEnabled = isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

    // Check privacy consent for marketing tracking
    const hasMarketingConsent = privacyManager.canTrackMarketing();

    return analyticsEnabled && hasMarketingConsent;
};

export const isTestEnvironment = typeof jest !== 'undefined';

// Initialize gtag if not already available
window.dataLayer = window.dataLayer || [];
function gtag() {
    window.dataLayer.push(arguments);
}

// Make gtag available globally and as export
window.gtag = gtag;
export { gtag };