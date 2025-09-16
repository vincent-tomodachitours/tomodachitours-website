// Performance Dashboard Service - Main Entry Point
// Aggregates GA4 and Google Ads data for campaign performance analysis

import MetricsCollector from './metricsCollector.js';
import AttributionAnalyzer from './attributionAnalyzer.js';
import InsightsGenerator from './insightsGenerator.js';
import CacheManager from './cacheManager.js';
import performanceMonitor from '../performanceMonitor';

class PerformanceDashboard {
    constructor() {
        this.metricsCollector = new MetricsCollector();
        this.attributionAnalyzer = new AttributionAnalyzer();
        this.insightsGenerator = new InsightsGenerator();
        this.cacheManager = new CacheManager();
    }

    /**
     * Get campaign performance metrics for specified date range
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Campaign performance data
     */
    async getCampaignMetrics(options = {}) {
        const {
            dateRange = 'last30days',
            campaigns = [],
            sources = [],
            includeGA4 = true,
            includeGoogleAds = true,
            includeTourBreakdown = true
        } = options;

        try {
            // Check cache first
            const cacheKey = `campaign_metrics_${JSON.stringify(options)}`;
            const cachedData = this.cacheManager.getCachedData(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            const dateRangeObj = this.parseDateRange(dateRange);
            const metrics = {
                dateRange: dateRangeObj,
                summary: {},
                campaigns: [],
                sources: [],
                tours: [],
                attribution: {},
                insights: []
            };

            // Collect GA4 data if requested
            if (includeGA4) {
                const ga4Data = await this.metricsCollector.collectGA4Metrics(dateRangeObj, campaigns, sources);
                metrics.ga4 = ga4Data;
                this.mergeMetricsData(metrics.summary, ga4Data.summary);
            }

            // Collect Google Ads data if requested
            if (includeGoogleAds) {
                const googleAdsData = await this.metricsCollector.collectGoogleAdsMetrics(dateRangeObj, campaigns);
                metrics.googleAds = googleAdsData;
                this.mergeMetricsData(metrics.summary, googleAdsData.summary);
            }

            // Calculate ROI and ROAS
            metrics.summary.roi = this.calculateROI(metrics.summary);
            metrics.summary.roas = this.calculateROAS(metrics.summary);

            // Get tour-specific breakdown
            if (includeTourBreakdown) {
                metrics.tours = await this.metricsCollector.getTourPerformanceBreakdown(dateRangeObj);
            }

            // Get attribution analysis
            metrics.attribution = await this.attributionAnalyzer.getAttributionAnalysis(dateRangeObj);

            // Generate automated insights
            metrics.insights = this.insightsGenerator.generateAutomatedInsights(metrics);

            // Cache the results
            this.cacheManager.setCachedData(cacheKey, metrics);

            return metrics;

        } catch (error) {
            performanceMonitor.handleError('DASHBOARD_ERROR', {
                action: 'getCampaignMetrics',
                error: error.message,
                options
            });
            throw error;
        }
    }

    /**
     * Calculate Return on Investment (ROI)
     * @param {Object} metrics - Metrics data containing revenue and cost
     * @returns {number} ROI percentage
     */
    calculateROI(metrics) {
        const revenue = metrics.revenue || metrics.conversionValue || 0;
        const cost = metrics.cost || metrics.adSpend || 0;

        if (cost === 0) return 0;

        const roi = ((revenue - cost) / cost) * 100;
        return Math.round(roi * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate Return on Ad Spend (ROAS)
     * @param {Object} metrics - Metrics data containing revenue and cost
     * @returns {number} ROAS ratio
     */
    calculateROAS(metrics) {
        const revenue = metrics.revenue || metrics.conversionValue || 0;
        const cost = metrics.cost || metrics.adSpend || 0;

        if (cost === 0) return 0;

        const roas = revenue / cost;
        return Math.round(roas * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Parse date range string or object into standardized format
     * @param {string|Object} dateRange - Date range specification
     * @returns {Object} Parsed date range object
     */
    parseDateRange(dateRange) {
        const defaultDateRanges = {
            today: { days: 1 },
            yesterday: { days: 1, offset: 1 },
            last7days: { days: 7 },
            last30days: { days: 30 },
            last90days: { days: 90 },
            thisMonth: { type: 'month', current: true },
            lastMonth: { type: 'month', current: false }
        };

        if (typeof dateRange === 'string' && defaultDateRanges[dateRange]) {
            const range = defaultDateRanges[dateRange];
            const endDate = new Date();

            if (range.offset) {
                endDate.setDate(endDate.getDate() - range.offset);
            }

            const startDate = new Date(endDate.getTime());
            startDate.setDate(startDate.getDate() - (range.days - 1));

            return {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                days: range.days
            };
        }

        if (typeof dateRange === 'object' && dateRange.startDate && dateRange.endDate) {
            return dateRange;
        }

        // Default to last 30 days
        return this.parseDateRange('last30days');
    }

    /**
     * Merge metrics data from different sources
     * @param {Object} target - Target metrics object
     * @param {Object} source - Source metrics object
     */
    mergeMetricsData(target, source) {
        Object.keys(source).forEach(key => {
            if (typeof source[key] === 'number') {
                target[key] = (target[key] || 0) + source[key];
            } else if (!target[key]) {
                target[key] = source[key];
            }
        });
    }

    /**
     * Get conversion attribution report
     * @param {string} conversionId - Conversion ID to analyze
     * @returns {Promise<Object>} Attribution report for specific conversion
     */
    async getConversionAttribution(conversionId) {
        return this.attributionAnalyzer.getConversionAttribution(conversionId);
    }

    /**
     * Calculate tour profitability score
     * @param {Object} metrics - Tour metrics
     * @param {number} avgPrice - Average tour price
     * @returns {number} Profitability score (0-100)
     */
    calculateTourProfitability(metrics, avgPrice) {
        return this.metricsCollector.calculateTourProfitability(metrics, avgPrice);
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cacheManager.clearCache();
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCachedData(key, data) {
        this.cacheManager.setCachedData(key, data);
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedData(key) {
        return this.cacheManager.getCachedData(key);
    }
}

// Create singleton instance
const performanceDashboard = new PerformanceDashboard();

export default performanceDashboard;