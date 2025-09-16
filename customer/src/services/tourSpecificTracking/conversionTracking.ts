/**
 * Main Conversion Tracking Functions
 * Provides comprehensive conversion tracking for tour-specific campaigns
 */

import { trackCustomGoogleAdsConversion } from '../googleAdsTracker';
import { getTourCategory, getTourDuration, getTourLocation, getPriceRange } from '../analytics/helpers';
import attributionService from '../attributionService';
import privacyManager from '../privacyManager';

import {
    getCustomerSegmentation,
    getSegmentValueMultiplier,
    getSegmentConversionProbability
} from './customerSegmentation';
import { getTourSpecificLabel } from './conversionLabels';
import { storeTourPerformanceData } from './performanceAnalytics';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BaseConversionData {
    value?: number;
    currency?: string;
    transaction_id?: string;
    [key: string]: any;
}

interface CampaignData {
    tour_focus?: string;
    segment_target?: string;
    campaign_id?: string;
    ad_group_id?: string;
    keyword?: string;
    match_type?: string;
    click_through_rate?: number;
    conversion_rate?: number;
    [key: string]: any;
}

interface PerformanceData {
    page_views?: number;
    engagement_time?: number;
    scroll_depth?: number;
    cta_clicks?: number;
    [key: string]: any;
}

interface EnhancedConversionData extends BaseConversionData {
    tour_id: string;
    tour_category: string;
    tour_location: string;
    tour_duration: string;
    customer_segment: string;
    segment_score: number;
    tour_affinity_gion: number;
    tour_affinity_morning: number;
    tour_affinity_night: number;
    tour_affinity_uji: number;
    campaign_tour_focus: string;
    campaign_segment_target: string;
    campaign_performance_tier: string;
    conversion_timestamp: number;
    session_tour_views: number;
    cross_tour_interest: boolean;
    price_range: string;
    value_per_segment: number;
}

interface PerformanceMetrics {
    tour_id: string;
    timestamp: number;
    page_views: number;
    engagement_time: number;
    scroll_depth: number;
    cta_clicks: number;
    campaign_id?: string;
    ad_group_id?: string;
    keyword?: string;
    match_type?: string;
    tour_category: string;
    tour_location: string;
    seasonal_factor: string;
    customer_segment: string;
}

interface SegmentConversionData extends BaseConversionData {
    customer_segment: string;
    segment_conversion_action: string;
    segment_timestamp: number;
    segment_value_multiplier: number;
    segment_conversion_probability: number;
}

interface CrossTourData extends BaseConversionData {
    campaign_tour_count: number;
    campaign_tours: string;
    campaign_categories: string;
    campaign_locations: string;
    tour_diversity_score: number;
    campaign_coverage: number;
    customer_tour_match: number;
}

type PerformanceTier = 'high' | 'medium' | 'low';
type SeasonalFactor = 'peak' | 'summer' | 'winter';

// ============================================================================
// MAIN TRACKING FUNCTIONS
// ============================================================================

/**
 * Track tour-specific conversion with enhanced parameters
 * @param tourId - Tour identifier
 * @param conversionAction - Conversion action (purchase, begin_checkout, etc.)
 * @param conversionData - Base conversion data
 * @param campaignData - Campaign-specific data
 */
