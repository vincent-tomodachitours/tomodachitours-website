// Audience Insights Generator
// Creates audience insights for campaign targeting improvements

interface AudienceData {
    audienceId?: string;
    name: string;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    conversionValue?: number;
}

interface CampaignData {
    campaignId: string;
    audienceData?: AudienceData[];
}

interface AudiencePerformance extends AudienceData {
    roas: number;
    conversionRate: number;
    costPerConversion: number;
    performanceScore: number;
}

interface AudienceMetrics {
    totalAudiences: number;
    avgRoas: number;
    avgConversionRate: number;
    totalImpressions: number;
    totalConversions: number;
    totalValue: number;
}

interface DemographicInsights {
    topDemographic: string;
    poorPerformingDemographics: Array<{
        segment: string;
        conversionRate: number;
    }>;
}

interface BehavioralInsights {
    topBehaviors: string[];
    engagementPatterns: Record<string, any>;
}

interface InterestInsights {
    topInterests: string[];
    interestPerformance: Record<string, any>;
}

interface AudienceAnalysis {
    topPerformingAudiences: AudiencePerformance[];
    underperformingAudiences: AudiencePerformance[];
    audienceMetrics: AudienceMetrics;
    demographicInsights: DemographicInsights;
    behavioralInsights: BehavioralInsights;
    interestInsights: InterestInsights;
}

interface Recommendation {
    type: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action: string;
    expectedImpact: string;
}

interface ExpansionOpportunity {
    type: string;
    title: string;
    description: string;
    potentialReach: string;
    expectedPerformance: string;
}

interface ExclusionRecommendation {
    type: string;
    audienceId?: string;
    audienceName?: string;
    demographic?: string;
    reason: string;
    recommendation: string;
}

interface AudienceInsights {
    timestamp: string;
    campaignId: string;
    audienceAnalysis: AudienceAnalysis;
    targetingRecommendations: Recommendation[];
    expansionOpportunities: ExpansionOpportunity[];
    exclusionRecommendations: ExclusionRecommendation[];
}

interface Thresholds {
    minConversions: number;
    roasTarget: number;
    conversionRateTarget: number;
    confidenceLevel: number;
}

class AudienceInsightsGenerator {
    private thresholds: Thresholds;

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
     */
    async generateInsights(campaignData: CampaignData): Promise<AudienceInsights> {
        const insights: AudienceInsights = {
            timestamp: new Date().toISOString(),
            campaignId: campaignData.campaignId,
            audienceAnalysis: {} as AudienceAnalysis,
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
     */
    private analyzeAudiencePerformance(campaignData: CampaignData): AudienceAnalysis {
        const analysis: AudienceAnalysis = {
            topPerformingAudiences: [],
            underperformingAudiences: [],
            audienceMetrics: {} as AudienceMetrics,
            demographicInsights: {} as DemographicInsights,
            behavioralInsights: {} as BehavioralInsights,
            interestInsights: {} as InterestInsights
        };

        if (!campaignData.audienceData) {
            return analysis;
        }

        // Analyze each audience segment
        const audiences = campaignData.audienceData;
        const audiencePerformance: AudiencePerformance[] = audiences.map(audience => ({
            ...audience,
            roas: (audience.conversionValue || 0) / (audience.cost || 1),
            conversionRate: ((audience.conversions || 0) / (audience.clicks || 1)) * 100,
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
     */
    private calculateAudiencePerformanceScore(audience: AudienceData): number {
        const roas = (audience.conversionValue || 0) / (audience.cost || 1);
        const conversionRate = ((audience.conversions || 0) / (audience.clicks || 1)) * 100;
        const volume = audience.impressions || 0;

        // Weighted score: ROAS (50%), Conversion Rate (30%), Volume (20%)
        const roasScore = Math.min(roas / this.thresholds.roasTarget * 50, 50);
        const conversionScore = Math.min(conversionRate / this.thresholds.conversionRateTarget * 30, 30);
        const volumeScore = Math.min(volume / 10000 * 20, 20);

        return roasScore + conversionScore + volumeScore;
    }

    /**
     * Generate targeting recommendations
     */
    private generateTargetingRecommendations(audienceAnalysis: AudienceAnalysis): Recommendation[] {
        const recommendations: Recommendation[] = [];

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
     */
    private identifyExpansionOpportunities(audienceAnalysis: AudienceAnalysis): ExpansionOpportunity[] {
        const opportunities: ExpansionOpportunity[] = [];

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
     */
    private generateExclusionRecommendations(audienceAnalysis: AudienceAnalysis): ExclusionRecommendation[] {
        const exclusions: ExclusionRecommendation[] = [];

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
    private calculateOverallAudienceMetrics(audiencePerformance: AudiencePerformance[]): AudienceMetrics {
        if (audiencePerformance.length === 0) return {} as AudienceMetrics;

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

    private analyzeDemographicPerformance(_audiencePerformance: AudiencePerformance[]): DemographicInsights {
        // Simplified demographic analysis
        return {
            topDemographic: 'Adults 25-44',
            poorPerformingDemographics: []
        };
    }

    private analyzeBehavioralPerformance(_audiencePerformance: AudiencePerformance[]): BehavioralInsights {
        // Simplified behavioral analysis
        return {
            topBehaviors: ['Travel enthusiasts', 'Cultural interests'],
            engagementPatterns: {}
        };
    }

    private analyzeInterestPerformance(_audiencePerformance: AudiencePerformance[]): InterestInsights {
        // Simplified interest analysis
        return {
            topInterests: ['Travel', 'Culture', 'Photography'],
            interestPerformance: {}
        };
    }
}

export default AudienceInsightsGenerator;