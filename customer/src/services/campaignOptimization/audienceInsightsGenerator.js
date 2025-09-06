// Audience Insights Generator
// Creates audience insights for campaign targeting improvements

import { calculateConfidenceScore } from './utils.js';

class AudienceInsightsGenerator {
    constructor() {
        this.thresholds = {
            minConversions: 5,
            roasTarget: 3.0,
            conversionRateTarget: 2.0,
            confidenceLevel: 0.95
        };
    }

    /**
     * Generate audience insights for a campaign
     * @param {Object} campaignData - Campaign data with audience information
     * @returns {Promise<Object>} Audience insights and recommendations
     */
    async generateInsights(campaignData) {
        const insights = {
            timestamp: new Date().toISOString(),
            campaignId: campaignData.campaignId,
            audienceAnalysis: {},
            targetingRecommendations: [],
            expansionOpportunities: [],
            exclusionRecommendations: []
        };

        // Analyze current audience performance
        insights.audienceAnalysis = this.analyzeAudiencePerformance(campaignData);

        // Generate targeting recommendations
        insights.targetingRecommendations = this.generateTargetingRecommendations(insights.audienceAnalysis);

        // Identify expansion opportunities
        insights.expansionOpportunities = this.identifyExpansionOpportunities(insights.audienceAnalysis);

        // Generate exclusion recommendations
        insights.exclusionRecommendations = this.generateExclusionRecommendations(insights.audienceAnalysis);

        return insights;
    }

    /**
     * Analyze audience performance
     * @param {Object} campaignData - Campaign data
     * @returns {Object} Audience performance analysis
     */
    analyzeAudiencePerformance(campaignData) {
        const analysis = {
            topPerformingAudiences: [],
            underperformingAudiences: [],
            audienceMetrics: {},
            demographicInsights: {},
            behavioralInsights: {},
            interestInsights: {}
        };

        if (!campaignData.audienceData) {
            return analysis;
        }

        // Analyze each audience segment
        const audiences = campaignData.audienceData;
        const audiencePerformance = audiences.map(audience => ({
            ...audience,
            roas: audience.conversionValue / (audience.cost || 1),
            conversionRate: (audience.conversions / (audience.clicks || 1)) * 100,
            costPerConversion: (audience.cost || 0) / (audience.conversions || 1),
            performanceScore: this.calculateAudiencePerformanceScore(audience)
        }));

        // Sort by performance score
        audiencePerformance.sort((a, b) => b.performanceScore - a.performanceScore);

        // Identify top and underperforming audiences
        const topThreshold = Math.ceil(audiencePerformance.length * 0.3); // Top 30%
        const bottomThreshold = Math.floor(audiencePerformance.length * 0.7); // Bottom 30%

        analysis.topPerformingAudiences = audiencePerformance.slice(0, topThreshold);
        analysis.underperformingAudiences = audiencePerformance.slice(bottomThreshold);

        // Calculate overall audience metrics
        analysis.audienceMetrics = this.calculateOverallAudienceMetrics(audiencePerformance);

        // Demographic insights
        analysis.demographicInsights = this.analyzeDemographicPerformance(audiencePerformance);

        // Behavioral insights
        analysis.behavioralInsights = this.analyzeBehavioralPerformance(audiencePerformance);

        // Interest insights
        analysis.interestInsights = this.analyzeInterestPerformance(audiencePerformance);

        return analysis;
    }

    /**
     * Calculate audience performance score
     * @param {Object} audience - Audience data
     * @returns {number} Performance score (0-100)
     */
    calculateAudiencePerformanceScore(audience) {
        const roas = audience.conversionValue / (audience.cost || 1);
        const conversionRate = (audience.conversions / (audience.clicks || 1)) * 100;
        const volume = audience.impressions || 0;

        // Weighted score: ROAS (50%), Conversion Rate (30%), Volume (20%)
        const roasScore = Math.min(roas / this.thresholds.roasTarget * 50, 50);
        const conversionScore = Math.min(conversionRate / this.thresholds.conversionRateTarget * 30, 30);
        const volumeScore = Math.min(volume / 10000 * 20, 20);

        return roasScore + conversionScore + volumeScore;
    }

    /**
     * Generate targeting recommendations
     * @param {Object} audienceAnalysis - Audience analysis data
     * @returns {Array} Targeting recommendations
     */
    generateTargetingRecommendations(audienceAnalysis) {
        const recommendations = [];

        // High-performing audience recommendations
        if (audienceAnalysis.topPerformingAudiences.length > 0) {
            const topAudience = audienceAnalysis.topPerformingAudiences[0];
            recommendations.push({
                type: 'increase_budget',
                priority: 'high',
                title: 'Increase Budget for Top Performing Audience',
                description: `"${topAudience.name}" has exceptional performance with ${topAudience.roas.toFixed(2)}:1 ROAS`,
                action: `Increase budget allocation by 30-50% for ${topAudience.name}`,
                expectedImpact: 'Potential 20-35% increase in overall campaign ROAS'
            });
        }

        // Underperforming audience recommendations
        if (audienceAnalysis.underperformingAudiences.length > 0) {
            const worstAudience = audienceAnalysis.underperformingAudiences[audienceAnalysis.underperformingAudiences.length - 1];
            if (worstAudience.roas < 1) {
                recommendations.push({
                    type: 'pause_audience',
                    priority: 'high',
                    title: 'Pause Underperforming Audience',
                    description: `"${worstAudience.name}" has poor ROAS of ${worstAudience.roas.toFixed(2)}:1`,
                    action: `Consider pausing or reducing budget for ${worstAudience.name}`,
                    expectedImpact: 'Improve overall campaign efficiency by 10-20%'
                });
            }
        }

        // Demographic-based recommendations
        if (audienceAnalysis.demographicInsights.topDemographic) {
            recommendations.push({
                type: 'demographic_focus',
                priority: 'medium',
                title: 'Focus on High-Converting Demographics',
                description: `${audienceAnalysis.demographicInsights.topDemographic} shows superior performance`,
                action: 'Create dedicated campaigns targeting similar demographics',
                expectedImpact: 'Potential 15-25% improvement in conversion rates'
            });
        }

        return recommendations;
    }