export const trackTourSpecificConversion = (
    tourId: string,
    conversionAction: string,
    conversionData: BaseConversionData = {},
    campaignData: CampaignData = {}
): void => {
    if (!privacyManager.canTrackMarketing() || !tourId || !conversionAction) {
        return;
    }

    // Get tour-specific conversion label
    const tourSpecificLabel = getTourSpecificLabel(tourId, conversionAction);
    if (!tourSpecificLabel) {
        console.warn(`No tour-specific conversion label found for ${tourId}:${conversionAction}`);
        return;
    }

    // Get customer segmentation
    const customerSegmentation = getCustomerSegmentation();

    // Get attribution data
    const attributionData = attributionService.getAttributionForAnalytics();

    // Build enhanced conversion data
    const enhancedConversionData: EnhancedConversionData = {
        ...conversionData,

        // Tour-specific parameters
        tour_id: tourId,
        tour_category: getTourCategory(tourId),
        tour_location: getTourLocation(tourId),
        tour_duration: getTourDuration(tourId),

        // Customer segmentation parameters
        customer_segment: customerSegmentation.primary_segment,
        segment_score: customerSegmentation.segment_score,
        tour_affinity_gion: Math.round(customerSegmentation.tour_affinity['gion-tour']),
        tour_affinity_morning: Math.round(customerSegmentation.tour_affinity['morning-tour']),
        tour_affinity_night: Math.round(customerSegmentation.tour_affinity['night-tour']),
        tour_affinity_uji: Math.round(customerSegmentation.tour_affinity['uji-tour']),

        // Campaign performance parameters
        campaign_tour_focus: campaignData.tour_focus || tourId,
        campaign_segment_target: campaignData.segment_target || customerSegmentation.primary_segment,
        campaign_performance_tier: calculateCampaignPerformanceTier(campaignData),

        // Attribution and source data
        ...attributionData,

        // Enhanced tracking parameters
        conversion_timestamp: Date.now(),
        session_tour_views: getSessionTourViews(),
        cross_tour_interest: customerSegmentation.all_segments.includes('multi_tour_interested'),

        // Price and value parameters
        price_range: getPriceRange(conversionData.value || 0),
        value_per_segment: calculateValuePerSegment(conversionData.value, customerSegmentation.primary_segment)
    };

    // Track the tour-specific conversion
    trackCustomGoogleAdsConversion(tourSpecificLabel, enhancedConversionData);

    // Store tour performance data
    storeTourPerformanceData(tourId, conversionAction, enhancedConversionData);

    console.log(`Tour-specific conversion tracked: ${tourId}:${conversionAction}`, enhancedConversionData);
};

/**
 * Track tour performance for campaign analysis
 * @param tourId - Tour identifier
 * @param performanceData - Performance metrics
 * @param campaignContext - Campaign context data
 */
export const trackTourPerformance = (
    tourId: string,
    performanceData: PerformanceData,
    campaignContext: CampaignData = {}
): void => {
    if (!privacyManager.canTrackMarketing() || !tourId) {
        return;
    }

    const performanceMetrics: PerformanceMetrics = {
        tour_id: tourId,
        timestamp: Date.now(),

        // Performance metrics
        page_views: performanceData.page_views || 0,
        engagement_time: performanceData.engagement_time || 0,
        scroll_depth: performanceData.scroll_depth || 0,
        cta_clicks: performanceData.cta_clicks || 0,

        // Campaign context
        campaign_id: campaignContext.campaign_id,
        ad_group_id: campaignContext.ad_group_id,
        keyword: campaignContext.keyword,
        match_type: campaignContext.match_type,

        // Tour-specific context
        tour_category: getTourCategory(tourId),
        tour_location: getTourLocation(tourId),
        seasonal_factor: calculateSeasonalFactor(),

        // Customer context
        customer_segment: getCustomerSegmentation().primary_segment,

        // Attribution
        ...attributionService.getAttributionForAnalytics()
    };

    // Track performance event
    trackCustomGoogleAdsConversion('tour_performance', performanceMetrics);

    // Store for analysis
    storeTourPerformanceData(tourId, 'performance', performanceMetrics);
};

/**
 * Create customer segment-specific conversion tracking
 * @param segment - Customer segment
 * @param conversionAction - Conversion action
 * @param conversionData - Conversion data
 */
export const trackSegmentSpecificConversion = (
    segment: string,
    conversionAction: string,
    conversionData: BaseConversionData = {}
): void => {
    if (!privacyManager.canTrackMarketing() || !segment || !conversionAction) {
        return;
    }

    const segmentConversionData: SegmentConversionData = {
        ...conversionData,
        customer_segment: segment,
        segment_conversion_action: `${segment}_${conversionAction}`,
        segment_timestamp: Date.now(),

        // Segment-specific parameters
        segment_value_multiplier: getSegmentValueMultiplier(segment),
        segment_conversion_probability: getSegmentConversionProbability(segment),

        // Attribution
        ...attributionService.getAttributionForAnalytics()
    };

    trackCustomGoogleAdsConversion(`segment_${conversionAction}`, segmentConversionData);
};

