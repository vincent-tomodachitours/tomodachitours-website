/**
 * Main tour-specific tracking service - exports all functionality
 * This is the main entry point for tour-specific conversion tracking
 */

// ============================================================================
// RE-EXPORTS FROM CAMPAIGN ANALYTICS
// ============================================================================

export {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion,
    type BaseConversionData,
    type CampaignData,
    type PerformanceData,
    type EnhancedConversionData,
    type PerformanceMetrics,
    type SegmentConversionData,
    type CrossTourData,
    type PerformanceTier,
    type SeasonalFactor
} from './campaignAnalytics';

// ============================================================================
// RE-EXPORTS FROM PERFORMANCE ANALYTICS
// ============================================================================

export {
    getTourPerformanceAnalytics,
    clearTourPerformanceData,
    storeTourPerformanceData,
    getAggregatedTourMetrics,
    getTourPerformanceComparison,
    type PerformanceDataEntry,
    type AggregatedMetrics,
    type TourPerformanceData,
    type TourPerformanceComparison
} from './performanceAnalytics';

// ============================================================================
// RE-EXPORTS FROM CUSTOMER SEGMENTATION
// ============================================================================

export {
    CUSTOMER_SEGMENTS,
    getCustomerSegmentation,
    calculateSegmentScore,
    calculateTourAffinity,
    getSegmentValueMultiplier,
    getSegmentConversionProbability,
    type UserInteraction,
    type CustomerSegmentationResult,
    type TourAffinityScores
} from './customerSegmentation';

// ============================================================================
// RE-EXPORTS FROM CONVERSION LABELS
// ============================================================================

export {
    TOUR_SPECIFIC_CONVERSION_LABELS,
    getTourSpecificLabel,
    hasTourSpecificLabels,
    getAvailableTourIds,
    getTourConversionActions,
    type ConversionAction,
    type TourConversionLabels,
    type TourId
} from './conversionLabels';

// ============================================================================
// RE-EXPORTS FROM CONVERSION TRACKING
// ============================================================================

export {
    trackTourSpecificConversion as trackTourSpecificConversionAlt,
    trackTourPerformance as trackTourPerformanceAlt,
    trackSegmentSpecificConversion as trackSegmentSpecificConversionAlt,
    trackCrossTourCampaignConversion as trackCrossTourCampaignConversionAlt
} from './conversionTracking';

// ============================================================================
// MAIN SERVICE OBJECT
// ============================================================================

import {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion
} from './campaignAnalytics';

import {
    getTourPerformanceAnalytics,
    clearTourPerformanceData
} from './performanceAnalytics';

import { CUSTOMER_SEGMENTS } from './customerSegmentation';

const tourSpecificTracking = {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion,
    getTourPerformanceAnalytics,
    clearTourPerformanceData,
    CUSTOMER_SEGMENTS
};

export default tourSpecificTracking;