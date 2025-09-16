// Main tour-specific tracking service - exports all functionality
// This is the main entry point for tour-specific conversion tracking

// Import statements first
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

// Export statements
export {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion
} from './campaignAnalytics';

export {
    getTourPerformanceAnalytics,
    clearTourPerformanceData
} from './performanceAnalytics';

export {
    CUSTOMER_SEGMENTS
} from './customerSegmentation';

export {
    TOUR_SPECIFIC_CONVERSION_LABELS
} from './conversionLabels';

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