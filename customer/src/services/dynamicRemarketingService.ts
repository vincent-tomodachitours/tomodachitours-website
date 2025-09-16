/**
 * Dynamic Remarketing Service for Google Ads
 * 
 * This service implements dynamic remarketing functionality that allows Google Ads
 * to show personalized ads featuring specific tours that users have viewed or
 * shown interest in. It integrates with the existing analytics and remarketing
 * systems to provide enhanced targeting capabilities.
 */

import { getShouldTrack, getShouldTrackMarketing, gtag } from './analytics/config';
import { getPriceRange } from './analytics/helpers';
import remarketingManager from './remarketingManager';
import attributionService from './attributionService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TourProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    subcategory: string;
    location: string;
    duration: string;
    image_url: string;
    availability: string;
    group_size: string;
    difficulty: string;
    highlights: string[];
    season: string;
    time_of_day: string;
}

interface DynamicAudienceConfig {
    id: string;
    name: string;
    description: string;
    membershipDuration: number;
    criteria: {
        tourTypes?: string[];
        events?: string[];
        dynamicParameters?: boolean;
        minTourViews?: number;
        minEngagementScore?: number;
        preferredCategory?: string;
        preferredLocation?: string;
        preferredPriceRange?: string;
    };
    dynamicConfig: {
        productId: string;
        customParameters: {
            tour_category: string;
            tour_location: string;
            price_range: string;
        };
    };
}

interface DynamicAudience extends DynamicAudienceConfig {
    isActive: boolean;
    createdAt: number;
    members: Set<string>;
}

interface SessionData {
    sessionId: string;
    userId: string | null;
    startTime: number;
}

interface DynamicRemarketingParameters {
    ecomm_prodid: string;
    ecomm_pagetype: string;
    ecomm_totalvalue: number;
    ecomm_category: string;
    tour_title: string;
    tour_location: string;
    tour_duration: string;
    tour_difficulty: string;
    tour_time_of_day: string;
    tour_season: string;
    tour_highlights: string;
    view_timestamp: number;
    user_engagement_level: number;
    tour_preference_score: number;
    traffic_source?: string;
    campaign_data?: string;
}

interface UserTourView {
    tourId: string;
    timestamp: number;
    category: string;
    location: string;
    duration: string;
    priceRange: string;
}

interface UserPreferences {
    tourViews: UserTourView[];
    preferences: {
        categories?: Record<string, number>;
        locations?: Record<string, number>;
        durations?: Record<string, number>;
        priceRanges?: Record<string, number>;
    };
    lastUpdated: number;
}

interface UserInteraction {
    userId?: string;
    type: string;
    timestamp: number;
}

interface ProductCatalogData {
    id: string;
    title: string;
    description: string;
    price: string;
    image_link: string;
    link: string;
    product_type: string;
    google_product_category: string;
    custom_label_0: string;
    custom_label_1: string;
    custom_label_2: string;
    custom_label_3: string;
    custom_label_4: string;
    availability: string;
    condition: string;
    brand: string;
    mpn: string;
    gtin: string;
    tour_highlights: string;
    group_size: string;
    booking_url: string;
}

interface CustomAudienceConfig {
    name: string;
    description: string;
    criteria: DynamicAudienceConfig['criteria'];
    dynamicConfig: DynamicAudienceConfig['dynamicConfig'];
    membershipDuration?: number;
}

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

