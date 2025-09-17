/**
 * Event Tracking Service for Dynamic Remarketing
 */

import type { DynamicRemarketingParameters } from './types';
import { gtag } from '../analytics/config';

export class EventTrackingService {
    /**
     * Fire dynamic remarketing event to Google Ads
     */
    fireDynamicRemarketingEvent(
        eventType: string,
        parameters: DynamicRemarketingParameters | (DynamicRemarketingParameters & { audience_id?: string;[key: string]: any })
    ): void {
        try {
            // Prepare event data based on event type
            let eventData: Record<string, any> = {};

            if (eventType === 'remarketing_audience') {
                // Remarketing audience event structure
                eventData = {
                    send_to: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
                    audience_id: (parameters as any).audience_id,
                    event_category: 'remarketing',
                    event_label: (parameters as any).audience_id,
                    custom_parameter_1: parameters.tour_location || parameters.ecomm_category || '',
                    custom_parameter_2: parameters.tour_duration || parameters.user_engagement_level?.toString() || '',
                    custom_parameter_3: parameters.tour_difficulty || parameters.ecomm_prodid || '',
                    custom_parameter_4: parameters.user_engagement_level?.toString() || '',
                    custom_parameter_5: parameters.tour_preference_score?.toString() || '',
                    value: parameters.ecomm_totalvalue || (parameters as any).value || 0,
                    currency: 'JPY'
                };
            } else {
                // Standard dynamic remarketing event structure
                eventData = {
                    send_to: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
                    event_category: 'dynamic_remarketing',
                    event_label: parameters.ecomm_prodid,
                    ecomm_prodid: parameters.ecomm_prodid,
                    ecomm_pagetype: parameters.ecomm_pagetype,
                    ecomm_totalvalue: parameters.ecomm_totalvalue,
                    ecomm_category: parameters.ecomm_category,
                    custom_parameter_1: parameters.tour_location,
                    custom_parameter_2: parameters.tour_duration,
                    custom_parameter_3: parameters.tour_difficulty,
                    custom_parameter_4: parameters.user_engagement_level?.toString(),
                    custom_parameter_5: parameters.tour_preference_score?.toString(),
                    value: parameters.ecomm_totalvalue,
                    currency: 'JPY',
                    tour_id: parameters.ecomm_prodid,
                    timestamp: parameters.view_timestamp
                };
            }

            // Fire via gtag (direct Google Ads)
            if (typeof gtag !== 'undefined') {
                gtag('event', eventType, eventData);
            }

            // Also push to dataLayer for GTM compatibility
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    event: eventType,
                    ...eventData,
                    // Additional GTM-specific data
                    gtm_event_category: eventData.event_category,
                    gtm_event_label: eventData.event_label
                });
            }

            // Fire GA4 tracking event for cross-platform analysis
            if (eventType !== 'remarketing_audience' && typeof gtag !== 'undefined') {
                gtag('event', `dynamic_${eventType}`, {
                    event_category: 'dynamic_remarketing',
                    event_label: parameters.ecomm_prodid,
                    value: parameters.ecomm_totalvalue,
                    currency: 'JPY',
                    custom_parameter_1: parameters.tour_location,
                    custom_parameter_2: parameters.user_engagement_level?.toString()
                });
            }
        } catch (error) {
            console.warn('Dynamic remarketing event firing failed:', error);
        }
    }

    /**
     * Store dynamic parameters for future use
     */
    storeDynamicParameters(
        userId: string,
        tourId: string,
        parameters: DynamicRemarketingParameters
    ): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const key = `dynamic_params_${userId}`;
            const stored = JSON.parse(localStorage.getItem(key) || '{}');

            if (!stored[tourId]) {
                stored[tourId] = [];
            }

            stored[tourId].push({
                parameters,
                timestamp: Date.now()
            });

            // Keep only last 5 parameter sets per tour
            stored[tourId] = stored[tourId].slice(-5);

            localStorage.setItem(key, JSON.stringify(stored));
        } catch (error) {
            console.warn('Failed to store dynamic parameters:', error);
        }
    }

    /**
     * Clear stored parameters for user (for privacy compliance)
     */
    clearStoredParameters(userId: string): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`dynamic_params_${userId}`);
            }
        } catch (error) {
            console.warn('Error clearing stored parameters:', error);
        }
    }
}

export const eventTrackingService = new EventTrackingService();