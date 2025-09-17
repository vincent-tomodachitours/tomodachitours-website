/**
 * Main Dynamic Remarketing Service
 * 
 * This service orchestrates dynamic remarketing functionality that allows Google Ads
 * to show personalized ads featuring specific tours that users have viewed or
 * shown interest in. It integrates with the existing analytics and remarketing
 * systems to provide enhanced targeting capabilities.
 */

import { getShouldTrack, getShouldTrackMarketing } from '../analytics/config';
import attributionService from '../attributionService';
import { productCatalogService } from './productCatalogService';
import { userPreferencesService } from './userPreferencesService';
import { eventTrackingService } from './eventTrackingService';
import { audienceService } from './audienceService';
import { sessionService } from './sessionService';

import type {
    DynamicRemarketingParameters,
    DynamicAudience,
    SessionData,
    TourProduct,
    ProductCatalogData
} from './types';

export class DynamicRemarketingService {
    /**
     * Add dynamic remarketing parameters to tour view tracking
     */
    addDynamicRemarketingParameters(tourData: { tourId: string;[key: string]: any }): void {
        if (!getShouldTrack() || !getShouldTrackMarketing() || !tourData) return;

        const sessionData = sessionService.getCurrentSessionData();
        const userId = sessionData.userId;
        const tourProduct = productCatalogService.getProduct(tourData.tourId);

        if (!tourProduct) {
            console.warn(`Tour product not found in catalog: ${tourData.tourId}`);
            return;
        }

        if (!userId) {
            console.warn('No user ID available for dynamic remarketing');
            return;
        }

        // Create dynamic remarketing parameters
        const dynamicParameters: DynamicRemarketingParameters = {
            // Google Ads dynamic remarketing parameters
            ecomm_prodid: tourProduct.id,
            ecomm_pagetype: 'product',
            ecomm_totalvalue: tourProduct.price,
            ecomm_category: tourProduct.category,

            // Custom parameters for enhanced targeting
            tour_title: tourProduct.title,
            tour_location: tourProduct.location,
            tour_duration: tourProduct.duration,
            tour_difficulty: tourProduct.difficulty,
            tour_time_of_day: tourProduct.time_of_day,
            tour_season: tourProduct.season,
            tour_highlights: tourProduct.highlights.join(','),

            // User behavior parameters
            view_timestamp: Date.now(),
            user_engagement_level: userPreferencesService.calculateEngagementLevel(userId),
            tour_preference_score: userPreferencesService.calculateTourPreferenceScore(userId, tourData.tourId, tourProduct),

            // Attribution parameters
            traffic_source: (attributionService as any).getCurrentSource?.() || 'direct',
            campaign_data: (attributionService as any).getCurrentCampaign?.() || 'none'
        };

        // Fire dynamic remarketing event to Google Ads
        eventTrackingService.fireDynamicRemarketingEvent('view_item', dynamicParameters);

        // Update user tour preferences
        userPreferencesService.updateUserTourPreferences(userId, tourData.tourId, tourProduct);

        // Add user to dynamic remarketing audiences
        audienceService.addUserToDynamicAudiences(userId, tourData.tourId, dynamicParameters);

        // Store dynamic parameters for future use
        eventTrackingService.storeDynamicParameters(userId, tourData.tourId, dynamicParameters);
    }

    /**
     * Create tour-specific remarketing audience definitions
     */
    createTourSpecificAudience(audienceConfig: {
        id: string;
        name: string;
        description?: string;
        criteria: any;
        dynamicConfig?: any;
        membershipDuration?: number;
    }): DynamicAudience | null {
        if (!getShouldTrack() || !getShouldTrackMarketing()) return null;
        return audienceService.createTourSpecificAudience(audienceConfig);
    }

    /**
     * Get product catalog data for dynamic ads
     */
    getProductCatalogData(tourId: string): ProductCatalogData | null {
        return productCatalogService.getProductCatalogData(tourId);
    }

    /**
     * Create custom audience based on tour preferences and behavior
     */
    createCustomAudienceFromBehavior(
        userId: string,
        behaviorData: Record<string, any>
    ): DynamicAudience | null {
        if (!getShouldTrack() || !getShouldTrackMarketing()) return null;
        return audienceService.createCustomAudienceFromBehavior(userId, behaviorData);
    }

    /**
     * Get all dynamic audiences
     */
    getDynamicAudiences(): Map<string, DynamicAudience> {
        return audienceService.getDynamicAudiences();
    }

    /**
     * Get audience by ID
     */
    getAudience(audienceId: string): DynamicAudience | null {
        return audienceService.getAudience(audienceId);
    }

    /**
     * Get product catalog
     */
    getProductCatalog(): Record<string, TourProduct> {
        return productCatalogService.getAllProducts();
    }

    /**
     * Get current session data
     */
    getCurrentSessionData(): SessionData {
        return sessionService.getCurrentSessionData();
    }

    /**
     * Clear user data (for privacy compliance)
     */
    clearUserData(userId: string): void {
        audienceService.clearUserData(userId);
        userPreferencesService.clearUserData(userId);
        eventTrackingService.clearStoredParameters(userId);
    }
}

// Singleton export
const dynamicRemarketingService = new DynamicRemarketingService();

export default dynamicRemarketingService;

// Re-export types for convenience
export type {
    TourProduct,
    DynamicAudienceConfig,
    DynamicAudience,
    DynamicRemarketingParameters,
    UserPreferences,
    ProductCatalogData
} from './types';