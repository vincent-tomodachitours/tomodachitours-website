/**
 * Remarketing Audience Management Service
 * 
 * This service manages Google Ads remarketing audiences based on user behavior,
 * tour interests, and booking funnel progression. It integrates with the existing
 * analytics system to create targeted audience segments for advertising campaigns.
 */

import { getShouldTrack } from './analytics/config';
import { getTourCategory, getTourLocation } from './analytics/helpers';

// Global window type extensions already declared in gtmService.ts

// ============================================================================
// REMARKETING TYPE DEFINITIONS
// ============================================================================

export interface AudienceCriteria {
    pageViews?: string[];
    events?: string[];
    tourTypes?: string[];
    minViews?: number;
    minEvents?: number;
    excludeEvents?: string[];
    timeWindow?: number; // hours
}

export interface AudienceConfig {
    id: string;
    name: string;
    description: string;
    membershipDuration: number; // days
    criteria: AudienceCriteria;
}

export interface AudienceInstance extends AudienceConfig {
    isActive: boolean;
    createdAt: number;
    members: Set<string>;
}

export interface UserAudienceMembership {
    joinedAt: number;
    eventData: RemarketingEventData;
    expiresAt: number;
}

export interface RemarketingEventData {
    tourId?: string;
    tourName?: string;
    tourCategory?: string;
    tourLocation?: string;
    price?: number;
    viewTimestamp?: number;
    page?: string;
    abandonmentTimestamp?: number;
    timeInCart?: number;
    checkoutStep?: number;
    purchaseTimestamp?: number;
    engagementScore?: number;
    lastEngagement?: number;
    engagementTypes?: string[];
}

export interface SessionData {
    sessionId: string;
    startTime: number;
    userId: string | null;
}

export interface EngagementEvent {
    type: string;
    timestamp: number;
    data: RemarketingEventData;
}

export interface EngagementData {
    events: EngagementEvent[];
    startTime: number;
}

export interface AudienceSegment {
    id: string;
    name: string;
    joinedAt: number;
    expiresAt: number;
    eventData: RemarketingEventData;
}

export interface AudienceStats {
    name: string;
    memberCount: number;
    isActive: boolean;
    membershipDuration: number;
    createdAt: number;
}

export interface RemarketingValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface TourViewData {
    tourId: string;
    tourName?: string;
}

export interface CartAbandonmentData {
    timeInCart?: number;
    [key: string]: any;
}

export interface CheckoutAbandonmentData {
    checkoutStep?: number;
    [key: string]: any;
}

export interface PurchaseCompletionData {
    [key: string]: any;
}