    /**
     * Identify expansion opportunities
     * @param {Object} audienceAnalysis - Audience analysis data
     * @returns {Array} Expansion opportunities
     */
    identifyExpansionOpportunities(audienceAnalysis) {
        const opportunities = [];

        // Similar audience expansion
        if (audienceAnalysis.topPerformingAudiences.length > 0) {
            opportunities.push({
                type: 'similar_audiences',
                title: 'Create Similar Audiences',
                description: 'Expand reach by creating lookalike audiences based on top performers',
                potentialReach: 'Estimated 2-3x audience expansion',
                expectedPerformance: '70-85% of original audience performance'
            });
        }

        // Interest expansion
        if (audienceAnalysis.interestInsights.topInterests) {
            opportunities.push({
                type: 'interest_expansion',
                title: 'Expand Interest Targeting',
                description: 'Add related interests to capture broader audience',
                potentialReach: 'Estimated 50-100% audience increase',
                expectedPerformance: '60-80% of current performance'
            });
        }

        // Geographic expansion
        opportunities.push({
            type: 'geographic_expansion',
            title: 'Geographic Expansion',
            description: 'Test performance in similar geographic markets',
            potentialReach: 'Market-dependent expansion',
            expectedPerformance: 'Variable based on market similarity'
        });

        return opportunities;
    }

    /**
     * Generate exclusion recommendations
     * @param {Object} audienceAnalysis - Audience analysis data
     * @returns {Array} Exclusion recommendations
     */
    generateExclusionRecommendations(audienceAnalysis) {
        const exclusions = [];

        // Low-performing audience exclusions
        audienceAnalysis.underperformingAudiences.forEach(audience => {
            if (audience.roas < 0.5) {
                exclusions.push({
                    type: 'audience_exclusion',
                    audienceId: audience.audienceId,
                    audienceName: audience.name,
                    reason: `Very poor ROAS of ${audience.roas.toFixed(2)}:1`,
                    recommendation: 'Add to exclusion list for future campaigns'
                });
            }
        });

        // Demographic exclusions
        if (audienceAnalysis.demographicInsights.poorPerformingDemographics) {
            audienceAnalysis.demographicInsights.poorPerformingDemographics.forEach(demo => {
                exclusions.push({
                    type: 'demographic_exclusion',
                    demographic: demo.segment,
                    reason: `Low conversion rate of ${demo.conversionRate.toFixed(2)}%`,
                    recommendation: 'Consider excluding from broad targeting campaigns'
                });
            });
        }

        return exclusions;
    }

    // Placeholder methods for complex analysis functions
    calculateOverallAudienceMetrics(audiencePerformance) {
        if (audiencePerformance.length === 0) return {};

        const totalImpressions = audiencePerformance.reduce((sum, aud) => sum + (aud.impressions || 0), 0);
        const totalClicks = audiencePerformance.reduce((sum, aud) => sum + (aud.clicks || 0), 0);
        const totalConversions = audiencePerformance.reduce((sum, aud) => sum + (aud.conversions || 0), 0);
        const totalCost = audiencePerformance.reduce((sum, aud) => sum + (aud.cost || 0), 0);
        const totalValue = audiencePerformance.reduce((sum, aud) => sum + (aud.conversionValue || 0), 0);

        return {
            totalAudiences: audiencePerformance.length,
            avgRoas: totalValue / (totalCost || 1),
            avgConversionRate: (totalConversions / (totalClicks || 1)) * 100,
            totalImpressions,
            totalConversions,
            totalValue
        };
    }

    analyzeDemographicPerformance(audiencePerformance) {
        // Simplified demographic analysis
        return {
            topDemographic: 'Adults 25-44',
            poorPerformingDemographics: []
        };
    }

    analyzeBehavioralPerformance(audiencePerformance) {
        // Simplified behavioral analysis
        return {
            topBehaviors: ['Travel enthusiasts', 'Cultural interests'],
            engagementPatterns: {}
        };
    }

    analyzeInterestPerformance(audiencePerformance) {
        // Simplified interest analysis
        return {
            topInterests: ['Travel', 'Culture', 'Photography'],
            interestPerformance: {}
        };
    }
}

export default AudienceInsightsGenerator;