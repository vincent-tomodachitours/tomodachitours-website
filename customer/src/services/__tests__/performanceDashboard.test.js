// Performance Dashboard Service Tests
// Tests for campaign performance aggregation, ROI/ROAS calculations, and insights generation

import performanceDashboard from '../performanceDashboard.js';

// Mock dependencies
jest.mock('../attributionService.js', () => ({
    getEnhancedAttributionForAnalytics: jest.fn(() => ({
        source: 'google',
        medium: 'cpc',
        campaign: 'test-campaign',
        first_source: 'google',
        first_medium: 'cpc',
        first_campaign: 'test-campaign',
        gclid: 'test-gclid',
        attribution_chain: [
            { source: 'google', medium: 'cpc', timestamp: Date.now() - 86400000 },
            { source: 'direct', medium: 'none', timestamp: Date.now() }
        ],
        cross_device_available: true
    }))
}));

jest.mock('../googleAdsTracker.js', () => ({
    getGoogleAdsConfig: jest.fn(() => ({
        conversionId: 'test-conversion-id',
        isEnabled: true
    }))
}));

jest.mock('../performanceMonitor.js', () => ({
    handleError: jest.fn(),
    recordMetric: jest.fn()
}));

jest.mock('../dataValidator.js', () => ({
    validateTransaction: jest.fn(() => ({ isValid: true, sanitizedData: {} })),
    validateTour: jest.fn(() => ({ isValid: true, sanitizedData: {} }))
}));

