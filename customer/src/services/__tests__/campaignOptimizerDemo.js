// Campaign Optimizer Demo
// Demonstrates the automated campaign optimization features

import campaignOptimizer from '../campaignOptimizer.js';

// Mock performance dashboard for demo
jest.mock('../performanceDashboard.js', () => ({
    getCampaignMetrics: jest.fn().mockResolvedValue({
        tours: [
            {
                tourName: 'Gion Cultural Tour',
                tourType: 'gion',
                revenue: 150000,
                conversions: 12,
                cost: 45000,
                timestamp: '2024-03-15T10:00:00Z'
            },
            {
                tourName: 'Morning Bamboo Tour',
                tourType: 'morning',
                revenue: 120000,
                conversions: 15,
                cost: 35000,
                timestamp: '2024-07-20T08:00:00Z'
            }
        ]
    })
}));

describe('Campaign Optimizer Demo', () => {
    test('should demonstrate complete campaign optimization workflow', async () => {
        console.log('\n=== Campaign Optimization Demo ===\n');

        // Sample campaign data
        const campaignData = {
            campaignId: 'kyoto-tours-spring-2024',
            bidStrategy: 'target_roas',
            conversions: [
                { value: 12000, tourType: 'gion', timestamp: '2024-03-15T10:00:00Z' },
                { value: 8000, tourType: 'morning', timestamp: '2024-03-16T14:00:00Z' },
                { value: 15000, tourType: 'night', timestamp: '2024-03-17T20:00:00Z' },
                { value: 10000, tourType: 'cultural', timestamp: '2024-03-18T11:00:00Z' }
            ],
            clicks: 500,
            impressions: 10000,
            cost: 25000,
            conversionValue: 45000,
            keywords: [
                {
                    keyword: 'kyoto cultural tour',
                    impressions: 3000,
                    clicks: 150,
                    conversions: 3,
                    cost: 7500,
                    conversionValue: 36000
                },
                {
                    keyword: 'gion district tour',
                    impressions: 2500,
                    clicks: 125,
                    conversions: 2,
                    cost: 6000,
                    conversionValue: 24000
                }
            ],
            deviceBreakdown: {
                mobile: { impressions: 6000, clicks: 300, conversions: 6, cost: 15000, conversionValue: 72000 },
                desktop: { impressions: 3000, clicks: 150, conversions: 4, cost: 7500, conversionValue: 48000 },
                tablet: { impressions: 1000, clicks: 50, conversions: 1, cost: 2500, conversionValue: 12000 }
            },
            audienceData: [
                {
                    audienceId: 'cultural-enthusiasts',
                    name: 'Cultural Enthusiasts',
                    impressions: 4000,
                    clicks: 200,
                    conversions: 8,
                    cost: 10000,
                    conversionValue: 96000
                },
                {
                    audienceId: 'budget-travelers',
                    name: 'Budget Travelers',
                    impressions: 3000,
                    clicks: 100,
                    conversions: 2,
                    cost: 5000,
                    conversionValue: 16000
                }
            ]
        };

        // 1. Conversion Value Optimization
        console.log('1. Running Conversion Value Optimization...');
        const conversionOptimization = await campaignOptimizer.optimizeConversionValue(campaignData);

        console.log(`   - Total Conversion Value: ¥${conversionOptimization.currentMetrics.totalConversionValue.toLocaleString()}`);
        console.log(`   - Average Conversion Value: ¥${conversionOptimization.currentMetrics.averageConversionValue.toLocaleString()}`);
        console.log(`   - Confidence Score: ${(conversionOptimization.confidenceScore * 100).toFixed(1)}%`);
        console.log(`   - Recommendations: ${conversionOptimization.recommendations.length} generated`);

        if (conversionOptimization.recommendations.length > 0) {
            console.log(`   - Top Recommendation: ${conversionOptimization.recommendations[0].title}`);
        }

        // 2. Audience Insights Generation
        console.log('\n2. Generating Audience Insights...');
        const audienceInsights = await campaignOptimizer.generateAudienceInsights(campaignData);

        console.log(`   - Top Performing Audiences: ${audienceInsights.audienceAnalysis.topPerformingAudiences.length}`);
        console.log(`   - Underperforming Audiences: ${audienceInsights.audienceAnalysis.underperformingAudiences.length}`);
        console.log(`   - Targeting Recommendations: ${audienceInsights.targetingRecommendations.length}`);
        console.log(`   - Expansion Opportunities: ${audienceInsights.expansionOpportunities.length}`);

        if (audienceInsights.audienceAnalysis.topPerformingAudiences.length > 0) {
            const topAudience = audienceInsights.audienceAnalysis.topPerformingAudiences[0];
            console.log(`   - Best Audience: ${topAudience.name} (ROAS: ${topAudience.roas.toFixed(2)}:1)`);
        }

        // 3. Seasonal Performance Tracking
        console.log('\n3. Tracking Seasonal Performance...');
        const seasonalAnalysis = await campaignOptimizer.trackSeasonalPerformance({
            dateRange: 'last365days',
            includePredictions: true
        });

        console.log(`   - Peak Seasons: ${seasonalAnalysis.seasonalTrends.peakSeasons.length} identified`);
        console.log(`   - Low Seasons: ${seasonalAnalysis.seasonalTrends.lowSeasons.length} identified`);
        console.log(`   - Seasonal Recommendations: ${seasonalAnalysis.recommendations.length} generated`);

        if (seasonalAnalysis.recommendations.length > 0) {
            console.log(`   - Current Season Strategy: ${seasonalAnalysis.recommendations[0].title}`);
        }

        // 4. Bid Recommendations
        console.log('\n4. Generating Bid Recommendations...');
        const bidRecommendations = await campaignOptimizer.generateBidRecommendations(campaignData);

        console.log(`   - Current Bid Strategy: ${bidRecommendations.currentBidStrategy}`);
        console.log(`   - Keyword Adjustments: ${bidRecommendations.adjustments.keywords.length} recommended`);
        console.log(`   - Device Adjustments: ${Object.keys(bidRecommendations.adjustments.devices).length} recommended`);
        console.log(`   - Overall Recommendations: ${bidRecommendations.recommendations.length} generated`);
        console.log(`   - Confidence Level: ${(bidRecommendations.confidenceLevel * 100).toFixed(1)}%`);

        if (bidRecommendations.adjustments.keywords.length > 0) {
            const topKeywordAdjustment = bidRecommendations.adjustments.keywords[0];
            console.log(`   - Top Keyword Adjustment: ${topKeywordAdjustment.keyword} (${topKeywordAdjustment.recommendedAdjustment > 0 ? '+' : ''}${topKeywordAdjustment.recommendedAdjustment}%)`);
        }

        // 5. Optimization History and Reporting
        console.log('\n5. Optimization History and Reporting...');
        const optimizationReport = await campaignOptimizer.getOptimizationReport(campaignData.campaignId);

        console.log(`   - Campaign ID: ${optimizationReport.campaignId}`);
        console.log(`   - Total Optimizations: ${optimizationReport.optimizationCount}`);
        console.log(`   - Optimization Types: ${optimizationReport.optimizationTypes.join(', ')}`);
        console.log(`   - Last Optimized: ${optimizationReport.lastOptimized ? new Date(optimizationReport.lastOptimized).toLocaleString() : 'Never'}`);

        // Summary
        console.log('\n=== Optimization Summary ===');
        console.log(`✅ Conversion Value Optimization: ${conversionOptimization.recommendations.length} recommendations`);
        console.log(`✅ Audience Insights: ${audienceInsights.targetingRecommendations.length} targeting improvements`);
        console.log(`✅ Seasonal Analysis: ${seasonalAnalysis.recommendations.length} seasonal strategies`);
        console.log(`✅ Bid Optimization: ${bidRecommendations.recommendations.length} bid adjustments`);
        console.log(`✅ Total Optimization History: ${optimizationReport.optimizationCount} entries`);

        console.log('\n=== Demo Complete ===\n');

        // Assertions for test validation
        expect(conversionOptimization).toHaveProperty('currentMetrics');
        expect(audienceInsights).toHaveProperty('audienceAnalysis');
        expect(seasonalAnalysis).toHaveProperty('seasonalTrends');
        expect(bidRecommendations).toHaveProperty('adjustments');
        expect(optimizationReport).toHaveProperty('optimizationCount');
        expect(optimizationReport.optimizationCount).toBe(4); // All 4 optimization types
    });

    test('should demonstrate modular architecture benefits', () => {
        console.log('\n=== Modular Architecture Benefits ===\n');

        console.log('✅ Separation of Concerns:');
        console.log('   - ConversionValueOptimizer: Handles conversion tracking and value optimization');
        console.log('   - AudienceInsightsGenerator: Manages audience analysis and targeting');
        console.log('   - SeasonalPerformanceTracker: Tracks seasonal patterns and predictions');
        console.log('   - BidRecommendationEngine: Generates automated bid adjustments');

        console.log('\n✅ Maintainability:');
        console.log('   - Each module is focused on a single responsibility');
        console.log('   - Shared utilities in utils.js for common functions');
        console.log('   - Constants in constants.js for configuration');
        console.log('   - Easy to test individual components');

        console.log('\n✅ Scalability:');
        console.log('   - New optimization features can be added as separate modules');
        console.log('   - Existing modules can be enhanced without affecting others');
        console.log('   - Shared optimization history across all modules');

        console.log('\n✅ Testability:');
        console.log('   - Each module can be tested independently');
        console.log('   - Mock dependencies easily for unit testing');
        console.log('   - Integration tests validate module interactions');

        console.log('\n=== Architecture Demo Complete ===\n');

        // Verify the modular structure exists
        expect(campaignOptimizer).toHaveProperty('conversionOptimizer');
        expect(campaignOptimizer).toHaveProperty('audienceInsights');
        expect(campaignOptimizer).toHaveProperty('seasonalTracker');
        expect(campaignOptimizer).toHaveProperty('bidEngine');
        expect(campaignOptimizer).toHaveProperty('optimizationHistory');
    });
});