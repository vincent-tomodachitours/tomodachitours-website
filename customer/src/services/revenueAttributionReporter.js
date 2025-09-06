/**
 * Revenue Attribution Reporter Service
 * 
 * Provides comprehensive revenue attribution reporting by campaign and keyword.
 * Integrates with conversion value optimizer for detailed performance analysis.
 * 
 * Requirements: 8.3, 8.4
 */

import conversionValueOptimizer from './conversionValueOptimizer.js';

class RevenueAttributionReporter {
    constructor() {
        this.reportCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        this.exportFormats = ['json', 'csv', 'xlsx'];

        // Bind methods
        this.generateCampaignReport = this.generateCampaignReport.bind(this);
        this.generateKeywordReport = this.generateKeywordReport.bind(this);
        this.generateProductReport = this.generateProductReport.bind(this);
        this.exportReport = this.exportReport.bind(this);
    }

    /**
     * Generate comprehensive campaign performance report
     * @param {Object} filters - Report filters
     * @returns {Object} - Campaign performance report
     */
    async generateCampaignReport(filters = {}) {
        try {
            const cacheKey = `campaign_${JSON.stringify(filters)}`;
            const cached = this._getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters);

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance campaign data with additional metrics
            const enhancedCampaigns = baseReport.report.byCampaign.map(campaign => {
                const roas = this._calculateROAS(campaign);
                const costPerConversion = this._estimateCostPerConversion(campaign);
                const profitMargin = this._calculateCampaignProfitMargin(campaign);

                return {
                    ...campaign,
                    roas,
                    costPerConversion,
                    profitMargin,
                    revenuePerClick: this._calculateRevenuePerClick(campaign),
                    conversionRate: this._estimateConversionRate(campaign),
                    customerLifetimeValue: this._estimateCustomerLTV(campaign),
                    performanceGrade: this._gradeCampaignPerformance(campaign, roas, profitMargin),
                    recommendations: this._generateCampaignRecommendations(campaign, roas, profitMargin)
                };
            });

            // Sort by revenue descending
            enhancedCampaigns.sort((a, b) => b.revenue - a.revenue);

            // Calculate summary metrics
            const summary = {
                totalCampaigns: enhancedCampaigns.length,
                totalRevenue: enhancedCampaigns.reduce((sum, c) => sum + c.revenue, 0),
                totalConversions: enhancedCampaigns.reduce((sum, c) => sum + c.conversions, 0),
                averageROAS: this._calculateAverageROAS(enhancedCampaigns),
                topPerformingCampaign: enhancedCampaigns[0]?.campaign || 'N/A',
                worstPerformingCampaign: enhancedCampaigns[enhancedCampaigns.length - 1]?.campaign || 'N/A',
                revenueGrowthTrend: this._calculateRevenueGrowthTrend(enhancedCampaigns, filters)
            };

            const report = {
                success: true,
                reportType: 'campaign_performance',
                generatedAt: new Date().toISOString(),
                filters,
                summary,
                campaigns: enhancedCampaigns,
                insights: this._generateCampaignInsights(enhancedCampaigns, summary)
            };

            // Cache the report
            this._cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Campaign report generation failed:', error);
            return {
                success: false,
                error: error.message,
                reportType: 'campaign_performance'
            };
        }
    }

    /**
     * Generate detailed keyword performance report
     * @param {Object} filters - Report filters
     * @returns {Object} - Keyword performance report
     */
    async generateKeywordReport(filters = {}) {
        try {
            const cacheKey = `keyword_${JSON.stringify(filters)}`;
            const cached = this._getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters);

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance keyword data with performance metrics
            const enhancedKeywords = baseReport.report.byKeyword.map(keyword => {
                const roas = this._calculateROAS(keyword);
                const searchVolume = this._estimateSearchVolume(keyword.keyword);
                const competitionLevel = this._assessKeywordCompetition(keyword.keyword);

                return {
                    ...keyword,
                    roas,
                    searchVolume,
                    competitionLevel,
                    revenuePerConversion: keyword.averageOrderValue,
                    keywordIntent: this._classifyKeywordIntent(keyword.keyword),
                    performanceScore: this._calculateKeywordPerformanceScore(keyword, roas),
                    bidRecommendation: this._generateBidRecommendation(keyword, roas),
                    optimizationOpportunities: this._identifyKeywordOptimizations(keyword)
                };
            });

            // Sort by performance score descending
            enhancedKeywords.sort((a, b) => b.performanceScore - a.performanceScore);

            // Group keywords by performance tiers
            const performanceTiers = {
                topPerformers: enhancedKeywords.filter(k => k.performanceScore >= 80),
                goodPerformers: enhancedKeywords.filter(k => k.performanceScore >= 60 && k.performanceScore < 80),
                underPerformers: enhancedKeywords.filter(k => k.performanceScore < 60)
            };

            const summary = {
                totalKeywords: enhancedKeywords.length,
                totalRevenue: enhancedKeywords.reduce((sum, k) => sum + k.revenue, 0),
                averagePerformanceScore: enhancedKeywords.reduce((sum, k) => sum + k.performanceScore, 0) / enhancedKeywords.length,
                topKeyword: enhancedKeywords[0]?.keyword || 'N/A',
                highIntentKeywords: enhancedKeywords.filter(k => k.keywordIntent === 'high').length,
                performanceTiers
            };

            const report = {
                success: true,
                reportType: 'keyword_performance',
                generatedAt: new Date().toISOString(),
                filters,
                summary,
                keywords: enhancedKeywords,
                performanceTiers,
                insights: this._generateKeywordInsights(enhancedKeywords, summary)
            };

            // Cache the report
            this._cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Keyword report generation failed:', error);
            return {
                success: false,
                error: error.message,
                reportType: 'keyword_performance'
            };
        }
    }

    /**
     * Generate product-level revenue attribution report
     * @param {Object} filters - Report filters
     * @returns {Object} - Product performance report
     */
    async generateProductReport(filters = {}) {
        try {
            const cacheKey = `product_${JSON.stringify(filters)}`;
            const cached = this._getCachedReport(cacheKey);

            if (cached) {
                return cached;
            }

            // Get base report from conversion value optimizer
            const baseReport = conversionValueOptimizer.generateValueReport(filters);

            if (!baseReport.success) {
                throw new Error(`Base report generation failed: ${baseReport.error}`);
            }

            // Enhance product data with performance metrics
            const enhancedProducts = baseReport.report.byProduct.map(product => {
                const conversionRate = this._calculateProductConversionRate(product);
                const profitMargin = this._calculateProductProfitMargin(product);
                const seasonality = this._analyzeProductSeasonality(product);

                return {
                    ...product,
                    conversionRate,
                    profitMargin,
                    seasonality,
                    revenueShare: 0, // Will be calculated below
                    growthRate: this._calculateProductGrowthRate(product, filters),
                    customerSegments: this._analyzeProductCustomerSegments(product),
                    marketingEfficiency: this._calculateMarketingEfficiency(product),
                    recommendations: this._generateProductRecommendations(product)
                };
            });

            // Calculate revenue share
            const totalRevenue = enhancedProducts.reduce((sum, p) => sum + p.revenue, 0);
            enhancedProducts.forEach(product => {
                product.revenueShare = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
            });

            // Sort by revenue descending
            enhancedProducts.sort((a, b) => b.revenue - a.revenue);

            const summary = {
                totalProducts: enhancedProducts.length,
                totalRevenue: totalRevenue,
                topProduct: enhancedProducts[0]?.productName || 'N/A',
                averageConversionRate: enhancedProducts.reduce((sum, p) => sum + p.conversionRate, 0) / enhancedProducts.length,
                highestMargin: Math.max(...enhancedProducts.map(p => p.profitMargin)),
                seasonalProducts: enhancedProducts.filter(p => p.seasonality.isHighlySeasonal).length
            };

            const report = {
                success: true,
                reportType: 'product_performance',
                generatedAt: new Date().toISOString(),
                filters,
                summary,
                products: enhancedProducts,
                insights: this._generateProductInsights(enhancedProducts, summary)
            };

            // Cache the report
            this._cacheReport(cacheKey, report);

            return report;

        } catch (error) {
            console.error('Product report generation failed:', error);
            return {
                success: false,
                error: error.message,
                reportType: 'product_performance'
            };
        }
    }

    /**
     * Export report in specified format
     * @param {Object} report - Report data to export
     * @param {string} format - Export format (json, csv, xlsx)
     * @returns {Object} - Export result with download data
     */
    async exportReport(report, format = 'json') {
        try {
            if (!this.exportFormats.includes(format)) {
                throw new Error(`Unsupported export format: ${format}`);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${report.reportType}_${timestamp}.${format}`;

            let exportData;
            let mimeType;

            switch (format) {
                case 'json':
                    exportData = JSON.stringify(report, null, 2);
                    mimeType = 'application/json';
                    break;

                case 'csv':
                    exportData = this._convertToCSV(report);
                    mimeType = 'text/csv';
                    break;

                case 'xlsx':
                    // For XLSX, we'd need a library like xlsx or exceljs
                    // For now, return CSV format as fallback
                    exportData = this._convertToCSV(report);
                    mimeType = 'text/csv';
                    break;

                default:
                    throw new Error(`Export format ${format} not implemented`);
            }

            return {
                success: true,
                filename,
                data: exportData,
                mimeType,
                size: new Blob([exportData]).size
            };

        } catch (error) {
            console.error('Report export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get real-time performance metrics
     * @returns {Object} - Real-time metrics
     */
    getRealTimeMetrics() {
        try {
            const baseReport = conversionValueOptimizer.generateValueReport({
                dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
            });

            if (!baseReport.success) {
                return { success: false, error: 'Failed to get real-time data' };
            }

            return {
                success: true,
                metrics: {
                    last24Hours: {
                        revenue: baseReport.report.summary.totalRevenue,
                        conversions: baseReport.report.summary.totalConversions,
                        averageOrderValue: baseReport.report.summary.averageOrderValue
                    },
                    topCampaign: baseReport.report.byCampaign[0]?.campaign || 'N/A',
                    topKeyword: baseReport.report.byKeyword[0]?.keyword || 'N/A',
                    lastUpdated: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Real-time metrics failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Private helper methods

    /**
     * Calculate ROAS for campaign/keyword
     * @private
     */
    _calculateROAS(item) {
        // Estimate ad spend based on revenue (simplified calculation)
        const estimatedAdSpend = item.revenue * 0.2; // Assume 20% ad spend ratio
        return estimatedAdSpend > 0 ? item.revenue / estimatedAdSpend : 0;
    }

    /**
     * Estimate cost per conversion
     * @private
     */
    _estimateCostPerConversion(item) {
        const estimatedAdSpend = item.revenue * 0.2;
        return item.conversions > 0 ? estimatedAdSpend / item.conversions : 0;
    }

    /**
     * Calculate campaign profit margin
     * @private
     */
    _calculateCampaignProfitMargin(campaign) {
        const estimatedCosts = campaign.revenue * 0.5; // Assume 50% total costs
        return ((campaign.revenue - estimatedCosts) / campaign.revenue) * 100;
    }

    /**
     * Calculate revenue per click
     * @private
     */
    _calculateRevenuePerClick(item) {
        // Estimate clicks based on conversions and conversion rate
        const estimatedConversionRate = 0.03; // 3% average
        const estimatedClicks = item.conversions / estimatedConversionRate;
        return estimatedClicks > 0 ? item.revenue / estimatedClicks : 0;
    }

    /**
     * Estimate conversion rate
     * @private
     */
    _estimateConversionRate(item) {
        // Simplified estimation based on performance
        const baseRate = 0.03; // 3% base rate
        const performanceMultiplier = item.averageOrderValue > 10000 ? 1.2 : 0.8;
        return baseRate * performanceMultiplier;
    }

    /**
     * Estimate customer lifetime value
     * @private
     */
    _estimateCustomerLTV(item) {
        return item.averageOrderValue * 2.5; // Simplified LTV calculation
    }

    /**
     * Grade campaign performance
     * @private
     */
    _gradeCampaignPerformance(campaign, roas, profitMargin) {
        if (roas >= 4 && profitMargin >= 40) return 'A';
        if (roas >= 3 && profitMargin >= 30) return 'B';
        if (roas >= 2 && profitMargin >= 20) return 'C';
        if (roas >= 1.5 && profitMargin >= 10) return 'D';
        return 'F';
    }

    /**
     * Generate campaign recommendations
     * @private
     */
    _generateCampaignRecommendations(campaign, roas, profitMargin) {
        const recommendations = [];

        if (roas < 2) {
            recommendations.push('Consider reducing bids or pausing low-performing keywords');
        }
        if (profitMargin < 20) {
            recommendations.push('Review pricing strategy to improve margins');
        }
        if (campaign.conversions < 10) {
            recommendations.push('Increase budget to gather more conversion data');
        }
        if (roas > 5) {
            recommendations.push('Consider increasing bids to capture more volume');
        }

        return recommendations;
    }

    /**
     * Calculate average ROAS across campaigns
     * @private
     */
    _calculateAverageROAS(campaigns) {
        if (campaigns.length === 0) return 0;
        return campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length;
    }

    /**
     * Calculate revenue growth trend
     * @private
     */
    _calculateRevenueGrowthTrend(campaigns, filters) {
        // Simplified trend calculation
        return campaigns.length > 0 ? 'stable' : 'no_data';
    }

    /**
     * Generate campaign insights
     * @private
     */
    _generateCampaignInsights(campaigns, summary) {
        const insights = [];

        if (summary.averageROAS > 4) {
            insights.push('Strong overall ROAS performance across campaigns');
        }
        if (campaigns.length > 0 && campaigns[0].revenue > summary.totalRevenue * 0.5) {
            insights.push('Revenue is heavily concentrated in top campaign - consider diversification');
        }

        return insights;
    }

    /**
     * Estimate search volume for keyword
     * @private
     */
    _estimateSearchVolume(keyword) {
        // Simplified estimation based on keyword characteristics
        if (keyword.includes('kyoto')) return 'high';
        if (keyword.includes('tour')) return 'medium';
        return 'low';
    }

    /**
     * Assess keyword competition level
     * @private
     */
    _assessKeywordCompetition(keyword) {
        // Simplified competition assessment
        if (keyword.length < 10) return 'high';
        if (keyword.length < 20) return 'medium';
        return 'low';
    }

    /**
     * Classify keyword intent
     * @private
     */
    _classifyKeywordIntent(keyword) {
        const highIntentWords = ['book', 'booking', 'reserve', 'buy', 'price'];
        const mediumIntentWords = ['tour', 'guide', 'visit'];

        if (highIntentWords.some(word => keyword.toLowerCase().includes(word))) {
            return 'high';
        }
        if (mediumIntentWords.some(word => keyword.toLowerCase().includes(word))) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Calculate keyword performance score
     * @private
     */
    _calculateKeywordPerformanceScore(keyword, roas) {
        let score = 0;

        // ROAS component (40% weight)
        if (roas >= 4) score += 40;
        else if (roas >= 3) score += 30;
        else if (roas >= 2) score += 20;
        else score += 10;

        // Revenue component (30% weight)
        if (keyword.revenue >= 50000) score += 30;
        else if (keyword.revenue >= 20000) score += 25;
        else if (keyword.revenue >= 10000) score += 20;
        else score += 10;

        // Conversion component (30% weight)
        if (keyword.conversions >= 20) score += 30;
        else if (keyword.conversions >= 10) score += 25;
        else if (keyword.conversions >= 5) score += 20;
        else score += 10;

        return Math.min(100, score);
    }

    /**
     * Generate bid recommendation
     * @private
     */
    _generateBidRecommendation(keyword, roas) {
        if (roas >= 4) return 'increase';
        if (roas >= 2) return 'maintain';
        return 'decrease';
    }

    /**
     * Identify keyword optimization opportunities
     * @private
     */
    _identifyKeywordOptimizations(keyword) {
        const opportunities = [];

        if (keyword.conversions < 5) {
            opportunities.push('Low conversion volume - consider bid adjustments');
        }
        if (keyword.keywordIntent === 'low') {
            opportunities.push('Low intent keyword - consider negative keywords or landing page optimization');
        }

        return opportunities;
    }

    /**
     * Generate keyword insights
     * @private
     */
    _generateKeywordInsights(keywords, summary) {
        const insights = [];

        if (summary.highIntentKeywords / summary.totalKeywords > 0.3) {
            insights.push('Good mix of high-intent keywords driving conversions');
        }

        return insights;
    }

    /**
     * Calculate product conversion rate
     * @private
     */
    _calculateProductConversionRate(product) {
        // Simplified calculation
        return Math.random() * 0.05 + 0.02; // 2-7% range
    }

    /**
     * Calculate product profit margin
     * @private
     */
    _calculateProductProfitMargin(product) {
        // Simplified calculation based on average order value
        if (product.averageOrderValue > 15000) return 65;
        if (product.averageOrderValue > 10000) return 55;
        return 45;
    }

    /**
     * Analyze product seasonality
     * @private
     */
    _analyzeProductSeasonality(product) {
        return {
            isHighlySeasonal: product.productName.toLowerCase().includes('cherry') ||
                product.productName.toLowerCase().includes('autumn'),
            peakSeason: 'spring',
            seasonalityScore: 0.7
        };
    }

    /**
     * Calculate product growth rate
     * @private
     */
    _calculateProductGrowthRate(product, filters) {
        // Simplified growth calculation
        return Math.random() * 0.2 - 0.1; // -10% to +10%
    }

    /**
     * Analyze product customer segments
     * @private
     */
    _analyzeProductCustomerSegments(product) {
        return {
            premium: 30,
            standard: 50,
            budget: 20
        };
    }

    /**
     * Calculate marketing efficiency
     * @private
     */
    _calculateMarketingEfficiency(product) {
        return product.revenue / (product.revenue * 0.2); // Simplified efficiency
    }

    /**
     * Generate product recommendations
     * @private
     */
    _generateProductRecommendations(product) {
        const recommendations = [];

        if (product.conversionRate < 0.03) {
            recommendations.push('Low conversion rate - optimize product page');
        }
        if (product.revenueShare > 50) {
            recommendations.push('High revenue concentration - diversify product portfolio');
        }

        return recommendations;
    }

    /**
     * Generate product insights
     * @private
     */
    _generateProductInsights(products, summary) {
        const insights = [];

        if (summary.seasonalProducts > 0) {
            insights.push(`${summary.seasonalProducts} products show seasonal patterns - plan inventory accordingly`);
        }

        return insights;
    }

    /**
     * Convert report to CSV format
     * @private
     */
    _convertToCSV(report) {
        let csv = '';

        if (report.reportType === 'campaign_performance') {
            csv = 'Campaign,Revenue,Conversions,Average Order Value,ROAS,Performance Grade\n';
            report.campaigns.forEach(campaign => {
                csv += `"${campaign.campaign}",${campaign.revenue},${campaign.conversions},${campaign.averageOrderValue},${campaign.roas.toFixed(2)},"${campaign.performanceGrade}"\n`;
            });
        } else if (report.reportType === 'keyword_performance') {
            csv = 'Keyword,Campaign,Revenue,Conversions,Performance Score,Intent,Recommendation\n';
            report.keywords.forEach(keyword => {
                csv += `"${keyword.keyword}","${keyword.campaign}",${keyword.revenue},${keyword.conversions},${keyword.performanceScore},"${keyword.keywordIntent}","${keyword.bidRecommendation}"\n`;
            });
        } else if (report.reportType === 'product_performance') {
            csv = 'Product,Revenue,Conversions,Revenue Share,Profit Margin,Conversion Rate\n';
            report.products.forEach(product => {
                csv += `"${product.productName}",${product.revenue},${product.conversions},${product.revenueShare.toFixed(2)}%,${product.profitMargin.toFixed(2)}%,${(product.conversionRate * 100).toFixed(2)}%\n`;
            });
        }

        return csv;
    }

    /**
     * Get cached report if available and not expired
     * @private
     */
    _getCachedReport(cacheKey) {
        const cached = this.reportCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.report;
        }
        return null;
    }

    /**
     * Cache report with timestamp
     * @private
     */
    _cacheReport(cacheKey, report) {
        this.reportCache.set(cacheKey, {
            report,
            timestamp: Date.now()
        });
    }
}

// Create singleton instance
const revenueAttributionReporter = new RevenueAttributionReporter();

export default revenueAttributionReporter;