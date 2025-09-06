// Insights Generator - Generates automated insights and recommendations
// Analyzes performance data to provide actionable insights

class InsightsGenerator {
    constructor() {
        // Insight priority levels
        this.priorities = {
            CRITICAL: 100,
            HIGH: 90,
            MEDIUM: 70,
            LOW: 50
        };
    }

    /**
     * Generate automated insights based on performance data
     * @param {Object} metrics - Complete metrics data
     * @returns {Array} Array of insight objects
     */
    generateAutomatedInsights(metrics) {
        const insights = [];

        try {
            // ROI/ROAS insights
            insights.push(...this.generateROIInsights(metrics));

            // Campaign performance insights
            insights.push(...this.generateCampaignInsights(metrics));

            // Tour performance insights
            insights.push(...this.generateTourInsights(metrics));

            // Attribution insights
            insights.push(...this.generateAttributionInsights(metrics));

            // Seasonal insights
            insights.push(...this.generateSeasonalInsights(metrics));

            // Optimization recommendations
            insights.push(...this.generateOptimizationRecommendations(metrics));

            // Sort insights by priority
            return insights.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        } catch (error) {
            console.error('Error generating automated insights:', error);
            return [];
        }
    }

    /**
     * Generate ROI/ROAS insights
     * @param {Object} metrics - Metrics data
     * @returns {Array} ROI/ROAS insights
     */
    generateROIInsights(metrics) {
        const insights = [];
        const { summary } = metrics;

        if (summary.roi !== undefined) {
            if (summary.roi > 200) {
                insights.push({
                    type: 'roi_excellent',
                    title: 'Excellent ROI Performance',
                    description: `Your campaigns are generating ${summary.roi}% ROI, significantly above the 100% break-even point.`,
                    priority: this.priorities.HIGH,
                    actionable: true,
                    recommendation: 'Consider increasing budget allocation to high-performing campaigns.'
                });
            } else if (summary.roi < 0) {
                insights.push({
                    type: 'roi_negative',
                    title: 'Negative ROI Alert',
                    description: `Your campaigns have a negative ROI of ${summary.roi}%. Immediate optimization needed.`,
                    priority: this.priorities.CRITICAL,
                    actionable: true,
                    recommendation: 'Review and pause underperforming campaigns, optimize targeting and ad creative.'
                });
            }
        }

        if (summary.roas !== undefined) {
            if (summary.roas > 4) {
                insights.push({
                    type: 'roas_excellent',
                    title: 'Strong ROAS Performance',
                    description: `Your ROAS of ${summary.roas}:1 indicates efficient ad spend with strong returns.`,
                    priority: this.priorities.MEDIUM + 15,
                    actionable: true,
                    recommendation: 'Scale successful campaigns and replicate winning strategies.'
                });
            } else if (summary.roas < 2) {
                insights.push({
                    type: 'roas_low',
                    title: 'Low ROAS Warning',
                    description: `ROAS of ${summary.roas}:1 is below the recommended 2:1 minimum for sustainable growth.`,
                    priority: this.priorities.HIGH + 5,
                    actionable: true,
                    recommendation: 'Optimize targeting, improve landing pages, and review keyword strategy.'
                });
            }
        }

        return insights;
    }

    /**
     * Generate campaign performance insights
     * @param {Object} metrics - Metrics data
     * @returns {Array} Campaign insights
     */
    generateCampaignInsights(metrics) {
        const insights = [];

        // Analyze campaign performance if data is available
        if (metrics.googleAds?.campaigns?.length > 0) {
            const campaigns = metrics.googleAds.campaigns;
            const topCampaign = campaigns.reduce((best, current) =>
                (current.revenue || 0) > (best.revenue || 0) ? current : best
            );

            if (topCampaign.revenue > 0) {
                insights.push({
                    type: 'top_campaign',
                    title: 'Top Performing Campaign',
                    description: `"${topCampaign.name}" is your highest revenue generator with ¥${topCampaign.revenue.toLocaleString()}.`,
                    priority: this.priorities.MEDIUM + 10,
                    actionable: true,
                    recommendation: 'Analyze this campaign\'s targeting and creative elements to replicate success.'
                });
            }
        }

        return insights;
    }

