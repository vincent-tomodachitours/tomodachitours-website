/**
 * Tour performance analytics and data management
 * Handles storage and retrieval of tour performance metrics
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PerformanceDataEntry {
    page_views?: number;
    engagement_time?: number;
    scroll_depth?: number;
    cta_clicks?: number;
    conversion_timestamp?: number;
    [key: string]: any;
}

interface AggregatedMetrics {
    total_views: number;
    total_engagement_time: number;
    average_scroll_depth: number;
    total_cta_clicks: number;
    conversion_events: number;
    average_engagement_time: number;
    conversion_rate: number;
}

type TourPerformanceData = Record<string, PerformanceDataEntry>;
type TourPerformanceComparison = Record<string, AggregatedMetrics>;

// ============================================================================
// CONSTANTS
// ============================================================================

// Tour performance metrics storage
const TOUR_PERFORMANCE_KEY = 'tour_performance_data';
const MAX_ENTRIES = 100;

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Store tour performance data
 * @param tourId - Tour identifier
 * @param action - Action type
 * @param data - Performance data
 */
export const storeTourPerformanceData = (
    tourId: string,
    action: string,
    data: PerformanceDataEntry
): void => {
    try {
        if (typeof sessionStorage === 'undefined') {
            console.warn('sessionStorage not available, cannot store tour performance data');
            return;
        }

        const performanceData = getTourPerformanceData();
        const key = `${tourId}_${action}_${Date.now()}`;
        performanceData[key] = data;

        // Keep only last 100 entries to prevent storage bloat
        const entries = Object.entries(performanceData);
        if (entries.length > MAX_ENTRIES) {
            const recentEntries = entries.slice(-MAX_ENTRIES);
            const cleanedData = Object.fromEntries(recentEntries);
            sessionStorage.setItem(TOUR_PERFORMANCE_KEY, JSON.stringify(cleanedData));
        } else {
            sessionStorage.setItem(TOUR_PERFORMANCE_KEY, JSON.stringify(performanceData));
        }
    } catch (error) {
        console.warn('Error storing tour performance data:', error);
    }
};

/**
 * Get tour performance data from storage
 * @returns Tour performance data
 */
export const getTourPerformanceData = (): TourPerformanceData => {
    try {
        if (typeof sessionStorage === 'undefined') {
            return {};
        }

        const data = sessionStorage.getItem(TOUR_PERFORMANCE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get tour performance analytics for reporting
 * @param tourId - Optional tour ID filter
 * @returns Tour performance data
 */
export const getTourPerformanceAnalytics = (tourId: string | null = null): TourPerformanceData => {
    const performanceData = getTourPerformanceData();

    if (tourId) {
        const tourData = Object.entries(performanceData)
            .filter(([key]) => key.startsWith(tourId))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {} as TourPerformanceData);
        return tourData;
    }

    return performanceData;
};

/**
 * Clear tour performance data (for privacy compliance)
 */
export const clearTourPerformanceData = (): void => {
    try {
        if (typeof sessionStorage === 'undefined') {
            return;
        }

        sessionStorage.removeItem(TOUR_PERFORMANCE_KEY);
        sessionStorage.removeItem('user_interactions');
    } catch (error) {
        console.warn('Error clearing tour performance data:', error);
    }
};

/**
 * Get aggregated performance metrics for a tour
 * @param tourId - Tour identifier
 * @returns Aggregated metrics
 */
export const getAggregatedTourMetrics = (tourId: string): AggregatedMetrics => {
    const tourData = getTourPerformanceAnalytics(tourId);
    const entries = Object.values(tourData);

    if (entries.length === 0) {
        return {
            total_views: 0,
            total_engagement_time: 0,
            average_scroll_depth: 0,
            total_cta_clicks: 0,
            conversion_events: 0,
            average_engagement_time: 0,
            conversion_rate: 0
        };
    }

    const metrics = entries.reduce((acc, entry) => {
        acc.total_views += entry.page_views || 0;
        acc.total_engagement_time += entry.engagement_time || 0;
        acc.total_scroll_depth += entry.scroll_depth || 0;
        acc.total_cta_clicks += entry.cta_clicks || 0;
        if (entry.conversion_timestamp) {
            acc.conversion_events += 1;
        }
        return acc;
    }, {
        total_views: 0,
        total_engagement_time: 0,
        total_scroll_depth: 0,
        total_cta_clicks: 0,
        conversion_events: 0
    });

    // Calculate averages
    const averageEngagementTime = entries.length > 0 ? metrics.total_engagement_time / entries.length : 0;
    const averageScrollDepth = entries.length > 0 ? metrics.total_scroll_depth / entries.length : 0;
    const conversionRate = entries.length > 0 ? metrics.conversion_events / entries.length : 0;

    return {
        total_views: entries.length,
        total_engagement_time: metrics.total_engagement_time,
        total_cta_clicks: metrics.total_cta_clicks,
        conversion_events: metrics.conversion_events,
        average_engagement_time: averageEngagementTime,
        average_scroll_depth: averageScrollDepth,
        conversion_rate: conversionRate
    };
};

/**
 * Get performance comparison between tours
 * @returns Performance comparison data
 */
export const getTourPerformanceComparison = (): TourPerformanceComparison => {
    const allTours = ['gion-tour', 'morning-tour', 'night-tour', 'uji-tour'];
    const comparison: TourPerformanceComparison = {};

    allTours.forEach(tourId => {
        comparison[tourId] = getAggregatedTourMetrics(tourId);
    });

    return comparison;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    PerformanceDataEntry,
    AggregatedMetrics,
    TourPerformanceData,
    TourPerformanceComparison
};