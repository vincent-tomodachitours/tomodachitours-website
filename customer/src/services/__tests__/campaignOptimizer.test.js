// Campaign Optimizer Tests
// Tests for automated campaign optimization features

import campaignOptimizer from '../campaignOptimizer.js';

// Mock performance dashboard
jest.mock('../performanceDashboard.js', () => ({
    getCampaignMetrics: jest.fn()
}));

// Mock performance monitor
jest.mock('../performanceMonitor.js', () => ({
    handleError: jest.fn()
}));

describe('CampaignOptimizer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear optimizer state
        campaignOptimizer.optimizationHistory.clear();
        campaignOptimizer.seasonalTracker.seasonalPatterns.clear();
    });

    describe('Conversion Value Optimization', () => {
        const mockCampaignData = {
            campaignId: 'test-campaign-123',
            conversions: [
                { value: 12000, tourType: 'gion', timestamp: '2024-01-15T10:00:00Z' },
                { value: 8000, tourType: 'morning', timestamp: '2024-01-16T14:00:00Z' },
                { value: 15000, tourType: 'night', timestamp: '2024-01-17T20:00:00Z' },
                { value: 10000, tourType: 'cultural', timestamp: '2024-01-18T11:00:00Z' }
            ],
            clicks: 500,
            impressions: 10000,
            cost: 25000
        };

        test('should calculate conversion value metrics correctly', async () => {
            const optimization = await campaignOptimizer.optimizeConversionValue(mockCampaignData);

            expect(optimization).toHaveProperty('currentMetrics');
            expect(optimization.currentMetrics.totalConversionValue).toBe(45000);
            expect(optimization.currentMetrics.averageConversionValue).toBe(11250);
            expect(optimization.currentMetrics.conversionValuePerClick).toBe(90);
            expect(optimization.currentMetrics.conversionValuePerImpression).toBe(4.5);
        });

        test('should analyze value by tour type', async () => {
            const optimization = await campaignOptimizer.optimizeConversionValue(mockCampaignData);

            expect(optimization.currentMetrics.valuePerTour).toHaveProperty('gion');
            expect(optimization.currentMetrics.valuePerTour).toHaveProperty('morning');
            expect(optimization.currentMetrics.valuePerTour).toHaveProperty('night');
            expect(optimization.currentMetrics.valuePerTour).toHaveProperty('cultural');

            expect(optimization.currentMetrics.valuePerTour.night.averageValue).toBe(15000);
            expect(optimization.currentMetrics.valuePerTour.morning.averageValue).toBe(8000);
        });

        test('should generate value optimization recommendations', async () => {
            const optimization = await campaignOptimizer.optimizeConversionValue(mockCampaignData);

            expect(optimization.recommendations).toBeInstanceOf(Array);
            expect(optimization.recommendations.length).toBeGreaterThan(0);

            // Should include seasonal recommendations
            const seasonalRec = optimization.recommendations.find(rec => rec.type === 'seasonal_optimization');
            expect(seasonalRec).toBeDefined();
            expect(seasonalRec).toHaveProperty('title');
            expect(seasonalRec).toHaveProperty('action');
            expect(seasonalRec).toHaveProperty('expectedImpact');
        });

        test('should calculate confidence score based on data quality', async () => {
            const optimization = await campaignOptimizer.optimizeConversionValue(mockCampaignData);

            expect(optimization.confidenceScore).toBeGreaterThan(0);
            expect(optimization.confidenceScore).toBeLessThanOrEqual(1);
        });

        test('should store optimization history', async () => {
            await campaignOptimizer.optimizeConversionValue(mockCampaignData);

            const history = campaignOptimizer.optimizationHistory.get(mockCampaignData.campaignId);
            expect(history).toBeDefined();
            expect(history.campaignId).toBe(mockCampaignData.campaignId);
            expect(history.currentMetrics).toBeDefined();
        });

        test('should handle campaigns with no conversions', async () => {
            const noCampaignData = {
                campaignId: 'no-conversions-campaign',
                conversions: [],
                clicks: 100,
                impressions: 5000,
                cost: 10000
            };

            const optimization = await campaignOptimizer.optimizeConversionValue(noCampaignData);

            expect(optimization.currentMetrics.totalConversionValue).toBe(0);
            expect(optimization.currentMetrics.averageConversionValue).toBe(0);
            expect(optimization.recommendations).toBeInstanceOf(Array);
        });
    });

    describe('Audience Insights Generation', () => {
        const mockCampaignDataWithAudiences = {
            campaignId: 'audience-test-campaign',
            audienceData: [
                {
                    audienceId: 'cultural-enthusiasts',
                    name: 'Cultural Enthusiasts',
                    impressions: 5000,
                    clicks: 250,
                    conversions: 15,
                    cost: 12000,
                    conversionValue: 180000
                },
                {
                    audienceId: 'photography-lovers',
                    name: 'Photography Lovers',
                    impressions: 3000,
                    clicks: 180,
                    conversions: 8,
                    cost: 8000,
                    conversionValue: 96000
                },
                {
                    audienceId: 'budget-travelers',
                    name: 'Budget Travelers',
                    impressions: 8000,
                    clicks: 200,
                    conversions: 5,
                    cost: 6000,
                    conversionValue: 40000
                }
            ]
        };

        test('should analyze audience performance correctly', async () => {
            const insights = await campaignOptimizer.generateAudienceInsights(mockCampaignDataWithAudiences);

            expect(insights).toHaveProperty('audienceAnalysis');
            expect(insights.audienceAnalysis).toHaveProperty('topPerformingAudiences');
            expect(insights.audienceAnalysis).toHaveProperty('underperformingAudiences');

            expect(insights.audienceAnalysis.topPerformingAudiences.length).toBeGreaterThan(0);
            expect(insights.audienceAnalysis.underperformingAudiences.length).toBeGreaterThan(0);
        });

        test('should calculate audience performance scores', async () => {
            const insights = await campaignOptimizer.generateAudienceInsights(mockCampaignDataWithAudiences);

            const topAudience = insights.audienceAnalysis.topPerformingAudiences[0];
            expect(topAudience).toHaveProperty('performanceScore');
            expect(topAudience).toHaveProperty('roas');
            expect(topAudience).toHaveProperty('conversionRate');
            expect(topAudience).toHaveProperty('costPerConversion');

            expect(topAudience.performanceScore).toBeGreaterThan(0);
            expect(topAudience.roas).toBeGreaterThan(0);
        });

        test('should generate targeting recommendations', async () => {
            const insights = await campaignOptimizer.generateAudienceInsights(mockCampaignDataWithAudiences);

            expect(insights.targetingRecommendations).toBeInstanceOf(Array);
            expect(insights.expansionOpportunities).toBeInstanceOf(Array);
            expect(insights.exclusionRecommendations).toBeInstanceOf(Array);
        });

        test('should store audience insights', async () => {
            await campaignOptimizer.generateAudienceInsights(mockCampaignDataWithAudiences);

            const storedInsights = campaignOptimizer.optimizationHistory.get(`${mockCampaignDataWithAudiences.campaignId}_audience`);
            expect(storedInsights).toBeDefined();
            expect(storedInsights.campaignId).toBe(mockCampaignDataWithAudiences.campaignId);
        });

        test('should handle campaigns with no audience data', async () => {
            const noAudienceData = {
                campaignId: 'no-audience-campaign',
                audienceData: null
            };

            const insights = await campaignOptimizer.generateAudienceInsights(noAudienceData);

            expect(insights.audienceAnalysis.topPerformingAudiences).toEqual([]);
            expect(insights.audienceAnalysis.underperformingAudiences).toEqual([]);
        });
    });

    describe('Seasonal Performance Tracking', () => {
        const mockPerformanceDashboard = require('../performanceDashboard.js');

        beforeEach(() => {
            mockPerformanceDashboard.getCampaignMetrics.mockResolvedValue({
                tours: [
                    {
                        tourName: 'Gion Cultural Tour',
                        tourType: 'gion',
                        revenue: 150000,
                        conversions: 12,
                        cost: 45000,
                        timestamp: '2024-03-15T10:00:00Z' // Spring
                    },
                    {
                        tourName: 'Morning Bamboo Tour',
                        tourType: 'morning',
                        revenue: 120000,
                        conversions: 15,
                        cost: 35000,
                        timestamp: '2024-07-20T08:00:00Z' // Summer
                    },
                    {
                        tourName: 'Night Photography Tour',
                        tourType: 'night',
                        revenue: 180000,
                        conversions: 18,
                        cost: 50000,
                        timestamp: '2024-10-10T19:00:00Z' // Autumn
                    }
                ]
            });
        });

        test('should track seasonal performance patterns', async () => {
            const seasonalAnalysis = await campaignOptimizer.trackSeasonalPerformance({
                dateRange: 'last365days',
                tourTypes: ['all'],
                includePredictions: true
            });

            expect(seasonalAnalysis).toHaveProperty('seasonalTrends');
            expect(seasonalAnalysis).toHaveProperty('tourTypeSeasonality');
            expect(seasonalAnalysis).toHaveProperty('predictions');
            expect(seasonalAnalysis).toHaveProperty('recommendations');

            expect(seasonalAnalysis.seasonalTrends).toHaveProperty('monthlyPerformance');
            expect(seasonalAnalysis.seasonalTrends).toHaveProperty('seasonalPatterns');
        });

        test('should identify peak and low seasons', async () => {
            const seasonalAnalysis = await campaignOptimizer.trackSeasonalPerformance();

            expect(seasonalAnalysis.seasonalTrends).toHaveProperty('peakSeasons');
            expect(seasonalAnalysis.seasonalTrends).toHaveProperty('lowSeasons');

            expect(seasonalAnalysis.seasonalTrends.peakSeasons).toBeInstanceOf(Array);
            expect(seasonalAnalysis.seasonalTrends.lowSeasons).toBeInstanceOf(Array);
        });

        test('should generate seasonal recommendations', async () => {
            const seasonalAnalysis = await campaignOptimizer.trackSeasonalPerformance();

            expect(seasonalAnalysis.recommendations).toBeInstanceOf(Array);
            expect(seasonalAnalysis.recommendations.length).toBeGreaterThan(0);

            const recommendations = seasonalAnalysis.recommendations;
            expect(recommendations.every(rec => rec.hasOwnProperty('type'))).toBe(true);
            expect(recommendations.every(rec => rec.hasOwnProperty('description'))).toBe(true);
        });

        test('should store seasonal patterns', async () => {
            await campaignOptimizer.trackSeasonalPerformance();

            const storedPatterns = campaignOptimizer.optimizationHistory.get('seasonal_analysis');
            expect(storedPatterns).toBeDefined();
            expect(storedPatterns).toHaveProperty('seasonalTrends');
        });

        test('should handle different date ranges', async () => {
            const shortTermAnalysis = await campaignOptimizer.trackSeasonalPerformance({
                dateRange: 'last90days'
            });

            const longTermAnalysis = await campaignOptimizer.trackSeasonalPerformance({
                dateRange: 'last365days'
            });

            expect(shortTermAnalysis.dateRange).toBe('last90days');
            expect(longTermAnalysis.dateRange).toBe('last365days');
        });
    });

    describe('Bid Adjustment Recommendations', () => {
        const mockCampaignDataWithBids = {
            campaignId: 'bid-test-campaign',
            bidStrategy: 'target_roas',
            conversions: 25,
            conversionValue: 300000,
            cost: 75000,
            clicks: 1500,
            impressions: 50000,
            avgQualityScore: 7.2,
            keywords: [
                {
                    keyword: 'kyoto cultural tour',
                    impressions: 15000,
                    clicks: 450,
                    conversions: 8,
                    cost: 22000,
                    conversionValue: 96000,
                    avgCpc: 48.89
                },
                {
                    keyword: 'gion district tour',
                    impressions: 12000,
                    clicks: 380,
                    conversions: 6,
                    cost: 18000,
                    conversionValue: 72000,
                    avgCpc: 47.37
                },
                {
                    keyword: 'cheap kyoto tour',
                    impressions: 8000,
                    clicks: 200,
                    conversions: 2,
                    cost: 8000,
                    conversionValue: 16000,
                    avgCpc: 40.00
                }
            ],
            deviceBreakdown: {
                mobile: { impressions: 25000, clicks: 750, conversions: 12, cost: 35000, conversionValue: 144000 },
                desktop: { impressions: 20000, clicks: 600, conversions: 10, cost: 30000, conversionValue: 120000 },
                tablet: { impressions: 5000, clicks: 150, conversions: 3, cost: 10000, conversionValue: 36000 }
            }
        };

        test('should analyze bid performance correctly', async () => {
            const recommendations = await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            expect(recommendations).toHaveProperty('currentBidStrategy');
            expect(recommendations).toHaveProperty('adjustments');
            expect(recommendations).toHaveProperty('expectedImpact');
            expect(recommendations).toHaveProperty('confidenceLevel');

            expect(recommendations.currentBidStrategy).toBe('target_roas');
            expect(recommendations.confidenceLevel).toBeGreaterThan(0);
        });

        test('should generate keyword bid adjustments', async () => {
            const recommendations = await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            expect(recommendations.adjustments).toHaveProperty('keywords');
            expect(recommendations.adjustments.keywords).toBeInstanceOf(Array);
        });

        test('should generate device bid adjustments', async () => {
            const recommendations = await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            expect(recommendations.adjustments).toHaveProperty('devices');
            expect(typeof recommendations.adjustments.devices).toBe('object');
        });

        test('should generate overall recommendations', async () => {
            const recommendations = await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            expect(recommendations.recommendations).toBeInstanceOf(Array);
            expect(recommendations.recommendations.length).toBeGreaterThan(0);

            const firstRec = recommendations.recommendations[0];
            expect(firstRec).toHaveProperty('type');
            expect(firstRec).toHaveProperty('priority');
            expect(firstRec).toHaveProperty('title');
            expect(firstRec).toHaveProperty('description');
        });

        test('should calculate expected impact', async () => {
            const recommendations = await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            expect(recommendations.expectedImpact).toBeDefined();
            expect(typeof recommendations.expectedImpact).toBe('object');
        });

        test('should store bid recommendations', async () => {
            await campaignOptimizer.generateBidRecommendations(mockCampaignDataWithBids);

            const storedRecommendations = campaignOptimizer.optimizationHistory.get(`${mockCampaignDataWithBids.campaignId}_bids`);
            expect(storedRecommendations).toBeDefined();
            expect(storedRecommendations.campaignId).toBe(mockCampaignDataWithBids.campaignId);
        });

        test('should handle campaigns with minimal data', async () => {
            const minimalData = {
                campaignId: 'minimal-campaign',
                conversions: 2,
                cost: 5000,
                clicks: 100
            };

            const recommendations = await campaignOptimizer.generateBidRecommendations(minimalData);

            expect(recommendations.confidenceLevel).toBeLessThan(0.5); // Low confidence due to minimal data
            expect(recommendations.recommendations).toBeInstanceOf(Array);
        });
    });

    describe('Optimization History Management', () => {
        test('should get optimization history for a campaign', async () => {
            const campaignId = 'test-campaign-123';

            // Generate some optimization history
            await campaignOptimizer.optimizeConversionValue({
                campaignId,
                conversions: [{ value: 10000, tourType: 'gion' }],
                clicks: 100,
                impressions: 1000,
                cost: 5000
            });

            const history = campaignOptimizer.getOptimizationHistory(campaignId);
            expect(history).toBeInstanceOf(Array);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0]).toHaveProperty('type');
            expect(history[0]).toHaveProperty('timestamp');
        });

        test('should clear optimization history', async () => {
            const campaignId = 'test-campaign-clear';

            // Generate some optimization history
            await campaignOptimizer.optimizeConversionValue({
                campaignId,
                conversions: [{ value: 10000, tourType: 'gion' }],
                clicks: 100,
                impressions: 1000,
                cost: 5000
            });

            // Clear specific campaign history
            campaignOptimizer.clearHistory(campaignId);
            const history = campaignOptimizer.getOptimizationHistory(campaignId);
            expect(history.length).toBe(0);
        });

        test('should generate optimization report', async () => {
            const campaignId = 'test-campaign-report';

            // Generate some optimization history
            await campaignOptimizer.optimizeConversionValue({
                campaignId,
                conversions: [{ value: 10000, tourType: 'gion' }],
                clicks: 100,
                impressions: 1000,
                cost: 5000
            });

            const report = await campaignOptimizer.getOptimizationReport(campaignId);
            expect(report).toHaveProperty('campaignId');
            expect(report).toHaveProperty('lastOptimized');
            expect(report).toHaveProperty('optimizationCount');
            expect(report).toHaveProperty('optimizationTypes');
            expect(report).toHaveProperty('summary');

            expect(report.campaignId).toBe(campaignId);
            expect(report.optimizationCount).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        const mockPerformanceMonitor = require('../performanceMonitor.js');

        test('should handle errors in conversion value optimization', async () => {
            const invalidData = {
                campaignId: 'test-error',
                conversions: null // This will cause an error in processing
            };

            // The error should be caught and handled gracefully
            const result = await campaignOptimizer.optimizeConversionValue(invalidData);

            // Should still return a result structure even with errors
            expect(result).toHaveProperty('campaignId');
            expect(result).toHaveProperty('currentMetrics');
            expect(result).toHaveProperty('recommendations');
        });

        test('should handle errors in audience insights generation', async () => {
            const invalidData = {
                campaignId: 'test-error-audience',
                audienceData: null
            };

            // The error should be caught and handled gracefully
            const result = await campaignOptimizer.generateAudienceInsights(invalidData);

            // Should still return a result structure even with errors
            expect(result).toHaveProperty('campaignId');
            expect(result).toHaveProperty('audienceAnalysis');
            expect(result).toHaveProperty('targetingRecommendations');
        });

        test('should handle errors in seasonal tracking', async () => {
            const mockPerformanceDashboard = require('../performanceDashboard.js');
            mockPerformanceDashboard.getCampaignMetrics.mockRejectedValue(new Error('API Error'));

            await expect(campaignOptimizer.trackSeasonalPerformance())
                .rejects.toThrow('API Error');

            expect(mockPerformanceMonitor.handleError).toHaveBeenCalledWith(
                'SEASONAL_TRACKING_ERROR',
                expect.any(Object)
            );
        });

        test('should handle errors in bid recommendations', async () => {
            const invalidData = {
                campaignId: 'test-error-bids',
                keywords: null // This should be handled gracefully
            };

            // The error should be caught and handled gracefully
            const result = await campaignOptimizer.generateBidRecommendations(invalidData);

            // Should still return a result structure even with errors
            expect(result).toHaveProperty('campaignId');
            expect(result).toHaveProperty('recommendations');
            expect(result).toHaveProperty('adjustments');
        });
    });
});