    /**
     * Generate tour-specific insights
     * @param {Object} metrics - Metrics data
     * @returns {Array} Tour insights
     */
    generateTourInsights(metrics) {
        const insights = [];

        if (metrics.tours?.length > 0) {
            const tours = metrics.tours;
            const topTour = tours.reduce((best, current) =>
                (current.revenue || 0) > (best.revenue || 0) ? current : best
            );

            const lowPerformingTours = tours.filter(tour =>
                (tour.conversionRate || 0) < 1 && (tour.views || 0) > 100
            );

            if (topTour.revenue > 0) {
                insights.push({
                    type: 'top_tour',
                    title: 'Best Performing Tour',
                    description: `${topTour.tourName} generates the highest revenue with ¥${topTour.revenue.toLocaleString()}.`,
                    priority: this.priorities.MEDIUM + 5,
                    actionable: true,
                    recommendation: 'Increase marketing focus on this tour and create similar experiences.'
                });
            }

            if (lowPerformingTours.length > 0) {
                insights.push({
                    type: 'low_converting_tours',
                    title: 'Tours Need Optimization',
                    description: `${lowPerformingTours.length} tours have low conversion rates despite good traffic.`,
                    priority: this.priorities.MEDIUM + 15,
                    actionable: true,
                    recommendation: 'Review pricing, descriptions, and booking flow for these tours.'
                });
            }
        }

        return insights;
    }

    /**
     * Generate attribution insights
     * @param {Object} metrics - Metrics data
     * @returns {Array} Attribution insights
     */
    generateAttributionInsights(metrics) {
        const insights = [];

        if (metrics.attribution?.crossDevice) {
            const crossDeviceRate = metrics.attribution.crossDevice.crossDeviceRate || 0;

            if (crossDeviceRate > 30) {
                insights.push({
                    type: 'cross_device_high',
                    title: 'High Cross-Device Usage',
                    description: `${crossDeviceRate.toFixed(1)}% of conversions involve multiple devices.`,
                    priority: this.priorities.MEDIUM,
                    actionable: true,
                    recommendation: 'Ensure consistent experience across devices and implement enhanced conversions.'
                });
            }
        }

        return insights;
    }

    /**
     * Generate seasonal insights
     * @param {Object} metrics - Metrics data
     * @returns {Array} Seasonal insights
     */
    generateSeasonalInsights(metrics) {
        const insights = [];
        const currentMonth = (new Date()).getMonth();

        // Cherry blossom season (March-May)
        if (currentMonth >= 2 && currentMonth <= 4) {
            insights.push({
                type: 'seasonal_cherry_blossom',
                title: 'Cherry Blossom Season Opportunity',
                description: 'Peak season for Kyoto tours. Expect increased demand and competition.',
                priority: this.priorities.HIGH,
                actionable: true,
                recommendation: 'Increase budgets for nature and cultural tours, optimize for cherry blossom keywords.'
            });
        }

        // Autumn foliage season (October-November)
        if (currentMonth >= 9 && currentMonth <= 10) {
            insights.push({
                type: 'seasonal_autumn',
                title: 'Autumn Foliage Season',
                description: 'High demand period for scenic tours and photography experiences.',
                priority: this.priorities.MEDIUM + 15,
                actionable: true,
                recommendation: 'Promote morning and cultural tours, target photography enthusiasts.'
            });
        }

        return insights;
    }

    /**
     * Generate optimization recommendations
     * @param {Object} metrics - Metrics data
     * @returns {Array} Optimization recommendations
     */
    generateOptimizationRecommendations(metrics) {
        const insights = [];
        const { summary } = metrics;

        // Budget optimization
        if (summary.cost > 0 && summary.revenue > 0) {
            const efficiency = summary.revenue / summary.cost;

            if (efficiency > 3) {
                insights.push({
                    type: 'budget_increase',
                    title: 'Budget Increase Opportunity',
                    description: 'High efficiency campaigns could benefit from increased budget allocation.',
                    priority: this.priorities.MEDIUM + 10,
                    actionable: true,
                    recommendation: 'Consider increasing daily budgets by 20-30% for top performing campaigns.'
                });
            }
        }

        // Conversion rate optimization
        if (summary.conversionRate !== undefined && summary.conversionRate < 2) {
            insights.push({
                type: 'conversion_optimization',
                title: 'Conversion Rate Below Average',
                description: `Current conversion rate of ${summary.conversionRate.toFixed(2)}% is below industry average.`,
                priority: this.priorities.HIGH,
                actionable: true,
                recommendation: 'A/B test landing pages, improve page load speed, and optimize booking flow.'
            });
        }

        // Cost per conversion optimization
        if (summary.costPerConversion > 5000) {
            insights.push({
                type: 'high_cost_per_conversion',
                title: 'High Cost Per Conversion',
                description: `Cost per conversion of ¥${summary.costPerConversion.toLocaleString()} is above optimal range.`,
                priority: this.priorities.MEDIUM + 5,
                actionable: true,
                recommendation: 'Review keyword targeting, improve ad relevance, and optimize landing pages.'
            });
        }

        // Click-through rate optimization
        if (summary.ctr !== undefined && summary.ctr < 2) {
            insights.push({
                type: 'low_ctr',
                title: 'Low Click-Through Rate',
                description: `CTR of ${summary.ctr.toFixed(2)}% indicates ads may not be compelling enough.`,
                priority: this.priorities.MEDIUM,
                actionable: true,
                recommendation: 'Test new ad copy, improve headlines, and use more relevant keywords.'
            });
        }

        return insights;
    }