const TOUR_PRODUCT_CATALOG: Record<string, TourProduct> = {
    'gion-tour': {
        id: 'gion-tour',
        title: 'Gion District Cultural Walking Tour',
        description: 'Explore the historic Gion district with traditional architecture and geisha culture',
        price: 8000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Walking Tours',
        location: 'Gion, Kyoto',
        duration: '3 hours',
        image_url: '/IMG/Gion-Tour/geisha.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Geisha districts', 'Traditional architecture', 'Cultural insights'],
        season: 'year-round',
        time_of_day: 'afternoon'
    },
    'morning-tour': {
        id: 'morning-tour',
        title: 'Arashiyama Bamboo Grove Morning Tour',
        description: 'Early morning exploration of the famous bamboo forest and Tenryu-ji Temple',
        price: 9000,
        currency: 'JPY',
        category: 'Nature Tours',
        subcategory: 'Walking Tours',
        location: 'Arashiyama, Kyoto',
        duration: '4 hours',
        image_url: '/IMG/Morning-Tour/bamboo-main-highres1.85.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Bamboo grove', 'Temple visit', 'Morning serenity'],
        season: 'year-round',
        time_of_day: 'morning'
    },
    'night-tour': {
        id: 'night-tour',
        title: 'Fushimi Inari Night Photography Tour',
        description: 'Evening photography tour of the famous thousand torii gates',
        price: 7000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Photography Tours',
        location: 'Fushimi, Kyoto',
        duration: '2 hours',
        image_url: '/IMG/Night-Tour/1.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'moderate',
        highlights: ['Torii gates', 'Night photography', 'Spiritual experience'],
        season: 'year-round',
        time_of_day: 'evening'
    },
    'uji-tour': {
        id: 'uji-tour',
        title: 'Uji Tea Culture and Temple Tour',
        description: 'Full day exploration of Uji\'s tea culture and historic temples',
        price: 12000,
        currency: 'JPY',
        category: 'Cultural Tours',
        subcategory: 'Food & Culture Tours',
        location: 'Uji, Kyoto',
        duration: '5 hours',
        image_url: '/IMG/Uji-Tour/uji-temple.webp',
        availability: 'daily',
        group_size: 'small-group',
        difficulty: 'easy',
        highlights: ['Tea ceremony', 'Historic temples', 'Cultural immersion'],
        season: 'year-round',
        time_of_day: 'full-day'
    }
};

