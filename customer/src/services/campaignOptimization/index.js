// Campaign Optimization Service - Main Entry Point
// Coordinates all campaign optimization features

import ConversionValueOptimizer from './conversionValueOptimizer.js';
import AudienceInsightsGenerator from './audienceInsightsGenerator.js';
import SeasonalPerformanceTracker from './seasonalPerformanceTracker.js';
import BidRecommendationEngine from './bidRecommendationEngine.js';
import performanceMonitor from '../performanceMonitor.js';

class CampaignOptimizer {
    constructor() {
        this.conversionOptimizer = new ConversionValueOptimizer();
        this.audienceInsights = new AudienceInsightsGenerator();
        this.seasonalTracker = new SeasonalPerformanceTracker();
        this.bidEngine = new BidRecommendationEngine();

        // Shared optimization history
        this.optimizationHistory = new Map();
    }

    /**
     * Implement conversion value optimization tracking
     * @param {Object} campaignData - Campaign performance data
     * @returns {Promise<Object>} Conversion value optimization insights
     */
    async optimizeConversionValue(campaignData) {
        try {
            const optimization = await this.conversionOptimizer.optimize(campaignData);

            // Store in shared history
            this.optimizationHistory.set(campaignData.campaignId, {
                ...optimization,
                type: 'conversion_value',
                timestamp: new Date().toISOString()
            });

            return optimization;

        } catch (error) {
            performanceMonitor.handleError('CONVERSION_VALUE_OPTIMIZATION_ERROR', {
                campaignId: campaignData.campaignId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Create audience insights for campaign targeting improvements
     * @param {Object} campaignData - Campaign data with audience information
     * @returns {Promise<Object>} Audience insights and recommendations
     */
    async generateAudienceInsights(campaignData) {
        try {
            const insights = await this.audienceInsights.generateInsights(campaignData);

            // Store in shared history
            this.optimizationHistory.set(`${campaignData.campaignId}_audience`, {
                ...insights,
                type: 'audience_insights',
                timestamp: new Date().toISOString()
            });

            return insights;

        } catch (error) {
            performanceMonitor.handleError('AUDIENCE_INSIGHTS_ERROR', {
                campaignId: campaignData.campaignId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Add seasonal performance tracking for tour bookings
     * @param {Object} options - Tracking options
     * @returns {Promise<Object>} Seasonal performance analysis
     */
    async trackSeasonalPerformance(options = {}) {
        try {
            const seasonalAnalysis = await this.seasonalTracker.trackPerformance(options);

            // Store in shared history
            this.optimizationHistory.set('seasonal_analysis', {
                ...seasonalAnalysis,
                type: 'seasonal_tracking',
                timestamp: new Date().toISOString()
            });

            return seasonalAnalysis;

        } catch (error) {
            performanceMonitor.handleError('SEASONAL_TRACKING_ERROR', {
                error: error.message,
                options
            });
            throw error;
        }
    }

    /**
     * Implement automated bid adjustment recommendations based on performance data
     * @param {Object} campaignData - Campaign performance data
     * @returns {Promise<Object>} Bid adjustment recommendations
     */
    async generateBidRecommendations(campaignData) {
        try {
            const recommendations = await this.bidEngine.generateRecommendations(campaignData);

            // Store in shared history
            this.optimizationHistory.set(`${campaignData.campaignId}_bids`, {
                ...recommendations,
                type: 'bid_recommendations',
                timestamp: new Date().toISOString()
            });

            return recommendations;

        } catch (error) {
            performanceMonitor.handleError('BID_RECOMMENDATIONS_ERROR', {
                campaignId: campaignData.campaignId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get optimization history for a campaign
     * @param {string} campaignId - Campaign ID
     * @returns {Array} Optimization history
     */
    getOptimizationHistory(campaignId) {
        const history = [];
        for (const [key, value] of this.optimizationHistory.entries()) {
            if (key.includes(campaignId)) {
                history.push(value);
            }
        }
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Clear optimization history
     * @param {string} campaignId - Optional campaign ID to clear specific history
     */
    clearHistory(campaignId = null) {
        if (campaignId) {
            const keysToDelete = [];
            for (const key of this.optimizationHistory.keys()) {
                if (key.includes(campaignId)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.optimizationHistory.delete(key));
        } else {
            this.optimizationHistory.clear();
        }
    }

    /**
     * Get comprehensive optimization report for a campaign
     * @param {string} campaignId - Campaign ID
     * @returns {Object} Comprehensive optimization report
     */
    async getOptimizationReport(campaignId) {
        const history = this.getOptimizationHistory(campaignId);

        return {
            campaignId,
            lastOptimized: history.length > 0 ? history[0].timestamp : null,
            optimizationCount: history.length,
            optimizationTypes: [...new Set(history.map(h => h.type))],
            history: history.slice(0, 10), // Last 10 optimizations
            summary: this.generateOptimizationSummary(history)
        };
    }

    /**
     * Generate optimization summary from history
     * @param {Array} history - Optimization history
     * @returns {Object} Optimization summary
     */
    generateOptimizationSummary(history) {
        if (history.length === 0) {
            return { message: 'No optimization history available' };
        }

        const summary = {
            totalOptimizations: history.length,
            conversionOptimizations: history.filter(h => h.type === 'conversion_value').length,
            audienceOptimizations: history.filter(h => h.type === 'audience_insights').length,
            seasonalOptimizations: history.filter(h => h.type === 'seasonal_tracking').length,
            bidOptimizations: history.filter(h => h.type === 'bid_recommendations').length,
            lastWeekOptimizations: history.filter(h => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(h.timestamp) > weekAgo;
            }).length
        };

        return summary;
    }
}

// Create singleton instance
const campaignOptimizer = new CampaignOptimizer();

export default campaignOptimizer;