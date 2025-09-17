/**
 * Audience Management Service for Dynamic Remarketing
 */

import type {
    DynamicAudience,
    DynamicAudienceConfig,
    CustomAudienceConfig,
    UserPreferences
} from './types';
import { DYNAMIC_REMARKETING_AUDIENCES, TOUR_AUDIENCE_MAP } from './constants';
import { eventTrackingService } from './eventTrackingService';
import { userPreferencesService } from './userPreferencesService';
import remarketingManager from '../remarketingManager';

export class AudienceService {
    private dynamicAudiences: Map<string, DynamicAudience>;

    constructor() {
        this.dynamicAudiences = new Map();
        this.initializeDynamicAudiences();
    }

    /**
     * Initialize dynamic remarketing audiences
     */
    private initializeDynamicAudiences(): void {
        Object.values(DYNAMIC_REMARKETING_AUDIENCES).forEach(config => {
            this.dynamicAudiences.set(config.id, {
                ...config,
                isActive: true,
                createdAt: Date.now(),
                members: new Set()
            });
        });
    }

    /**
     * Create tour-specific remarketing audience
     */
    createTourSpecificAudience(audienceConfig: {
        id: string;
        name: string;
        description?: string;
        criteria: DynamicAudienceConfig['criteria'];
        dynamicConfig?: DynamicAudienceConfig['dynamicConfig'];
        membershipDuration?: number;
    }): DynamicAudience | null {
        const audience: DynamicAudience = {
            id: audienceConfig.id,
            name: audienceConfig.name,
            description: audienceConfig.description || '',
            criteria: audienceConfig.criteria,
            dynamicConfig: audienceConfig.dynamicConfig || {
                productId: 'default',
                customParameters: {
                    tour_category: 'General',
                    tour_location: 'Kyoto',
                    price_range: 'varied'
                }
            },
            membershipDuration: audienceConfig.membershipDuration || 30,
            isActive: true,
            createdAt: Date.now(),
            members: new Set()
        };

        this.dynamicAudiences.set(audience.id, audience);

        // Create corresponding audience in remarketing manager
        (remarketingManager as any).createAudience({
            id: `${audience.id}_base`,
            name: `${audience.name} (Base)`,
            description: audience.description,
            criteria: audience.criteria,
            membershipDuration: audience.membershipDuration
        });

        return audience;
    }