const DYNAMIC_REMARKETING_AUDIENCES: Record<string, DynamicAudienceConfig> = {
    TOUR_VIEWERS_GION: {
        id: 'dynamic_gion_viewers',
        name: 'Gion Tour Viewers - Dynamic',
        description: 'Users who viewed Gion tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['gion-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'gion-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Gion',
                price_range: 'mid-range'
            }
        }
    },
    TOUR_VIEWERS_MORNING: {
        id: 'dynamic_morning_viewers',
        name: 'Morning Tour Viewers - Dynamic',
        description: 'Users who viewed Morning tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['morning-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'morning-tour',
            customParameters: {
                tour_category: 'Nature',
                tour_location: 'Arashiyama',
                price_range: 'mid-range'
            }
        }
    },
    TOUR_VIEWERS_NIGHT: {
        id: 'dynamic_night_viewers',
        name: 'Night Tour Viewers - Dynamic',
        description: 'Users who viewed Night tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['night-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'night-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Fushimi',
                price_range: 'budget'
            }
        }
    },
    TOUR_VIEWERS_UJI: {
        id: 'dynamic_uji_viewers',
        name: 'Uji Tour Viewers - Dynamic',
        description: 'Users who viewed Uji tour with dynamic remarketing data',
        membershipDuration: 30,
        criteria: {
            tourTypes: ['uji-tour'],
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'uji-tour',
            customParameters: {
                tour_category: 'Cultural',
                tour_location: 'Uji',
                price_range: 'premium'
            }
        }
    },
    MULTI_TOUR_BROWSERS: {
        id: 'dynamic_multi_tour_browsers',
        name: 'Multi-Tour Browsers - Dynamic',
        description: 'Users who viewed multiple tours with personalized recommendations',
        membershipDuration: 14,
        criteria: {
            minTourViews: 2,
            events: ['view_item'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'multi-tour',
            customParameters: {
                tour_category: 'Mixed',
                tour_location: 'Kyoto',
                price_range: 'varied'
            }
        }
    },
    HIGH_INTENT_BROWSERS: {
        id: 'dynamic_high_intent_browsers',
        name: 'High Intent Browsers - Dynamic',
        description: 'Users with high engagement showing strong booking intent',
        membershipDuration: 7,
        criteria: {
            minEngagementScore: 5,
            events: ['view_item', 'add_to_cart', 'begin_checkout'],
            dynamicParameters: true
        },
        dynamicConfig: {
            productId: 'high-intent',
            customParameters: {
                tour_category: 'High-Intent',
                tour_location: 'Kyoto',
                price_range: 'premium'
            }
        }
    }
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

class DynamicRemarketingService {
    private productCatalog: Record<string, TourProduct>;
    private dynamicAudiences: Map<string, DynamicAudience>;
    private userTourPreferences: Map<string, UserPreferences>;
    private sessionData: SessionData;

    constructor() {
        this.productCatalog = TOUR_PRODUCT_CATALOG;
        this.dynamicAudiences = new Map();
        this.userTourPreferences = new Map();
        this.sessionData = this.getSessionData();
        this.initializeDynamicAudiences();
    }

    // ========================================================================
    // INITIALIZATION METHODS
    // ========================================================================

    /**
     * Get current session data
     */
    private getSessionData(): SessionData {
        try {
            const sessionId = (typeof sessionStorage !== 'undefined' ?
                sessionStorage.getItem('analytics_session_id') : null) ||
                `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            return {
                sessionId,
                userId: (typeof localStorage !== 'undefined' ?
                    localStorage.getItem('user_id') : null) || sessionId,
                startTime: Date.now()
            };
        } catch (error) {
            console.warn('Session storage not available:', error);
            return {
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: null,
                startTime: Date.now()
            };
        }
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
    // ========================================================================
    // CORE DYNAMIC REMARKETING METHODS
    // ========================================================================

    /**
     * Add dynamic remarketing parameters to tour view tracking
     * @param tourData - Tour data from view event
     */
    addDynamicRemarketingParameters(tourData: { tourId: string;[key: string]: any }): void {
        if (!getShouldTrack() || !getShouldTrackMarketing() || !tourData) return;

        const userId = this.sessionData.userId;
        const tourProduct = this.productCatalog[tourData.tourId];

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
            user_engagement_level: this.calculateEngagementLevel(userId),
            tour_preference_score: this.calculateTourPreferenceScore(userId, tourData.tourId),

            // Attribution parameters
            traffic_source: (attributionService as any).getCurrentSource?.() || 'direct',
            campaign_data: (attributionService as any).getCurrentCampaign?.() || 'none'
        };

        // Fire dynamic remarketing event to Google Ads
        this.fireDynamicRemarketingEvent('view_item', dynamicParameters);

        // Update user tour preferences
        this.updateUserTourPreferences(userId, tourData.tourId, tourProduct);

        // Add user to dynamic remarketing audiences
        this.addUserToDynamicAudiences(userId, tourData.tourId, dynamicParameters);

        // Store dynamic parameters for future use
        this.storeDynamicParameters(userId, tourData.tourId, dynamicParameters);
    }

    /**
     * Create tour-specific remarketing audience definitions
     * @param audienceConfig - Configuration for the new audience
     */
    createTourSpecificAudience(audienceConfig: {
        id: string;
        name: string;
        description?: string;
        criteria: DynamicAudienceConfig['criteria'];
        dynamicConfig?: DynamicAudienceConfig['dynamicConfig'];
        membershipDuration?: number;
    }): DynamicAudience | null {
        if (!getShouldTrack() || !getShouldTrackMarketing()) return null;

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
     * Implement product catalog integration for dynamic ads
     * @param tourId - Tour identifier
     * @returns Product catalog data
     */
    getProductCatalogData(tourId: string): ProductCatalogData | null {
        const product = this.productCatalog[tourId];

        if (!product) {
            console.warn(`Product not found in catalog: ${tourId}`);
            return null;
        }

        // Return structured product data for Google Ads
        return {
            // Required fields for Google Ads product catalog
            id: product.id,
            title: product.title,
            description: product.description,
            price: `${product.price} ${product.currency}`,
            image_link: `${window.location.origin}${product.image_url}`,
            link: `${window.location.origin}/${product.id}`,

            // Additional fields for better targeting
            product_type: product.category,
            google_product_category: this.mapToGoogleProductCategory(product.category),
            custom_label_0: product.location,
            custom_label_1: product.duration,
            custom_label_2: product.difficulty,
            custom_label_3: product.time_of_day,
            custom_label_4: product.season,

            // Availability and inventory
            availability: 'in stock',
            condition: 'new',

            // Additional attributes
            brand: 'Tomodachi Tours',
            mpn: product.id,
            gtin: `TOMODACHI${product.id.toUpperCase()}`,

            // Tour-specific attributes
            tour_highlights: product.highlights.join(' | '),
            group_size: product.group_size,
            booking_url: `${window.location.origin}/checkout?tour=${product.id}`
        };
    }

    /**
     * Add custom audience creation based on tour preferences and behavior
     * @param userId - User identifier
     * @param behaviorData - User behavior data
     */
    createCustomAudienceFromBehavior(
        userId: string,
        behaviorData: Record<string, any>
    ): DynamicAudience | null {
        if (!getShouldTrack() || !getShouldTrackMarketing()) return null;

        const userPreferences = this.getUserTourPreferences(userId);
        const engagementLevel = this.calculateEngagementLevel(userId);

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

    // ========================================================================
    // EVENT FIRING AND TRACKING METHODS
    // ========================================================================

    /**
     * Fire dynamic remarketing event to Google Ads
     * @param eventType - Type of remarketing event
     * @param parameters - Dynamic remarketing parameters
     */
    private fireDynamicRemarketingEvent(
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
    // ========================================================================
    // AUDIENCE MANAGEMENT METHODS
    // ========================================================================

    /**
     * Add user to dynamic remarketing audiences
     * @param userId - User identifier
     * @param tourId - Tour identifier
     * @param parameters - Dynamic parameters
     * @param customAudienceId - Optional custom audience ID
     */
    private addUserToDynamicAudiences(
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
                this.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: customAudienceId
                } as any);
            }
            return;
        }

        // Add to tour-specific audiences
        if (tourId) {
            const audienceMap: Record<string, string> = {
                'gion-tour': 'dynamic_gion_viewers',
                'morning-tour': 'dynamic_morning_viewers',
                'night-tour': 'dynamic_night_viewers',
                'uji-tour': 'dynamic_uji_viewers'
            };

            const audienceId = audienceMap[tourId];
            if (audienceId) {
                const audience = this.dynamicAudiences.get(audienceId);
                if (audience) {
                    audience.members.add(userId);

                    // Fire dynamic remarketing event for audience addition
                    this.fireDynamicRemarketingEvent('remarketing_audience', {
                        ...parameters,
                        audience_id: audienceId,
                        audience_name: audience.name
                    } as any);
                }
            }
        }

        // Check for multi-tour browser audience
        const userTourViews = this.getUserTourViews(userId);
        if (userTourViews.length >= 2) {
            const multiTourAudience = this.dynamicAudiences.get('dynamic_multi_tour_browsers');
            if (multiTourAudience) {
                multiTourAudience.members.add(userId);
                this.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: 'dynamic_multi_tour_browsers',
                    tour_count: userTourViews.length
                } as any);
            }
        }

        // Check for high intent audience
        const engagementLevel = this.calculateEngagementLevel(userId);
        if (engagementLevel >= 5) {
            const highIntentAudience = this.dynamicAudiences.get('dynamic_high_intent_browsers');
            if (highIntentAudience) {
                highIntentAudience.members.add(userId);
                this.fireDynamicRemarketingEvent('remarketing_audience', {
                    ...parameters,
                    audience_id: 'dynamic_high_intent_browsers',
                    engagement_score: engagementLevel
                } as any);
            }
        }
    }

    // ========================================================================
    // USER PREFERENCE AND BEHAVIOR METHODS
    // ========================================================================

    /**
     * Update user tour preferences based on behavior
     * @param userId - User identifier
     * @param tourId - Tour identifier
     * @param tourProduct - Tour product data
     */
    private updateUserTourPreferences(userId: string, tourId: string, tourProduct: TourProduct): void {
        if (!this.userTourPreferences.has(userId)) {
            this.userTourPreferences.set(userId, {
                tourViews: [],
                preferences: {},
                lastUpdated: Date.now()
            });
        }

        const userPrefs = this.userTourPreferences.get(userId)!;

        // Add tour view
        userPrefs.tourViews.push({
            tourId,
            timestamp: Date.now(),
            category: tourProduct.category,
            location: tourProduct.location,
            duration: tourProduct.duration,
            priceRange: getPriceRange(tourProduct.price)
        });

        // Update preferences based on tour characteristics
        const prefs = userPrefs.preferences;
        prefs.categories = prefs.categories || {};
        prefs.locations = prefs.locations || {};
        prefs.durations = prefs.durations || {};
        prefs.priceRanges = prefs.priceRanges || {};

        // Increment preference counters
        prefs.categories[tourProduct.category] = (prefs.categories[tourProduct.category] || 0) + 1;
        prefs.locations[tourProduct.location] = (prefs.locations[tourProduct.location] || 0) + 1;
        prefs.durations[tourProduct.duration] = (prefs.durations[tourProduct.duration] || 0) + 1;
        prefs.priceRanges[getPriceRange(tourProduct.price)] = (prefs.priceRanges[getPriceRange(tourProduct.price)] || 0) + 1;

        userPrefs.lastUpdated = Date.now();

        // Store preferences in localStorage for persistence
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`tour_preferences_${userId}`, JSON.stringify(userPrefs));
            }
        } catch (error) {
            console.warn('Failed to store user preferences:', error);
        }
    }

    /**
     * Calculate user engagement level
     * @param userId - User identifier
     * @returns Engagement score
     */
    private calculateEngagementLevel(userId: string): number {
        try {
            const interactions: UserInteraction[] = typeof sessionStorage !== 'undefined' ?
                JSON.parse(sessionStorage.getItem('user_interactions') || '[]') : [];
            const userInteractions = interactions.filter(i => i.userId === userId || !i.userId);

            let score = 0;
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            userInteractions.forEach(interaction => {
                const age = now - interaction.timestamp;
                const recencyMultiplier = age < oneHour ? 2 : age < (24 * oneHour) ? 1.5 : 1;

                switch (interaction.type) {
                    case 'view_item':
                        score += 1 * recencyMultiplier;
                        break;
                    case 'add_to_cart':
                        score += 3 * recencyMultiplier;
                        break;
                    case 'begin_checkout':
                        score += 5 * recencyMultiplier;
                        break;
                    default:
                        score += 0.5 * recencyMultiplier;
                }
            });

            return Math.round(score);
        } catch (error) {
            console.warn('Error calculating engagement level:', error);
            return 0;
        }
    }

    /**
     * Calculate tour preference score for a specific tour
     * @param userId - User identifier
     * @param tourId - Tour identifier
     * @returns Preference score
     */
    private calculateTourPreferenceScore(userId: string, tourId: string): number {
        const userPrefs = this.getUserTourPreferences(userId);
        if (!userPrefs || !userPrefs.preferences) return 0;

        const tourProduct = this.productCatalog[tourId];
        if (!tourProduct) return 0;

        let score = 0;
        const prefs = userPrefs.preferences;

        // Score based on category preference
        if (prefs.categories && prefs.categories[tourProduct.category]) {
            score += prefs.categories[tourProduct.category] * 3;
        }

        // Score based on location preference
        if (prefs.locations && prefs.locations[tourProduct.location]) {
            score += prefs.locations[tourProduct.location] * 2;
        }

        // Score based on duration preference
        if (prefs.durations && prefs.durations[tourProduct.duration]) {
            score += prefs.durations[tourProduct.duration] * 1;
        }

        // Score based on price range preference
        const priceRange = getPriceRange(tourProduct.price);
        if (prefs.priceRanges && prefs.priceRanges[priceRange]) {
            score += prefs.priceRanges[priceRange] * 1;
        }

        return Math.min(score, 10); // Cap at 10
    }

    /**
     * Get user tour preferences
     * @param userId - User identifier
     * @returns User preferences
     */
    private getUserTourPreferences(userId: string): UserPreferences | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const stored = localStorage.getItem(`tour_preferences_${userId}`);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Error retrieving user preferences:', error);
            return null;
        }
    }

    /**
     * Get user tour views
     * @param userId - User identifier
     * @returns Array of tour views
     */
    private getUserTourViews(userId: string): UserTourView[] {
        const userPrefs = this.getUserTourPreferences(userId);
        return userPrefs && userPrefs.tourViews ? userPrefs.tourViews : [];
    }

    // ========================================================================
    // UTILITY AND HELPER METHODS
    // ========================================================================

    /**
     * Store dynamic parameters for future use
     * @param userId - User identifier
     * @param tourId - Tour identifier
     * @param parameters - Dynamic parameters
     */
    private storeDynamicParameters(
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
     * Analyze user behavior to create custom audience configuration
     * @param userPreferences - User tour preferences
     * @param behaviorData - User behavior data
     * @param engagementLevel - User engagement level
     * @returns Custom audience configuration
     */
    private analyzeUserBehaviorForAudience(
        userPreferences: UserPreferences | null,
        behaviorData: Record<string, any>,
        engagementLevel: number
    ): CustomAudienceConfig | null {
        if (!userPreferences || !behaviorData) return null;

        // Determine dominant preferences
        const dominantCategory = this.getDominantPreference(userPreferences.preferences.categories);
        const dominantLocation = this.getDominantPreference(userPreferences.preferences.locations);
        const dominantPriceRange = this.getDominantPreference(userPreferences.preferences.priceRanges);

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
     * Get dominant preference from preference object
     * @param preferences - Preference counts object
     * @returns Dominant preference key
     */
    private getDominantPreference(preferences?: Record<string, number>): string | null {
        if (!preferences || Object.keys(preferences).length === 0) return null;

        return Object.entries(preferences).reduce((max, [key, value]) =>
            value > (preferences[max] || 0) ? key : max,
            Object.keys(preferences)[0]
        );
    }

    /**
     * Map tour category to Google product category
     * @param category - Tour category
     * @returns Google product category
     */
    private mapToGoogleProductCategory(category: string): string {
        const categoryMap: Record<string, string> = {
            'Cultural Tours': 'Arts & Entertainment > Events & Attractions',
            'Nature Tours': 'Arts & Entertainment > Events & Attractions',
            'Photography Tours': 'Arts & Entertainment > Events & Attractions',
            'Food & Culture Tours': 'Arts & Entertainment > Events & Attractions'
        };

        return categoryMap[category] || 'Arts & Entertainment > Events & Attractions';
    }

    // ========================================================================
    // PUBLIC API METHODS
    // ========================================================================

    /**
     * Get all dynamic audiences
     * @returns Map of dynamic audiences
     */
    getDynamicAudiences(): Map<string, DynamicAudience> {
        return this.dynamicAudiences;
    }

    /**
     * Get audience by ID
     * @param audienceId - Audience identifier
     * @returns Dynamic audience or null
     */
    getAudience(audienceId: string): DynamicAudience | null {
        return this.dynamicAudiences.get(audienceId) || null;
    }

    /**
     * Get product catalog
     * @returns Product catalog
     */
    getProductCatalog(): Record<string, TourProduct> {
        return this.productCatalog;
    }

    /**
     * Get current session data (public method)
     * @returns Current session data
     */
    getCurrentSessionData(): SessionData {
        return this.sessionData;
    }

    /**
     * Clear user data (for privacy compliance)
     * @param userId - User identifier
     */
    clearUserData(userId: string): void {
        try {
            // Remove from audiences
            this.dynamicAudiences.forEach(audience => {
                audience.members.delete(userId);
            });

            // Remove from preferences
            this.userTourPreferences.delete(userId);

            // Clear localStorage data
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`tour_preferences_${userId}`);
                localStorage.removeItem(`dynamic_params_${userId}`);
            }
        } catch (error) {
            console.warn('Error clearing user data:', error);
        }
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const dynamicRemarketingService = new DynamicRemarketingService();

export default dynamicRemarketingService;
export type {
    TourProduct,
    DynamicAudienceConfig,
    DynamicAudience,
    DynamicRemarketingParameters,
    UserPreferences,
    ProductCatalogData
};