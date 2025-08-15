// Tour performance analytics and data management
// Handles storage and retrieval of tour performance metrics

// Tour performance metrics storage
const TOUR_PERFORMANCE_KEY = 'tour_performance_data';

/**
 * Store tour performance data
 * @param {string} tourId - Tour identifier
 * @param {string} action - Action type
 * @param {Object} data - Performance data
 */
export const storeTourPerformanceData = (tourId, action, data) => {
    try {
        const performanceData = getTourPerformanceData();
        const key = `${tourId}_${action}_${Date.now()}`;
        performanceData[key] = data;

        // Keep only last 100 entries to prevent storage bloat
        const entries = Object.entries(performanceData);
        if (entries.length > 100) {
            const recentEntries = entries.slice(-100);
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
 * @returns {Object} Tour performance data
 */
export const getTourPerformanceData = () => {
    try {
        const data = sessionStorage.getItem(TOUR_PERFORMANCE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

/**
 * Get tour performance analytics for reporting
 * @param {string} tourId - Optional tour ID filter
 * @returns {Object} Tour performance data
 */
export const getTourPerformanceAnalytics = (tourId = null) => {
    const performanceData = getTourPerformanceData();

    if (tourId) {
        const tourData = Object.entries(performanceData)
            .filter(([key]) => key.startsWith(tourId))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
        return tourData;
    }

    return performanceData;
};

/**
 * Clear tour performance data (for privacy compliance)
 */
export const clearTourPerformanceData = () => {
    try {
        sessionStorage.removeItem(TOUR_PERFORMANCE_KEY);
        sessionStorage.removeItem('user_interactions');
    } catch (error) {
        console.warn('Error clearing tour performance data:', error);
    }
};

/**
 * Get aggregated performance metrics for a tour
 * @param {string} tourId - Tour identifier
 * @returns {Object} Aggregated metrics
 */
export const getAggregatedTourMetrics = (tourId) => {
    const tourData = getTourPerformanceAnalytics(tourId);
    const entries = Object.values(tourData);

    if (entries.length === 0) {
        return {
            total_views: 0,
            total_engagement_time: 0,
            average_scroll_depth: 0,
            total_cta_clicks: 0,
            conversion_events: 0
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
    metrics.average_engagement_time = metrics.total_engagement_time / entries.length;
    metrics.average_scroll_depth = metrics.total_scroll_depth / entries.length;
    metrics.conversion_rate = entries.length > 0 ? metrics.conversion_events / entries.length : 0;

    return metrics;
};

/**
 * Get performance comparison between tours
 * @returns {Object} Performance comparison data
 */
export const getTourPerformanceComparison = () => {
    const allTours = ['gion-tour', 'morning-tour', 'night-tour', 'uji-tour'];
    const comparison = {};

    allTours.forEach(tourId => {
        comparison[tourId] = getAggregatedTourMetrics(tourId);
    });

    return comparison;
};