    /**
     * Add user to dynamic remarketing audiences
     */
    addUserToDynamicAudiences(
        userId: string,
        tourId: string | null,
        parameters: Record<string, any>,
        customAudienceId: string | null = null
    ): void {
        if (customAudienceId) {
            // Add to specific custom audience
            const audience = this.dynamicAudiences.get(customAudienceId);
            if (audience) {
                audience.members.add(userId);
                eventTrackingService.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: customAudienceId
                } as any);
            }
            return;
        }

        // Add to tour-specific audiences
        if (tourId) {
            const audienceId = TOUR_AUDIENCE_MAP[tourId];
            if (audienceId) {
                const audience = this.dynamicAudiences.get(audienceId);
                if (audience) {
                    audience.members.add(userId);

                    // Fire dynamic remarketing event for audience addition
                    eventTrackingService.fireDynamicRemarketingEvent('remarketing_audience', {
                        ...parameters,
                        audience_id: audienceId,
                        audience_name: audience.name
                    } as any);
                }
            }
        }

        // Check for multi-tour browser audience
        const userTourViews = userPreferencesService.getUserTourViews(userId);
        if (userTourViews.length >= 2) {
            const multiTourAudience = this.dynamicAudiences.get('dynamic_multi_tour_browsers');
            if (multiTourAudience) {
                multiTourAudience.members.add(userId);
                eventTrackingService.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: 'dynamic_multi_tour_browsers',
                    tour_count: userTourViews.length
                } as any);
            }
        }

        // Check for high intent audience
        const engagementLevel = userPreferencesService.calculateEngagementLevel(userId);
        if (engagementLevel >= 5) {
            const highIntentAudience = this.dynamicAudiences.get('dynamic_high_intent_browsers');
            if (highIntentAudience) {
                highIntentAudience.members.add(userId);
                eventTrackingService.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: 'dynamic_high_intent_browsers',
                    engagement_score: engagementLevel
                } as any);
            }
        }
    }

    /**
     * Create custom audience based on user behavior
     */
    createCustomAudienceFromBehavior(
        userId: string,
        behaviorData: Record<string, any>
    ): DynamicAudience | null {
        const userPreferences = userPreferencesService.getUserTourPreferences(userId);
        const engagementLevel = userPreferencesService.calculateEngagementLevel(userId);

        // Analyze user behavior to create custom audience
        const customAudienceConfig = this.analyzeUserBehaviorForAudience(
            userPreferences,
            behaviorData,
            engagementLevel
        );

        if (customAudienceConfig) {
            // Create dynamic custom audience
            const customAudience = this.createTourSpecificAudience({
                id: `custom_${userId}_${Date.now()}`,
                name: `Custom Audience - ${customAudienceConfig.name}`,
                description: `Dynamically created audience based on user behavior: ${customAudienceConfig.description}`,
                criteria: customAudienceConfig.criteria,
                dynamicConfig: customAudienceConfig.dynamicConfig,
                membershipDuration: customAudienceConfig.membershipDuration || 14
            });

            // Add user to the custom audience
            if (customAudience) {
                this.addUserToDynamicAudiences(userId, null, behaviorData, customAudience.id);
            }

            return customAudience;
        }

        return null;
    }

    /**
     * Analyze user behavior to create custom audience configuration
     */
    private analyzeUserBehaviorForAudience(
        userPreferences: UserPreferences | null,
        behaviorData: Record<string, any>,
        engagementLevel: number
    ): CustomAudienceConfig | null {
        if (!userPreferences || !behaviorData) return null;

        // Determine dominant preferences
        const dominantCategory = userPreferencesService.getDominantPreference(userPreferences.preferences.categories);
        const dominantLocation = userPreferencesService.getDominantPreference(userPreferences.preferences.locations);
        const dominantPriceRange = userPreferencesService.getDominantPreference(userPreferences.preferences.priceRanges);

        // Create audience configuration based on behavior patterns
        if (engagementLevel >= 7 && dominantCategory) {
            return {
                name: `High Intent ${dominantCategory} Enthusiast`,
                description: `Users with high engagement interested in ${dominantCategory} tours`,
                criteria: {
                    minEngagementScore: 7,
                    preferredCategory: dominantCategory,
                    preferredLocation: dominantLocation || undefined,
                    preferredPriceRange: dominantPriceRange || undefined
                },
                dynamicConfig: {
                    productId: 'custom-high-intent',
                    customParameters: {
                        tour_category: dominantCategory,
                        tour_location: dominantLocation || 'Kyoto',
                        price_range: dominantPriceRange || 'varied'
                    }
                },
                membershipDuration: 7
            };
        }

        if (engagementLevel >= 3 && dominantLocation) {
            return {
                name: `${dominantLocation} Explorer`,
                description: `Users interested in tours in ${dominantLocation}`,
                criteria: {
                    minEngagementScore: 3,
                    preferredLocation: dominantLocation,
                    preferredCategory: dominantCategory || undefined
                },
                dynamicConfig: {
                    productId: 'custom-location',
                    customParameters: {
                        tour_category: dominantCategory || 'Mixed',
                        tour_location: dominantLocation,
                        price_range: dominantPriceRange || 'varied'
                    }
                },
                membershipDuration: 14
            };
        }

        return null;
    }

    /**
     * Get all dynamic audiences
     */
    getDynamicAudiences(): Map<string, DynamicAudience> {
        return this.dynamicAudiences;
    }

    /**
     * Get audience by ID
     */
    getAudience(audienceId: string): DynamicAudience | null {
        return this.dynamicAudiences.get(audienceId) || null;
    }

    /**
     * Clear user data from all audiences (for privacy compliance)
     */
    clearUserData(userId: string): void {
        try {
            // Remove from audiences
            this.dynamicAudiences.forEach(audience => {
                audience.members.delete(userId);
            });
        } catch (error) {
            console.warn('Error clearing user data from audiences:', error);
        }
    }
}

export const audienceService = new AudienceService();