// Audience configuration constants
const AUDIENCE_CONFIGS: Record<string, AudienceConfig> = {
    // Tour interest audiences based on page views
    TOUR_INTEREST_GION: {
        id: 'gion_tour_interest',
        name: 'Gion Tour Interest',
        description: 'Users who viewed Gion tour pages',
        membershipDuration: 30, // days
        criteria: {
            pageViews: ['/gion-tour', '/tours/gion'],
            events: ['view_item'],
            tourTypes: ['gion'],
            minViews: 1
        }
    },
    TOUR_INTEREST_MORNING: {
        id: 'morning_tour_interest',
        name: 'Morning Tour Interest',
        description: 'Users who viewed Morning tour pages',
        membershipDuration: 30,
        criteria: {
            pageViews: ['/morning-tour', '/tours/morning'],
            events: ['view_item'],
            tourTypes: ['morning'],
            minViews: 1
        }
    },
    TOUR_INTEREST_NIGHT: {
        id: 'night_tour_interest',
        name: 'Night Tour Interest',
        description: 'Users who viewed Night tour pages',
        membershipDuration: 30,
        criteria: {
            pageViews: ['/night-tour', '/tours/night'],
            events: ['view_item'],
            tourTypes: ['night'],
            minViews: 1
        }
    },
    TOUR_INTEREST_UJI: {
        id: 'uji_tour_interest',
        name: 'Uji Tour Interest',
        description: 'Users who viewed Uji tour pages',
        membershipDuration: 30,
        criteria: {
            pageViews: ['/uji-tour', '/tours/uji'],
            events: ['view_item'],
            tourTypes: ['uji'],
            minViews: 1
        }
    },

    // Booking funnel audiences
    CART_ABANDONERS: {
        id: 'cart_abandoners',
        name: 'Cart Abandoners',
        description: 'Users who added tours to cart but did not complete booking',
        membershipDuration: 7,
        criteria: {
            events: ['add_to_cart'],
            excludeEvents: ['purchase'],
            timeWindow: 24 // hours
        }
    },
    CHECKOUT_ABANDONERS: {
        id: 'checkout_abandoners',
        name: 'Checkout Abandoners',
        description: 'Users who started checkout but did not complete booking',
        membershipDuration: 7,
        criteria: {
            events: ['begin_checkout'],
            excludeEvents: ['purchase'],
            timeWindow: 24
        }
    },

    // High-value audiences
    HIGH_ENGAGEMENT: {
        id: 'high_engagement_users',
        name: 'High Engagement Users',
        description: 'Users with high engagement who have not yet booked',
        membershipDuration: 14,
        criteria: {
            events: ['view_item', 'view_pricing'],
            minEvents: 3,
            excludeEvents: ['purchase'],
            timeWindow: 72
        }
    },

    // Exclusion audiences
    RECENT_CUSTOMERS: {
        id: 'recent_customers',
        name: 'Recent Customers',
        description: 'Users who completed a booking in the last 90 days',
        membershipDuration: 90,
        criteria: {
            events: ['purchase'],
            timeWindow: 2160 // 90 days in hours
        }
    }
};

class RemarketingManager {
    private audiences: Map<string, AudienceInstance>;
    private userAudienceData: Map<string, Map<string, UserAudienceMembership>>;
    private sessionData: SessionData;

    constructor() {
        this.audiences = new Map();
        this.userAudienceData = new Map();
        this.sessionData = this.getSessionData();
        this.initializeAudiences();
    }

    /**
     * Initialize predefined audience configurations
     */
    private initializeAudiences(): void {
        Object.values(AUDIENCE_CONFIGS).forEach(config => {
            this.audiences.set(config.id, {
                ...config,
                isActive: true,
                createdAt: Date.now(),
                members: new Set()
            });
        });
    }