/**
 * Track cross-tour campaign performance
 * @param tourIds - Array of tour IDs in campaign
 * @param conversionAction - Conversion action
 * @param conversionData - Conversion data
 */
export const trackCrossTourCampaignConversion = (
    tourIds: string[],
    conversionAction: string,
    conversionData: BaseConversionData = {}
): void => {
    if (!privacyManager.canTrackMarketing() || !tourIds || tourIds.length === 0) {
        return;
    }

    const customerSegmentation = getCustomerSegmentation();

    const crossTourData: CrossTourData = {
        ...conversionData,
        campaign_tour_count: tourIds.length,
        campaign_tours: tourIds.join(','),
        campaign_categories: tourIds.map(id => getTourCategory(id)).join(','),
        campaign_locations: tourIds.map(id => getTourLocation(id)).join(','),

        // Cross-tour metrics
        tour_diversity_score: calculateTourDiversityScore(tourIds),
        campaign_coverage: calculateCampaignCoverage(tourIds),

        // Customer fit
        customer_tour_match: calculateCustomerTourMatch(tourIds, customerSegmentation.tour_affinity),

        // Attribution
        ...attributionService.getAttributionForAnalytics()
    };

    trackCustomGoogleAdsConversion(`cross_tour_${conversionAction}`, crossTourData);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getSessionTourViews = (): number => {
    try {
        if (typeof sessionStorage === 'undefined') return 0;
        const interactions = sessionStorage.getItem('user_interactions');
        const parsedInteractions = interactions ? JSON.parse(interactions) : [];
        return parsedInteractions.filter((i: any) => i.type === 'tour_view').length;
    } catch (error) {
        return 0;
    }
};

const calculateCampaignPerformanceTier = (campaignData: CampaignData): PerformanceTier => {
    const ctr = campaignData.click_through_rate || 0;
    const conversionRate = campaignData.conversion_rate || 0;

    if (ctr > 0.05 && conversionRate > 0.03) return 'high';
    if (ctr > 0.02 && conversionRate > 0.015) return 'medium';
    return 'low';
};

const calculateValuePerSegment = (value: number | undefined, segment: string): number => {
    const segmentMultiplier = getSegmentValueMultiplier(segment);
    return Math.round((value || 0) * segmentMultiplier);
};

const calculateSeasonalFactor = (): SeasonalFactor => {
    const month = new Date().getMonth();
    // Spring (March-May) and Fall (September-November) are peak seasons for Kyoto
    if ([2, 3, 4, 8, 9, 10].includes(month)) return 'peak';
    if ([5, 6, 7].includes(month)) return 'summer';
    return 'winter';
};

const calculateTourDiversityScore = (tourIds: string[]): number => {
    const categories = new Set(tourIds.map(id => getTourCategory(id)));
    const locations = new Set(tourIds.map(id => getTourLocation(id)));
    return Math.round(((categories.size + locations.size) / (tourIds.length * 2)) * 100);
};

const calculateCampaignCoverage = (tourIds: string[]): number => {
    const totalTours = 4; // Total number of tours available
    return Math.round((tourIds.length / totalTours) * 100);
};

const calculateCustomerTourMatch = (tourIds: string[], tourAffinities: any): number => {
    let totalMatch = 0;
    tourIds.forEach(tourId => {
        totalMatch += tourAffinities[tourId] || 0;
    });

    return Math.round(totalMatch / tourIds.length);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    BaseConversionData,
    CampaignData,
    PerformanceData,
    EnhancedConversionData,
    PerformanceMetrics,
    SegmentConversionData,
    CrossTourData,
    PerformanceTier,
    SeasonalFactor
};