// Basic tracking functions (non-ecommerce events)

import { getShouldTrack, getShouldTrackMarketing, gtag } from './config';
import remarketingManager from '../remarketingManager';
import { AnalyticsEvent, ConversionData } from '../../types';

// Core tracking methods
export const trackEvent = async (event: AnalyticsEvent): Promise<boolean> => {
    if (!getShouldTrack()) return false;

    try {
        gtag('event', event.event, {
            event_category: event.category,
            event_action: event.action,
            event_label: event.label,
            value: event.value,
            ...event.custom_parameters
        });
        return true;
    } catch (error) {
        console.error('Event tracking failed:', error);
        return false;
    }
};

export const trackPageView = async (page: string, title?: string): Promise<boolean> => {
    if (!getShouldTrack()) return false;

    try {
        gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
            page_title: title || page,
            page_location: window.location.href,
            page_path: page
        });
        return true;
    } catch (error) {
        console.error('Page view tracking failed:', error);
        return false;
    }
};

export const trackConversion = async (data: ConversionData): Promise<boolean> => {
    if (!getShouldTrack()) return false;

    try {
        gtag('event', 'conversion', {
            value: data.value,
            currency: data.currency || 'JPY',
            transaction_id: data.transaction_id,
            tour_id: data.tour_id,
            tour_name: data.tour_name,
            tour_category: data.tour_category,
            tour_location: data.tour_location,
            quantity: data.quantity
        });
        return true;
    } catch (error) {
        console.error('Conversion tracking failed:', error);
        return false;
    }
};

export const initialize = async (): Promise<void> => {
    // Analytics initialization is handled by the initialization module
    // This is a placeholder to satisfy the interface
    return Promise.resolve();
};









// Track user engagement time
export const trackEngagementTime = (timeInSeconds: number): void => {
    if (!getShouldTrack()) return;

    gtag('event', 'user_engagement', {
        engagement_time_msec: timeInSeconds * 1000
    });
};

// Set user properties for better audience segmentation
export const setUserProperties = (properties: Record<string, any>): void => {
    if (!getShouldTrack()) return;

    gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
        user_properties: properties
    });
};

// Track custom events
export const trackCustomEvent = async (eventName: string, parameters: Record<string, any> = {}): Promise<boolean> => {
    if (!getShouldTrack()) return false;

    try {
        gtag('event', eventName, parameters);
        return true;
    } catch (error) {
        console.error('Custom event tracking failed:', error);
        return false;
    }
};

// Track tour image clicks (interface version)
export const trackTourImageClick = (tourId: string, imageIndex: number): void => {
    if (!getShouldTrack()) return;

    gtag('event', 'tour_image_click', {
        event_category: 'engagement',
        tour_id: tourId,
        image_index: imageIndex,
        content_type: 'tour_image'
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('tour_image_click', {
                tourId,
                imageIndex,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track tour image clicks (extended version for backward compatibility)
export const trackTourImageClickExtended = (
    tourId: string,
    tourName: string,
    imageIndex: number = 0,
    clickType: string = 'main_image'
): void => {
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
export const trackParticipantChange = (
    tourName: string,
    participantType: string,
    oldCount: number,
    newCount: number,
    totalParticipants: number
): void => {
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

// Track tour tab clicks (interface version)
export const trackTourTabClick = (tourId: string, tabName: string): void => {
    if (!getShouldTrack()) return;

    gtag('event', 'tour_tab_click', {
        event_category: 'engagement',
        tour_id: tourId,
        tab_name: tabName,
        content_type: 'tour_tab'
    });

    // Track engagement for remarketing audiences (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            remarketingManager.trackEngagementEvent('tour_tab_click', {
                tourId,
                tabName,
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Remarketing engagement tracking failed:', error);
        }
    }
};

// Track tour tab clicks (extended version for backward compatibility)
export const trackTourTabClickExtended = (
    tourId: string,
    tourName: string,
    tabName: string,
    tabIndex: number = 0
): void => {
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