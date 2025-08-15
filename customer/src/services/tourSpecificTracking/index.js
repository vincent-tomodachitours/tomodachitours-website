// Main tour-specific tracking service - exports all functionality
// This is the main entry point for tour-specific conversion tracking

// Import statements first
import {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion
} from './campaignAnalytics.js';

import {
    getTourPerformanceAnalytics,
    clearTourPerformanceData
} from './performanceAnalytics.js';

import { CUSTOMER_SEGMENTS } from './customerSegmentation.js';

// Export statements
export {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion
} from './campaignAnalytics.js';

export {
    getTourPerformanceAnalytics,
    clearTourPerformanceData
} from './performanceAnalytics.js';

export {
    CUSTOMER_SEGMENTS
} from './customerSegmentation.js';

export {
    TOUR_SPECIFIC_CONVERSION_LABELS
} from './conversionLabels.js';

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