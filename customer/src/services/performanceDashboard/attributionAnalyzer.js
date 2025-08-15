// Attribution Analyzer - Handles attribution analysis and conversion path tracking
// Analyzes first-touch, last-touch, and multi-touch attribution

import attributionService from '../attributionService.js';

class AttributionAnalyzer {
    constructor() {
        // Attribution analysis configuration
        this.attributionModels = {
            firstTouch: 'first_touch',
            lastTouch: 'last_touch',
            linear: 'linear',
            timeDecay: 'time_decay',
            positionBased: 'position_based'
        };
    }

    /**
     * Get attribution analysis for the date range
     * @param {Object} dateRange - Date range object
     * @returns {Promise<Object>} Attribution analysis data
     */
    async getAttributionAnalysis(dateRange) {
        try {
            const attributionData = this.getStoredAttributionData(dateRange);

            return {
                firstTouch: this.analyzeFirstTouchAttribution(attributionData),
                lastTouch: this.analyzeLastTouchAttribution(attributionData),
                multiTouch: this.analyzeMultiTouchAttribution(attributionData),
                crossDevice: this.analyzeCrossDeviceAttribution(attributionData),
                pathAnalysis: this.analyzeConversionPaths(attributionData)
            };

        } catch (error) {
            console.error('Error getting attribution analysis:', error);
            return {};
        }
    }

    /**
     * Analyze first-touch attribution
     * @param {Array} attributionData - Attribution data
     * @returns {Object} First-touch attribution analysis
     */
    analyzeFirstTouchAttribution(attributionData) {
        const firstTouchData = {};

        attributionData.forEach(conversion => {
            const firstTouch = conversion.attribution_chain?.[0] || conversion;
            const source = firstTouch.source || 'direct';

            if (!firstTouchData[source]) {
                firstTouchData[source] = {
                    conversions: 0,
                    revenue: 0,
                    cost: 0
                };
            }

            firstTouchData[source].conversions += 1;
            firstTouchData[source].revenue += conversion.revenue || 0;
            firstTouchData[source].cost += conversion.cost || 0;
        });

        // Calculate metrics for each source
        Object.keys(firstTouchData).forEach(source => {
            const data = firstTouchData[source];
            data.roi = this.calculateROI(data);
            data.roas = this.calculateROAS(data);
            data.avgOrderValue = data.conversions > 0 ? data.revenue / data.conversions : 0;
        });

        return firstTouchData;
    }

    /**
     * Analyze last-touch attribution
     * @param {Array} attributionData - Attribution data
     * @returns {Object} Last-touch attribution analysis
     */
    analyzeLastTouchAttribution(attributionData) {
        const lastTouchData = {};

        attributionData.forEach(conversion => {
            const chain = conversion.attribution_chain || [conversion];
            const lastTouch = chain[chain.length - 1] || conversion;
            const source = lastTouch.source || 'direct';

            if (!lastTouchData[source]) {
                lastTouchData[source] = {
                    conversions: 0,
                    revenue: 0,
                    cost: 0
                };
            }

            lastTouchData[source].conversions += 1;
            lastTouchData[source].revenue += conversion.revenue || 0;
            lastTouchData[source].cost += conversion.cost || 0;
        });

        // Calculate metrics for each source
        Object.keys(lastTouchData).forEach(source => {
            const data = lastTouchData[source];
            data.roi = this.calculateROI(data);
            data.roas = this.calculateROAS(data);
            data.avgOrderValue = data.conversions > 0 ? data.revenue / data.conversions : 0;
        });

        return lastTouchData;
    }

    /**
     * Analyze multi-touch attribution
     * @param {Array} attributionData - Attribution data
     * @returns {Object} Multi-touch attribution analysis
     */
    analyzeMultiTouchAttribution(attributionData) {
        const multiTouchData = {};

        attributionData.forEach(conversion => {
            const chain = conversion.attribution_chain || [conversion];
            const revenue = conversion.revenue || 0;
            const cost = conversion.cost || 0;

            // Distribute credit across all touchpoints
            const creditPerTouchpoint = {
                revenue: revenue / chain.length,
                cost: cost / chain.length,
                conversions: 1 / chain.length
            };

            chain.forEach(touchpoint => {
                const source = touchpoint.source || 'direct';

                if (!multiTouchData[source]) {
                    multiTouchData[source] = {
                        conversions: 0,
                        revenue: 0,
                        cost: 0
                    };
                }

                multiTouchData[source].conversions += creditPerTouchpoint.conversions;
                multiTouchData[source].revenue += creditPerTouchpoint.revenue;
                multiTouchData[source].cost += creditPerTouchpoint.cost;
            });
        });

        // Calculate metrics for each source
        Object.keys(multiTouchData).forEach(source => {
            const data = multiTouchData[source];
            data.roi = this.calculateROI(data);
            data.roas = this.calculateROAS(data);
            data.avgOrderValue = data.conversions > 0 ? data.revenue / data.conversions : 0;
        });

        return multiTouchData;
    }