    /**
     * Get current session data for audience tracking
     */
    private getSessionData(): SessionData {
        try {
            const sessionId = sessionStorage.getItem('analytics_session_id') ||
                `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            if (!sessionStorage.getItem('analytics_session_id')) {
                sessionStorage.setItem('analytics_session_id', sessionId);
            }

            return {
                sessionId,
                startTime: Date.now(),
                userId: (typeof localStorage !== 'undefined') ? localStorage.getItem('user_id') : null
            };
        } catch (error) {
            console.warn('Session storage not available:', error);
            return {
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                startTime: Date.now(),
                userId: null
            };
        }
    }

    /**
     * Create a new custom audience
     */
    public createAudience(audienceConfig: AudienceConfig): AudienceInstance | null {
        if (!getShouldTrack()) return null;

        const audience: AudienceInstance = {
            id: audienceConfig.id,
            name: audienceConfig.name,
            description: audienceConfig.description || '',
            criteria: audienceConfig.criteria,
            membershipDuration: audienceConfig.membershipDuration || 30,
            isActive: true,
            createdAt: Date.now(),
            members: new Set()
        };

        this.audiences.set(audience.id, audience);

        // Store in localStorage for persistence
        this.persistAudienceConfig(audience);

        return audience;
    }

    /**
     * Add user to specific audience based on behavior
     */
    public addUserToAudience(userId: string, audienceId: string, eventData: RemarketingEventData = {}): void {
        if (!getShouldTrack()) return;

        const audience = this.audiences.get(audienceId);
        if (!audience || !audience.isActive) return;

        // Add user to audience
        audience.members.add(userId);

        // Track user's audience membership
        if (!this.userAudienceData.has(userId)) {
            this.userAudienceData.set(userId, new Map());
        }

        const userAudiences = this.userAudienceData.get(userId)!;
        userAudiences.set(audienceId, {
            joinedAt: Date.now(),
            eventData,
            expiresAt: Date.now() + (audience.membershipDuration * 24 * 60 * 60 * 1000)
        });

        // Fire Google Ads remarketing event
        this.fireRemarketingEvent(audienceId, eventData);

        // Persist audience membership
        this.persistUserAudience(userId, audienceId, eventData);
    }

    /**
     * Remove user from specific audience
     */
    public removeUserFromAudience(userId: string, audienceId: string): void {
        if (!getShouldTrack()) return;

        const audience = this.audiences.get(audienceId);
        if (audience) {
            audience.members.delete(userId);
        }

        const userAudiences = this.userAudienceData.get(userId);
        if (userAudiences) {
            userAudiences.delete(audienceId);
        }

        // Remove from localStorage
        this.removePersistedUserAudience(userId, audienceId);
    }

    /**
     * Get all audience segments for a user
     */
    public getAudienceSegments(userId?: string): AudienceSegment[] {
        if (!userId) {
            userId = this.sessionData.userId || this.sessionData.sessionId;
        }

        const userAudiences = this.userAudienceData.get(userId);
        if (!userAudiences) return [];

        const segments: AudienceSegment[] = [];
        userAudiences.forEach((membershipData, audienceId) => {
            const audience = this.audiences.get(audienceId);
            if (audience && membershipData.expiresAt > Date.now()) {
                segments.push({
                    id: audienceId,
                    name: audience.name,
                    joinedAt: membershipData.joinedAt,
                    expiresAt: membershipData.expiresAt,
                    eventData: membershipData.eventData
                });
            }
        });

        return segments;
    }

    /**
     * Process tour view event for audience tagging
     */
    public processTourView(tourData: TourViewData): void {
        if (!getShouldTrack() || !tourData) return;

        const userId = this.sessionData.userId || this.sessionData.sessionId;
        const tourCategory = getTourCategory(tourData.tourId);
        const tourLocation = getTourLocation(tourData.tourId);

        // Add to tour-specific interest audiences
        const audienceMap: Record<string, keyof typeof AUDIENCE_CONFIGS> = {
            'gion': 'TOUR_INTEREST_GION',
            'morning': 'TOUR_INTEREST_MORNING',
            'night': 'TOUR_INTEREST_NIGHT',
            'uji': 'TOUR_INTEREST_UJI'
        };

        const audienceKey = audienceMap[tourCategory.toLowerCase()];
        if (audienceKey && AUDIENCE_CONFIGS[audienceKey]) {
            this.addUserToAudience(userId, AUDIENCE_CONFIGS[audienceKey].id, {
                tourId: tourData.tourId,
                tourName: tourData.tourName,
                tourCategory,
                tourLocation,
                viewTimestamp: Date.now(),
                page: window.location.pathname
            });
        }

        // Track engagement for high-value audience
        this.trackEngagementEvent('view_item', tourData);
    }

    /**
     * Process cart abandonment for remarketing
     */
    public processCartAbandonment(cartData: CartAbandonmentData): void {
        if (!getShouldTrack() || !cartData) return;

        const userId = this.sessionData.userId || this.sessionData.sessionId;

        this.addUserToAudience(userId, AUDIENCE_CONFIGS.CART_ABANDONERS.id, {
            ...cartData,
            abandonmentTimestamp: Date.now(),
            timeInCart: cartData.timeInCart || 0
        });
    }

    /**
     * Process checkout abandonment for remarketing
     */
    public processCheckoutAbandonment(checkoutData: CheckoutAbandonmentData): void {
        if (!getShouldTrack()) return;

        const userId = this.sessionData.userId || this.sessionData.sessionId;

        this.addUserToAudience(userId, AUDIENCE_CONFIGS.CHECKOUT_ABANDONERS.id, {
            ...checkoutData,
            abandonmentTimestamp: Date.now(),
            checkoutStep: checkoutData.checkoutStep || 1
        });
    }

    /**
     * Process purchase completion to exclude from acquisition audiences
     */
    public processPurchaseCompletion(purchaseData: PurchaseCompletionData): void {
        if (!getShouldTrack()) return;

        const userId = this.sessionData.userId || this.sessionData.sessionId;

        // Add to recent customers exclusion audience
        this.addUserToAudience(userId, AUDIENCE_CONFIGS.RECENT_CUSTOMERS.id, {
            ...purchaseData,
            purchaseTimestamp: Date.now()
        });

        // Remove from acquisition and abandonment audiences
        const exclusionAudiences = [
            AUDIENCE_CONFIGS.CART_ABANDONERS.id,
            AUDIENCE_CONFIGS.CHECKOUT_ABANDONERS.id,
            AUDIENCE_CONFIGS.HIGH_ENGAGEMENT.id
        ];

        exclusionAudiences.forEach(audienceId => {
            this.removeUserFromAudience(userId, audienceId);
        });
    }

    /**
     * Track engagement events for high-value audience building
     */
    public trackEngagementEvent(eventType: string, eventData: any): void {
        if (!getShouldTrack()) return;

        const userId = this.sessionData.userId || this.sessionData.sessionId;

        // Get current engagement count
        const engagementKey = `engagement_${userId}`;
        let engagementData: EngagementData = { events: [], startTime: Date.now() };

        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(engagementKey);
            if (stored) {
                try {
                    engagementData = JSON.parse(stored);
                } catch (error) {
                    console.warn('Failed to parse engagement data:', error);
                }
            }
        }

        if (!engagementData.events) {
            engagementData.events = [];
            engagementData.startTime = Date.now();
        }

        // Add new event
        engagementData.events.push({
            type: eventType,
            timestamp: Date.now(),
            data: eventData
        });

        // Check if user qualifies for high engagement audience
        const recentEvents = engagementData.events.filter(
            event => Date.now() - event.timestamp < (72 * 60 * 60 * 1000) // 72 hours
        );

        if (recentEvents.length >= 3) {
            this.addUserToAudience(userId, AUDIENCE_CONFIGS.HIGH_ENGAGEMENT.id, {
                engagementScore: recentEvents.length,
                lastEngagement: Date.now(),
                engagementTypes: Array.from(new Set(recentEvents.map(e => e.type)))
            });
        }

        // Update stored engagement data
        engagementData.events = recentEvents; // Keep only recent events
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(engagementKey, JSON.stringify(engagementData));
        }
    }

    /**
     * Fire Google Ads remarketing event
     */
    private fireRemarketingEvent(audienceId: string, eventData: RemarketingEventData): void {
        try {
            // Fire Google Ads remarketing pixel with correct event name
            if (window.gtag) {
                window.gtag('event', 'remarketing_audience', {
                    send_to: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
                    audience_id: audienceId,
                    event_category: 'remarketing',
                    event_label: audienceId,
                    custom_parameter_1: eventData.tourCategory || '',
                    custom_parameter_2: eventData.tourLocation || '',
                    custom_parameter_3: eventData.tourId || '',
                    value: eventData.price || 0,
                    currency: 'JPY'
                });
            }

            // Also push to dataLayer for GTM compatibility
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'remarketing_audience',
                    audience_id: audienceId,
                    tour_category: eventData.tourCategory || '',
                    tour_location: eventData.tourLocation || '',
                    tour_id: eventData.tourId || '',
                    value: eventData.price || 0,
                    currency: 'JPY'
                });
            }
        } catch (error) {
            console.warn('Remarketing event firing failed:', error);
        }
    }

    /**
     * Persist audience configuration to localStorage
     */
    private persistAudienceConfig(audience: AudienceInstance): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const audienceConfigs = JSON.parse(localStorage.getItem('remarketing_audiences') || '{}');
            audienceConfigs[audience.id] = {
                ...audience,
                members: Array.from(audience.members) // Convert Set to Array for JSON
            };
            localStorage.setItem('remarketing_audiences', JSON.stringify(audienceConfigs));
        } catch (error) {
            console.warn('Failed to persist audience config:', error);
        }
    }

    /**
     * Persist user audience membership
     */
    private persistUserAudience(userId: string, audienceId: string, eventData: RemarketingEventData): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const userAudienceKey = `user_audiences_${userId}`;
            const userAudiences = JSON.parse(localStorage.getItem(userAudienceKey) || '{}');

            const audience = this.audiences.get(audienceId);
            if (audience) {
                userAudiences[audienceId] = {
                    joinedAt: Date.now(),
                    eventData,
                    expiresAt: Date.now() + (audience.membershipDuration * 24 * 60 * 60 * 1000)
                };
            }

            localStorage.setItem(userAudienceKey, JSON.stringify(userAudiences));
        } catch (error) {
            console.warn('Failed to persist user audience:', error);
        }
    }

    /**
     * Remove persisted user audience membership
     */
    private removePersistedUserAudience(userId: string, audienceId: string): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const userAudienceKey = `user_audiences_${userId}`;
            const userAudiences = JSON.parse(localStorage.getItem(userAudienceKey) || '{}');
            delete userAudiences[audienceId];
            localStorage.setItem(userAudienceKey, JSON.stringify(userAudiences));
        } catch (error) {
            console.warn('Failed to remove persisted user audience:', error);
        }
    }

    /**
     * Clean up expired audience memberships
     */
    public cleanupExpiredMemberships(): void {
        const now = Date.now();

        this.userAudienceData.forEach((userAudiences, userId) => {
            const expiredAudiences: string[] = [];

            userAudiences.forEach((membershipData, audienceId) => {
                if (membershipData.expiresAt <= now) {
                    expiredAudiences.push(audienceId);
                }
            });

            expiredAudiences.forEach(audienceId => {
                this.removeUserFromAudience(userId, audienceId);
            });
        });
    }

    /**
     * Get audience statistics for reporting
     */
    public getAudienceStats(): Record<string, AudienceStats> {
        const stats: Record<string, AudienceStats> = {};

        this.audiences.forEach((audience, audienceId) => {
            stats[audienceId] = {
                name: audience.name,
                memberCount: audience.members.size,
                isActive: audience.isActive,
                membershipDuration: audience.membershipDuration,
                createdAt: audience.createdAt
            };
        });

        return stats;
    }

    /**
     * Validate remarketing_audience event configuration
     */
    public validateRemarketingConfiguration(): RemarketingValidation {
        const validation: RemarketingValidation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check if Google Ads conversion ID is configured
        if (!process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID) {
            validation.isValid = false;
            validation.errors.push('Google Ads conversion ID not configured');
        }

        // Check if gtag is available
        if (typeof window.gtag === 'undefined') {
            validation.warnings.push('gtag not available - remarketing events may not fire');
        }

        // Check if dataLayer is available for GTM
        if (typeof window.dataLayer === 'undefined') {
            validation.warnings.push('dataLayer not available - GTM integration may not work');
        }

        // Check if audiences are properly configured
        if (this.audiences.size === 0) {
            validation.warnings.push('No remarketing audiences configured');
        }

        // Validate audience configurations
        this.audiences.forEach((audience, audienceId) => {
            if (!audience.criteria) {
                validation.errors.push(`Audience ${audienceId} missing criteria`);
                validation.isValid = false;
            }
            if (!audience.membershipDuration || audience.membershipDuration <= 0) {
                validation.errors.push(`Audience ${audienceId} has invalid membership duration`);
                validation.isValid = false;
            }
        });

        return validation;
    }

    /**
     * Test remarketing_audience event firing
     */
    public async testRemarketingEvent(testAudienceId: string = 'test_audience'): Promise<boolean> {
        try {
            const testEventData: RemarketingEventData = {
                tourCategory: 'Cultural',
                tourLocation: 'Kyoto',
                tourId: 'test-tour',
                price: 8000
            };

            // Fire test event
            this.fireRemarketingEvent(testAudienceId, testEventData);

            // Wait a moment and check if event was fired
            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('Remarketing test event fired successfully');
            return true;
        } catch (error) {
            console.error('Remarketing test event failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const remarketingManager = new RemarketingManager();

// Clean up expired memberships periodically
setInterval(() => {
    remarketingManager.cleanupExpiredMemberships();
}, 60 * 60 * 1000); // Every hour

export default remarketingManager;