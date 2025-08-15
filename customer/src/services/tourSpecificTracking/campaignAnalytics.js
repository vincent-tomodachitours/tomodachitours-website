// Campaign analytics and conversion tracking
// Main tracking functions for tour-specific conversions and campaign analysis

import { trackCustomGoogleAdsConversion } from '../googleAdsTracker.js';
import { getTourCategory, getTourDuration, getTourLocation, getPriceRange } from '../analytics/helpers.js';
import attributionService from '../attributionService.js';
import privacyManager from '../privacyManager.js';
import { getTourSpecificLabel } from './conversionLabels.js';
import {
    getCustomerSegmentation,
    getSegmentValueMultiplier,
    getSegmentConversionProbability,
    CUSTOMER_SEGMENTS
} from './customerSegmentation.js';
import { storeTourPerformanceData } from './performanceAnalytics.js';

/**
 * Track tour-specific conversion with enhanced parameters
 * @param {string} tourId - Tour identifier
 * @param {string} conversionAction - Conversion action (purchase, begin_checkout, etc.)
 * @param {Object} conversionData - Base conversion data
 * @param {Object} campaignData - Campaign-specific data
 */
export const trackTourSpecificConversion = (tourId, conversionAction, conversionData = {}, campaignData = {}) => {
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
    const enhancedConversionData = {
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
        cross_tour_interest: customerSegmentation.all_segments.includes(CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED),

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
 * @param {string} tourId - Tour identifier
 * @param {Object} performanceData - Performance metrics
 * @param {Object} campaignContext - Campaign context data
 */
export const trackTourPerformance = (tourId, performanceData, campaignContext = {}) => {
    if (!privacyManager.canTrackMarketing() || !tourId) {
        return;
    }

    const performanceMetrics = {
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
 * @param {string} segment - Customer segment
 * @param {string} conversionAction - Conversion action
 * @param {Object} conversionData - Conversion data
 */
export const trackSegmentSpecificConversion = (segment, conversionAction, conversionData = {}) => {
    if (!privacyManager.canTrackMarketing() || !segment || !conversionAction) {
        return;
    }

    const segmentConversionData = {
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
 * @param {Array} tourIds - Array of tour IDs in campaign
 * @param {string} conversionAction - Conversion action
 * @param {Object} conversionData - Conversion data
 */
export const trackCrossTourCampaignConversion = (tourIds, conversionAction, conversionData = {}) => {
    if (!privacyManager.canTrackMarketing() || !tourIds || tourIds.length === 0) {
        return;
    }

    const crossTourData = {
        ...conversionData,
        campaign_tour_count: tourIds.length,
        campaign_tours: tourIds.join(','),
        campaign_categories: tourIds.map(id => getTourCategory(id)).join(','),
        campaign_locations: tourIds.map(id => getTourLocation(id)).join(','),

        // Cross-tour metrics
        tour_diversity_score: calculateTourDiversityScore(tourIds),
        campaign_coverage: calculateCampaignCoverage(tourIds),

        // Customer fit
        customer_tour_match: calculateCustomerTourMatch(tourIds),

        // Attribution
        ...attributionService.getAttributionForAnalytics()
    };

    trackCustomGoogleAdsConversion(`cross_tour_${conversionAction}`, crossTourData);
};

// Helper functions

const getSessionTourViews = () => {
    try {
        const interactions = sessionStorage.getItem('user_interactions');
        const parsedInteractions = interactions ? JSON.parse(interactions) : [];
        return parsedInteractions.filter(i => i.type === 'tour_view').length;
    } catch (error) {
        return 0;
    }
};

const calculateCampaignPerformanceTier = (campaignData) => {
    const ctr = campaignData.click_through_rate || 0;
    const conversionRate = campaignData.conversion_rate || 0;

    if (ctr > 0.05 && conversionRate > 0.03) return 'high';
    if (ctr > 0.02 && conversionRate > 0.015) return 'medium';
    return 'low';
};

const calculateValuePerSegment = (value, segment) => {
    const segmentMultiplier = getSegmentValueMultiplier(segment);
    return Math.round((value || 0) * segmentMultiplier);
};

const calculateSeasonalFactor = () => {
    const month = new Date().getMonth();
    // Spring (March-May) and Fall (September-November) are peak seasons for Kyoto
    if ([2, 3, 4, 8, 9, 10].includes(month)) return 'peak';
    if ([5, 6, 7].includes(month)) return 'summer';
    return 'winter';
};

const calculateTourDiversityScore = (tourIds) => {
    const categories = new Set(tourIds.map(id => getTourCategory(id)));
    const locations = new Set(tourIds.map(id => getTourLocation(id)));
    return Math.round(((categories.size + locations.size) / (tourIds.length * 2)) * 100);
};

const calculateCampaignCoverage = (tourIds) => {
    const totalTours = 4; // Total number of tours available
    return Math.round((tourIds.length / totalTours) * 100);
};

const calculateCustomerTourMatch = (tourIds) => {
    const customerSegmentation = getCustomerSegmentation();
    const tourAffinities = customerSegmentation.tour_affinity;

    let totalMatch = 0;
    tourIds.forEach(tourId => {
        totalMatch += tourAffinities[tourId] || 0;
    });

    return Math.round(totalMatch / tourIds.length);
};