// Basic tracking functions (non-ecommerce events)

import { getShouldTrack, getShouldTrackMarketing, gtag } from './config.js';
import remarketingManager from '../remarketingManager.js';









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

// Track tour image clicks
export const trackTourImageClick = (tourId, tourName, imageIndex = 0, clickType = 'main_image') => {
    if (!getShouldTrack()) return;

    // Track a single generic tour image click event with all necessary parameters
    gtag('event', 'tour_image_click', {
        event_category: 'engagement',
        event_label: tourName,
        tour_id: tourId,
        tour_name: tourName,
        image_index: imageIndex,
        click_type: clickType,
        content_type: 'tour_image'
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('tour_image_click', {
                tourId,
                tourName,
                imageIndex,
                clickType,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track participant count changes in date picker
export const trackParticipantChange = (tourName, participantType, oldCount, newCount, totalParticipants) => {
    if (!getShouldTrack()) return;

    gtag('event', 'modified_participants', {
        event_category: 'booking_interaction',
        event_label: `${tourName} - ${participantType}`,
        participant_type: participantType,
        old_count: oldCount,
        new_count: newCount,
        total_participants: totalParticipants,
        change_direction: newCount > oldCount ? 'increase' : 'decrease',
        change_amount: Math.abs(newCount - oldCount)
    });

    console.log(`Participant change tracked: ${participantType} ${oldCount} → ${newCount} (Total: ${totalParticipants})`);

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('modified_participants', {
                participant_type: participantType,
                total_participants: totalParticipants,
                tour_name: tourName
            });
        } catch (error) {
            console.warn('Failed to track participant change for remarketing:', error);
        }
    }
};

// Track tour tab clicks (Details, Itinerary, Meeting Point)
export const trackTourTabClick = (tourId, tourName, tabName, tabIndex = 0) => {
    if (!getShouldTrack()) return;

    // Debug logging to verify parameters
    console.log('🔍 Tracking tour tab click:', {
        tourId,
        tourName,
        tabName,
        tabIndex
    });

    // Track a single generic tour tab click event with all necessary parameters
    gtag('event', 'tour_tab_click', {
        event_category: 'engagement',
        event_label: `${tabName} - ${tourName}`,
        tour_id: tourId,
        tour_name: tourName,
        tab_name: tabName,
        tab_index: tabIndex,
        content_type: 'tour_tab',
        engagement_type: 'tab_interaction'
    });

    // Also log to console for debugging
    console.log('📊 GA4 event sent:', 'tour_tab_click', {
        tour_id: tourId,
        tour_name: tourName,
        tab_name: tabName,
        tab_index: tabIndex
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('tour_tab_click', {
                tourId,
                tourName,
                tabName,
                tabIndex,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};