    /**
     * Analyze cross-device attribution
     * @param {Array} attributionData - Attribution data
     * @returns {Object} Cross-device attribution analysis
     */
    analyzeCrossDeviceAttribution(attributionData) {
        const crossDeviceConversions = attributionData.filter(
            conversion => conversion.cross_device_available || conversion.device_switches
        );

        return {
            totalConversions: attributionData.length,
            crossDeviceConversions: crossDeviceConversions.length,
            crossDeviceRate: attributionData.length > 0 ?
                (crossDeviceConversions.length / attributionData.length) * 100 : 0,
            avgDeviceSwitches: crossDeviceConversions.length > 0 ?
                crossDeviceConversions.reduce((sum, conv) => sum + (conv.device_switches || 0), 0) / crossDeviceConversions.length : 0
        };
    }

    /**
     * Analyze conversion paths
     * @param {Array} attributionData - Attribution data
     * @returns {Object} Conversion path analysis
     */
    analyzeConversionPaths(attributionData) {
        const pathAnalysis = {
            pathLengths: {},
            commonPaths: {},
            topConvertingPaths: []
        };

        attributionData.forEach(conversion => {
            const chain = conversion.attribution_chain || [conversion];
            const pathLength = chain.length;
            const pathString = chain.map(t => t.source || 'direct').join(' > ');

            // Track path lengths
            pathAnalysis.pathLengths[pathLength] = (pathAnalysis.pathLengths[pathLength] || 0) + 1;

            // Track common paths
            if (!pathAnalysis.commonPaths[pathString]) {
                pathAnalysis.commonPaths[pathString] = {
                    count: 0,
                    revenue: 0,
                    avgOrderValue: 0
                };
            }

            pathAnalysis.commonPaths[pathString].count += 1;
            pathAnalysis.commonPaths[pathString].revenue += conversion.revenue || 0;
        });

        // Calculate average order value for each path
        Object.keys(pathAnalysis.commonPaths).forEach(path => {
            const pathData = pathAnalysis.commonPaths[path];
            pathData.avgOrderValue = pathData.count > 0 ? pathData.revenue / pathData.count : 0;
        });

        // Get top converting paths
        pathAnalysis.topConvertingPaths = Object.entries(pathAnalysis.commonPaths)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(([path, data]) => ({ path, ...data }));

        return pathAnalysis;
    }

    /**
     * Get conversion attribution report
     * @param {string} conversionId - Conversion ID to analyze
     * @returns {Promise<Object>} Attribution report for specific conversion
     */
    async getConversionAttribution(conversionId) {
        try {
            // Get attribution data for specific conversion
            const attributionData = attributionService.getEnhancedAttributionForAnalytics();

            return {
                conversionId,
                attribution: attributionData || {},
                touchpoints: (attributionData && attributionData.attribution_chain) || [],
                crossDevice: (attributionData && attributionData.cross_device_available) || false,
                gclid: (attributionData && (attributionData.gclid || attributionData.stored_gclid)) || null,
                firstTouch: {
                    source: attributionData && attributionData.first_source,
                    medium: attributionData && attributionData.first_medium,
                    campaign: attributionData && attributionData.first_campaign
                },
                lastTouch: {
                    source: attributionData && attributionData.source,
                    medium: attributionData && attributionData.medium,
                    campaign: attributionData && attributionData.campaign
                }
            };

        } catch (error) {
            console.error('Error getting conversion attribution:', error);
            return null;
        }
    }

    /**
     * Calculate ROI for attribution data
     * @param {Object} data - Attribution data
     * @returns {number} ROI percentage
     */
    calculateROI(data) {
        const revenue = data.revenue || 0;
        const cost = data.cost || 0;

        if (cost === 0) return 0;

        const roi = ((revenue - cost) / cost) * 100;
        return Math.round(roi * 100) / 100;
    }

    /**
     * Calculate ROAS for attribution data
     * @param {Object} data - Attribution data
     * @returns {number} ROAS ratio
     */
    calculateROAS(data) {
        const revenue = data.revenue || 0;
        const cost = data.cost || 0;

        if (cost === 0) return 0;

        const roas = revenue / cost;
        return Math.round(roas * 100) / 100;
    }

    /**
     * Get stored attribution data (placeholder)
     * @param {Object} dateRange - Date range object
     * @returns {Array} Attribution data
     */
    getStoredAttributionData(dateRange) {
        // Placeholder - would fetch attribution data
        return Array.from({ length: 50 }, (_, i) => ({
            id: `conversion_${i}`,
            revenue: Math.floor(Math.random() * 20000) + 5000,
            cost: Math.floor(Math.random() * 5000) + 1000,
            attribution_chain: [
                { source: 'google', medium: 'cpc', timestamp: Date.now() - Math.random() * 86400000 },
                { source: 'direct', medium: 'none', timestamp: Date.now() - Math.random() * 3600000 }
            ],
            cross_device_available: Math.random() > 0.7
        }));
    }
}

export default AttributionAnalyzer;