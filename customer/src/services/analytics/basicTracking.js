// Basic tracking functions (non-ecommerce events)

import { getShouldTrack, getShouldTrackMarketing, gtag } from './config.js';
import remarketingManager from '../remarketingManager.js';

// Track contact form submissions
export const trackContactSubmission = (formType = 'contact') => {
    if (!getShouldTrack()) return;

    gtag('event', 'generate_lead', {
        currency: 'JPY',
        value: 0, // Lead value - you can estimate this
        form_type: formType
    });
};

// Track WhatsApp clicks
export const trackWhatsAppClick = () => {
    if (!getShouldTrack()) return;

    gtag('event', 'contact_whatsapp', {
        event_category: 'engagement',
        event_label: 'whatsapp_click'
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('contact_whatsapp', {
                contactMethod: 'whatsapp',
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track phone number clicks
export const trackPhoneClick = () => {
    if (!getShouldTrack()) return;

    gtag('event', 'contact_phone', {
        event_category: 'engagement',
        event_label: 'phone_click'
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('contact_phone', {
                contactMethod: 'phone',
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track pricing section views (micro-conversion)
export const trackPricingView = (tourName) => {
    if (!getShouldTrack()) return;

    gtag('event', 'view_pricing', {
        event_category: 'engagement',
        event_label: tourName,
        tour_name: tourName
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('view_pricing', {
                tourName,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track scroll depth (engagement metric)
export const trackScrollDepth = (percentage) => {
    if (!getShouldTrack()) return;

    gtag('event', 'scroll', {
        event_category: 'engagement',
        event_label: `${percentage}%`,
        value: percentage
    });
};

// Track file downloads (brochures, etc.)
export const trackDownload = (fileName) => {
    if (!getShouldTrack()) return;

    gtag('event', 'file_download', {
        event_category: 'engagement',
        event_label: fileName,
        file_name: fileName
    });
};

// Track video plays (if you add tour videos)
export const trackVideoPlay = (videoName) => {
    if (!getShouldTrack()) return;

    gtag('event', 'video_play', {
        event_category: 'engagement',
        event_label: videoName,
        video_name: videoName
    });
};

// Track search queries (if you add search)
export const trackSearch = (searchTerm) => {
    if (!getShouldTrack()) return;

    gtag('event', 'search', {
        search_term: searchTerm
    });
};

// Track user engagement time
export const trackEngagementTime = (timeInSeconds) => {
    if (!getShouldTrack()) return;

    gtag('event', 'user_engagement', {
        engagement_time_msec: timeInSeconds * 1000
    });
};

// Set user properties for better audience segmentation
export const setUserProperties = (properties) => {
    if (!getShouldTrack()) return;

    gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
        user_properties: properties
    });
};

// Track custom events
export const trackCustomEvent = (eventName, parameters = {}) => {
    if (!getShouldTrack()) return;

    gtag('event', eventName, parameters);
};