describe('PerformanceDashboard', () => {
    beforeEach(() => {
        // Clear session storage before each test
        sessionStorage.clear();
        jest.clearAllMocks();
    });

    describe('ROI and ROAS Calculations', () => {
        test('should calculate ROI correctly', () => {
            const metrics = { revenue: 150000, cost: 50000 };
            const roi = performanceDashboard.calculateROI(metrics);
            expect(roi).toBe(200); // (150000 - 50000) / 50000 * 100 = 200%
        });

        test('should calculate ROAS correctly', () => {
            const metrics = { revenue: 150000, cost: 50000 };
            const roas = performanceDashboard.calculateROAS(metrics);
            expect(roas).toBe(3); // 150000 / 50000 = 3:1
        });

        test('should handle zero cost in ROI calculation', () => {
            const metrics = { revenue: 150000, cost: 0 };
            const roi = performanceDashboard.calculateROI(metrics);
            expect(roi).toBe(0);
        });

        test('should handle zero cost in ROAS calculation', () => {
            const metrics = { revenue: 150000, cost: 0 };
            const roas = performanceDashboard.calculateROAS(metrics);
            expect(roas).toBe(0);
        });

        test('should handle negative ROI', () => {
            const metrics = { revenue: 30000, cost: 50000 };
            const roi = performanceDashboard.calculateROI(metrics);
            expect(roi).toBe(-40); // (30000 - 50000) / 50000 * 100 = -40%
        });

        test('should round ROI and ROAS to 2 decimal places', () => {
            const metrics = { revenue: 100000, cost: 33333 };
            const roi = performanceDashboard.calculateROI(metrics);
            const roas = performanceDashboard.calculateROAS(metrics);
            expect(roi).toBe(200); // (100000-33333)/33333*100 = 200%
            expect(roas).toBe(3); // 100000/33333 = 3
        });
    });

    describe('Date Range Parsing', () => {
        test('should parse predefined date ranges', () => {
            const dateRange = performanceDashboard.parseDateRange('last7days');
            expect(dateRange).toHaveProperty('startDate');
            expect(dateRange).toHaveProperty('endDate');
            expect(dateRange.days).toBe(7);
        });

        test('should parse custom date range object', () => {
            const customRange = {
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            };
            const dateRange = performanceDashboard.parseDateRange(customRange);
            expect(dateRange.startDate).toBe('2024-01-01');
            expect(dateRange.endDate).toBe('2024-01-31');
        });

        test('should default to last30days for invalid input', () => {
            const dateRange = performanceDashboard.parseDateRange('invalid');
            expect(dateRange.days).toBe(30);
        });

        test('should handle yesterday date range with offset', () => {
            const dateRange = performanceDashboard.parseDateRange('yesterday');
            expect(dateRange.days).toBe(1);
            // Should be one day before today
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            expect(dateRange.endDate).toBe(yesterday.toISOString().split('T')[0]);
        });
    });

    describe('Tour Performance Analysis', () => {
        test('should calculate tour profitability score', () => {
            const metrics = {
                revenue: 100000,
                cost: 50000,
                purchases: 10,
                views: 1000
            };
            const avgPrice = 10000;
            const profitability = performanceDashboard.calculateTourProfitability(metrics, avgPrice);

            expect(profitability).toBeGreaterThan(0);
            expect(profitability).toBeLessThanOrEqual(100);
        });

        test('should return 0 profitability for tours with no conversions', () => {
            const metrics = {
                revenue: 0,
                cost: 10000,
                purchases: 0,
                views: 1000
            };
            const avgPrice = 10000;
            const profitability = performanceDashboard.calculateTourProfitability(metrics, avgPrice);
            expect(profitability).toBe(0);
        });

        test('should get tour performance breakdown', async () => {
            const dateRange = { startDate: '2024-01-01', endDate: '2024-01-31' };
            const tourPerformance = await performanceDashboard.getTourPerformanceBreakdown(dateRange);

            expect(Array.isArray(tourPerformance)).toBe(true);
            expect(tourPerformance.length).toBeGreaterThan(0);

            // Should be sorted by revenue descending
            for (let i = 1; i < tourPerformance.length; i++) {
                expect(tourPerformance[i - 1].revenue).toBeGreaterThanOrEqual(tourPerformance[i].revenue);
            }
        });
    });

    describe('Attribution Analysis', () => {
        test('should analyze first-touch attribution', () => {
            const attributionData = [
                {
                    attribution_chain: [
                        { source: 'google', medium: 'cpc' },
                        { source: 'direct', medium: 'none' }
                    ],
                    revenue: 10000,
                    cost: 2000
                },
                {
                    attribution_chain: [
                        { source: 'facebook', medium: 'social' },
                        { source: 'direct', medium: 'none' }
                    ],
                    revenue: 15000,
                    cost: 3000
                }
            ];

            const firstTouchAnalysis = performanceDashboard.analyzeFirstTouchAttribution(attributionData);

            expect(firstTouchAnalysis).toHaveProperty('google');
            expect(firstTouchAnalysis).toHaveProperty('facebook');
            expect(firstTouchAnalysis.google.conversions).toBe(1);
            expect(firstTouchAnalysis.google.revenue).toBe(10000);
            expect(firstTouchAnalysis.google.roi).toBe(400); // (10000-2000)/2000*100
        });

        test('should analyze last-touch attribution', () => {
            const attributionData = [
                {
                    attribution_chain: [
                        { source: 'google', medium: 'cpc' },
                        { source: 'direct', medium: 'none' }
                    ],
                    revenue: 10000,
                    cost: 2000
                }
            ];

            const lastTouchAnalysis = performanceDashboard.analyzeLastTouchAttribution(attributionData);

            expect(lastTouchAnalysis).toHaveProperty('direct');
            expect(lastTouchAnalysis.direct.conversions).toBe(1);
            expect(lastTouchAnalysis.direct.revenue).toBe(10000);
        });

        test('should analyze multi-touch attribution with equal credit distribution', () => {
            const attributionData = [
                {
                    attribution_chain: [
                        { source: 'google', medium: 'cpc' },
                        { source: 'facebook', medium: 'social' },
                        { source: 'direct', medium: 'none' }
                    ],
                    revenue: 15000,
                    cost: 3000
                }
            ];

            const multiTouchAnalysis = performanceDashboard.analyzeMultiTouchAttribution(attributionData);

            expect(multiTouchAnalysis).toHaveProperty('google');
            expect(multiTouchAnalysis).toHaveProperty('facebook');
            expect(multiTouchAnalysis).toHaveProperty('direct');

            // Each touchpoint should get 1/3 of the credit
            expect(multiTouchAnalysis.google.conversions).toBeCloseTo(1 / 3);
            expect(multiTouchAnalysis.google.revenue).toBeCloseTo(5000);
            expect(multiTouchAnalysis.google.cost).toBeCloseTo(1000);
        });

        test('should analyze cross-device attribution', () => {
            const attributionData = [
                { cross_device_available: true, device_switches: 2 },
                { cross_device_available: false },
                { cross_device_available: true, device_switches: 1 }
            ];

            const crossDeviceAnalysis = performanceDashboard.analyzeCrossDeviceAttribution(attributionData);

            expect(crossDeviceAnalysis.totalConversions).toBe(3);
            expect(crossDeviceAnalysis.crossDeviceConversions).toBe(2);
            expect(crossDeviceAnalysis.crossDeviceRate).toBeCloseTo(66.67);
            expect(crossDeviceAnalysis.avgDeviceSwitches).toBe(1.5);
        });

        test('should analyze conversion paths', () => {
            const attributionData = [
                {
                    attribution_chain: [
                        { source: 'google' },
                        { source: 'direct' }
                    ],
                    revenue: 10000
                },
                {
                    attribution_chain: [
                        { source: 'google' },
                        { source: 'direct' }
                    ],
                    revenue: 15000
                },
                {
                    attribution_chain: [
                        { source: 'facebook' },
                        { source: 'google' },
                        { source: 'direct' }
                    ],
                    revenue: 20000
                }
            ];

            const pathAnalysis = performanceDashboard.analyzeConversionPaths(attributionData);

            expect(pathAnalysis.pathLengths[2]).toBe(2); // Two paths with length 2
            expect(pathAnalysis.pathLengths[3]).toBe(1); // One path with length 3
            expect(pathAnalysis.commonPaths['google > direct'].count).toBe(2);
            expect(pathAnalysis.commonPaths['google > direct'].revenue).toBe(25000);
            expect(pathAnalysis.topConvertingPaths.length).toBeGreaterThan(0);
        });
    });

    describe('Automated Insights Generation', () => {
        test('should generate ROI insights for excellent performance', () => {
            const metrics = {
                summary: { roi: 250, roas: 4.5 }
            };

            const insights = performanceDashboard.generateROIInsights(metrics);
            const roiInsight = insights.find(insight => insight.type === 'roi_excellent');

            expect(roiInsight).toBeDefined();
            expect(roiInsight.priority).toBe(90);
            expect(roiInsight.actionable).toBe(true);
        });

        test('should generate ROI insights for negative performance', () => {
            const metrics = {
                summary: { roi: -25, roas: 0.8 }
            };

            const insights = performanceDashboard.generateROIInsights(metrics);
            const roiInsight = insights.find(insight => insight.type === 'roi_negative');

            expect(roiInsight).toBeDefined();
            expect(roiInsight.priority).toBe(100);
            expect(roiInsight.actionable).toBe(true);
        });

        test('should generate ROAS insights for strong performance', () => {
            const metrics = {
                summary: { roi: 150, roas: 5.2 }
            };

            const insights = performanceDashboard.generateROIInsights(metrics);
            const roasInsight = insights.find(insight => insight.type === 'roas_excellent');

            expect(roasInsight).toBeDefined();
            expect(roasInsight.priority).toBe(85);
        });

        test('should generate ROAS insights for low performance', () => {
            const metrics = {
                summary: { roi: 50, roas: 1.5 }
            };

            const insights = performanceDashboard.generateROIInsights(metrics);
            const roasInsight = insights.find(insight => insight.type === 'roas_low');

            expect(roasInsight).toBeDefined();
            expect(roasInsight.priority).toBe(95);
        });

        test('should generate campaign insights for top performer', () => {
            const metrics = {
                googleAds: {
                    campaigns: [
                        { name: 'Campaign A', revenue: 50000 },
                        { name: 'Campaign B', revenue: 75000 },
                        { name: 'Campaign C', revenue: 30000 }
                    ]
                }
            };

            const insights = performanceDashboard.generateCampaignInsights(metrics);
            const campaignInsight = insights.find(insight => insight.type === 'top_campaign');

            expect(campaignInsight).toBeDefined();
            expect(campaignInsight.description).toContain('Campaign B');
            expect(campaignInsight.description).toContain('¥75,000');
        });

        test('should generate tour insights for best performer', () => {
            const metrics = {
                tours: [
                    { tourName: 'Gion Tour', revenue: 100000 },
                    { tourName: 'Morning Tour', revenue: 150000 },
                    { tourName: 'Night Tour', revenue: 80000 }
                ]
            };

            const insights = performanceDashboard.generateTourInsights(metrics);
            const tourInsight = insights.find(insight => insight.type === 'top_tour');

            expect(tourInsight).toBeDefined();
            expect(tourInsight.description).toContain('Morning Tour');
            expect(tourInsight.description).toContain('¥150,000');
        });

        test('should generate tour insights for low converting tours', () => {
            const metrics = {
                tours: [
                    { tourName: 'Tour A', conversionRate: 0.5, views: 500 },
                    { tourName: 'Tour B', conversionRate: 2.0, views: 300 },
                    { tourName: 'Tour C', conversionRate: 0.8, views: 200 }
                ]
            };

            const insights = performanceDashboard.generateTourInsights(metrics);
            const lowConvertingInsight = insights.find(insight => insight.type === 'low_converting_tours');

            expect(lowConvertingInsight).toBeDefined();
            expect(lowConvertingInsight.description).toContain('2 tours'); // Tour A and Tour C meet criteria (< 1% conversion, > 100 views)
        });

        test('should generate seasonal insights for cherry blossom season', () => {
            // Mock current date to be in March (cherry blossom season)
            const originalDate = Date;
            global.Date = jest.fn(() => new Date('2024-03-15'));
            global.Date.now = originalDate.now;

            const metrics = { summary: {} };
            const insights = performanceDashboard.generateSeasonalInsights(metrics);
            const seasonalInsight = insights.find(insight => insight.type === 'seasonal_cherry_blossom');

            expect(seasonalInsight).toBeDefined();
            expect(seasonalInsight.priority).toBe(90);

            // Restore original Date
            global.Date = originalDate;
        });

        test('should generate optimization recommendations for budget increase', () => {
            const metrics = {
                summary: { cost: 50000, revenue: 200000 }
            };

            const insights = performanceDashboard.generateOptimizationRecommendations(metrics);
            const budgetInsight = insights.find(insight => insight.type === 'budget_increase');

            expect(budgetInsight).toBeDefined();
            expect(budgetInsight.priority).toBe(80);
        });

        test('should generate optimization recommendations for conversion rate', () => {
            const metrics = {
                summary: { conversionRate: 1.5 }
            };

            const insights = performanceDashboard.generateOptimizationRecommendations(metrics);
            const conversionInsight = insights.find(insight => insight.type === 'conversion_optimization');

            expect(conversionInsight).toBeDefined();
            expect(conversionInsight.priority).toBe(90);
        });

        test('should sort insights by priority', () => {
            const metrics = {
                summary: { roi: -10, roas: 1.2, conversionRate: 1.0 }
            };

            const allInsights = performanceDashboard.generateAutomatedInsights(metrics);

            // Should be sorted by priority descending
            for (let i = 1; i < allInsights.length; i++) {
                expect(allInsights[i - 1].priority).toBeGreaterThanOrEqual(allInsights[i].priority);
            }
        });
    });

    describe('Caching', () => {
        test('should cache and retrieve data', () => {
            const testData = { test: 'data', timestamp: Date.now() };
            const cacheKey = 'test_key';

            performanceDashboard.setCachedData(cacheKey, testData);
            const retrieved = performanceDashboard.getCachedData(cacheKey);

            expect(retrieved).toEqual(testData);
        });

        test('should return null for expired cache', () => {
            const testData = { test: 'data' };
            const cacheKey = 'test_key_expired';

            // Manually set expired cache
            const expiredCache = {
                data: testData,
                timestamp: Date.now() - (10 * 60 * 1000) // 10 minutes ago
            };
            sessionStorage.setItem(`performance_dashboard_cache_${cacheKey}`, JSON.stringify(expiredCache));

            const retrieved = performanceDashboard.getCachedData(cacheKey);
            expect(retrieved).toBeNull();
        });

        test('should clear all cached data', () => {
            performanceDashboard.setCachedData('key1', { data: 1 });
            performanceDashboard.setCachedData('key2', { data: 2 });

            performanceDashboard.clearCache();

            expect(performanceDashboard.getCachedData('key1')).toBeNull();
            expect(performanceDashboard.getCachedData('key2')).toBeNull();
        });
    });

    describe('Campaign Metrics Integration', () => {
        test('should get campaign metrics with default options', async () => {
            const metrics = await performanceDashboard.getCampaignMetrics();

            expect(metrics).toHaveProperty('dateRange');
            expect(metrics).toHaveProperty('summary');
            expect(metrics).toHaveProperty('insights');
            expect(metrics.summary).toHaveProperty('roi');
            expect(metrics.summary).toHaveProperty('roas');
        });

        test('should get campaign metrics with custom options', async () => {
            const options = {
                dateRange: 'last7days',
                campaigns: ['test-campaign'],
                includeGA4: true,
                includeGoogleAds: true,
                includeTourBreakdown: true
            };

            const metrics = await performanceDashboard.getCampaignMetrics(options);

            expect(metrics.dateRange.days).toBe(7);
            expect(metrics).toHaveProperty('ga4');
            expect(metrics).toHaveProperty('googleAds');
            expect(metrics).toHaveProperty('tours');
            expect(metrics).toHaveProperty('attribution');
        });

        test('should use cached data when available', async () => {
            const options = { dateRange: 'last30days' };

            // First call should generate data
            const metrics1 = await performanceDashboard.getCampaignMetrics(options);

            // Second call should use cached data
            const metrics2 = await performanceDashboard.getCampaignMetrics(options);

            expect(metrics1).toEqual(metrics2);
        });
    });

    describe('Conversion Attribution', () => {
        test('should get conversion attribution report', async () => {
            const conversionId = 'test-conversion-123';
            const attribution = await performanceDashboard.getConversionAttribution(conversionId);

            expect(attribution).toHaveProperty('conversionId', conversionId);
            expect(attribution).toHaveProperty('attribution');
            expect(attribution).toHaveProperty('touchpoints');
            expect(attribution).toHaveProperty('firstTouch');
            expect(attribution).toHaveProperty('lastTouch');
            expect(attribution.firstTouch).toHaveProperty('source');
            expect(attribution.lastTouch).toHaveProperty('source');
        });

        test('should handle attribution service errors gracefully', async () => {
            // Mock attribution service to throw error
            const attributionService = require('../attributionService.js');
            attributionService.getEnhancedAttributionForAnalytics.mockImplementation(() => {
                throw new Error('Attribution service error');
            });

            const attribution = await performanceDashboard.getConversionAttribution('test-id');
            expect(attribution).toBeNull();
        });
    });

    describe('Data Merging', () => {
        test('should merge numeric metrics correctly', () => {
            const target = { revenue: 100, conversions: 5 };
            const source = { revenue: 200, conversions: 3, newMetric: 10 };

            performanceDashboard.mergeMetricsData(target, source);

            expect(target.revenue).toBe(300);
            expect(target.conversions).toBe(8);
            expect(target.newMetric).toBe(10);
        });

        test('should not overwrite existing non-numeric properties', () => {
            const target = { name: 'Target', revenue: 100 };
            const source = { name: 'Source', revenue: 200 };

            performanceDashboard.mergeMetricsData(target, source);

            expect(target.name).toBe('Target');
            expect(target.revenue).toBe(300);
        });
    });
});