    /**
     * Generate performance trend insights
     * @param {Object} currentMetrics - Current period metrics
     * @param {Object} previousMetrics - Previous period metrics
     * @returns {Array} Trend insights
     */
    generateTrendInsights(currentMetrics, previousMetrics) {
        const insights = [];

        if (!previousMetrics || !currentMetrics) return insights;

        const { summary: current } = currentMetrics;
        const { summary: previous } = previousMetrics;

        // Revenue trend
        if (previous.revenue > 0) {
            const revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;

            if (revenueChange > 20) {
                insights.push({
                    type: 'revenue_growth',
                    title: 'Strong Revenue Growth',
                    description: `Revenue increased by ${revenueChange.toFixed(1)}% compared to previous period.`,
                    priority: this.priorities.HIGH,
                    actionable: true,
                    recommendation: 'Identify and scale the factors driving this growth.'
                });
            } else if (revenueChange < -20) {
                insights.push({
                    type: 'revenue_decline',
                    title: 'Revenue Decline Alert',
                    description: `Revenue decreased by ${Math.abs(revenueChange).toFixed(1)}% compared to previous period.`,
                    priority: this.priorities.CRITICAL,
                    actionable: true,
                    recommendation: 'Investigate causes and implement recovery strategies immediately.'
                });
            }
        }

        // Conversion rate trend
        if (previous.conversionRate > 0) {
            const conversionChange = ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100;

            if (conversionChange < -15) {
                insights.push({
                    type: 'conversion_rate_decline',
                    title: 'Conversion Rate Declining',
                    description: `Conversion rate dropped by ${Math.abs(conversionChange).toFixed(1)}% compared to previous period.`,
                    priority: this.priorities.HIGH,
                    actionable: true,
                    recommendation: 'Review recent changes to website, ads, or targeting that may have impacted conversions.'
                });
            }
        }

        return insights;
    }

    /**
     * Generate competitive insights
     * @param {Object} metrics - Metrics data
     * @param {Object} benchmarks - Industry benchmarks
     * @returns {Array} Competitive insights
     */
    generateCompetitiveInsights(metrics, benchmarks) {
        const insights = [];

        if (!benchmarks) return insights;

        const { summary } = metrics;

        // Compare against industry benchmarks
        if (benchmarks.avgConversionRate && summary.conversionRate) {
            if (summary.conversionRate > benchmarks.avgConversionRate * 1.2) {
                insights.push({
                    type: 'above_benchmark',
                    title: 'Above Industry Benchmark',
                    description: `Your conversion rate of ${summary.conversionRate.toFixed(2)}% is ${((summary.conversionRate / benchmarks.avgConversionRate - 1) * 100).toFixed(1)}% above industry average.`,
                    priority: this.priorities.MEDIUM,
                    actionable: true,
                    recommendation: 'Document and replicate your successful strategies across other campaigns.'
                });
            } else if (summary.conversionRate < benchmarks.avgConversionRate * 0.8) {
                insights.push({
                    type: 'below_benchmark',
                    title: 'Below Industry Benchmark',
                    description: `Your conversion rate of ${summary.conversionRate.toFixed(2)}% is below industry average of ${benchmarks.avgConversionRate.toFixed(2)}%.`,
                    priority: this.priorities.HIGH,
                    actionable: true,
                    recommendation: 'Analyze competitor strategies and optimize your conversion funnel.'
                });
            }
        }

        return insights;
    }
}

export default InsightsGenerator;