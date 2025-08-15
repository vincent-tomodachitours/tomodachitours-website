// Performance Dashboard Service Tests - Refactored Version
// Tests for the modular performance dashboard implementation

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

jest.mock('../performanceMonitor.js', () => ({
    handleError: jest.fn(),
    recordMetric: jest.fn()
}));

describe('PerformanceDashboard - Refactored', () => {
    beforeEach(() => {
        // Clear session storage before each test
        sessionStorage.clear();
        jest.clearAllMocks();
    });

    describe('Core Functionality', () => {
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

        test('should handle zero cost in calculations', () => {
            const metrics = { revenue: 150000, cost: 0 };
            const roi = performanceDashboard.calculateROI(metrics);
            const roas = performanceDashboard.calculateROAS(metrics);
            expect(roi).toBe(0);
            expect(roas).toBe(0);
        });

        test('should parse date ranges correctly', () => {
            const dateRange = performanceDashboard.parseDateRange('last7days');
            expect(dateRange).toHaveProperty('startDate');
            expect(dateRange).toHaveProperty('endDate');
            expect(dateRange.days).toBe(7);
        });

        test('should merge metrics data correctly', () => {
            const target = { revenue: 100, conversions: 5 };
            const source = { revenue: 200, conversions: 3, newMetric: 10 };

            performanceDashboard.mergeMetricsData(target, source);

            expect(target.revenue).toBe(300);
            expect(target.conversions).toBe(8);
            expect(target.newMetric).toBe(10);
        });
    });

    describe('Campaign Metrics', () => {
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

    describe('Attribution Analysis', () => {
        test('should get conversion attribution report', async () => {
            const conversionId = 'test-conversion-123';
            const attribution = await performanceDashboard.getConversionAttribution(conversionId);

            expect(attribution).toHaveProperty('conversionId', conversionId);
            expect(attribution).toHaveProperty('attribution');
            expect(attribution).toHaveProperty('touchpoints');
            expect(attribution).toHaveProperty('firstTouch');
            expect(attribution).toHaveProperty('lastTouch');
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

        test('should clear all cached data', () => {
            performanceDashboard.setCachedData('key1', { data: 1 });
            performanceDashboard.setCachedData('key2', { data: 2 });

            performanceDashboard.clearCache();

            expect(performanceDashboard.getCachedData('key1')).toBeNull();
            expect(performanceDashboard.getCachedData('key2')).toBeNull();
        });
    });

    describe('Tour Performance', () => {
        test('should calculate tour profitability', () => {
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
    });

    describe('Modular Components', () => {
        test('should have metrics collector component', () => {
            expect(performanceDashboard.metricsCollector).toBeDefined();
            expect(typeof performanceDashboard.metricsCollector.collectGA4Metrics).toBe('function');
            expect(typeof performanceDashboard.metricsCollector.collectGoogleAdsMetrics).toBe('function');
        });

        test('should have attribution analyzer component', () => {
            expect(performanceDashboard.attributionAnalyzer).toBeDefined();
            expect(typeof performanceDashboard.attributionAnalyzer.getAttributionAnalysis).toBe('function');
            expect(typeof performanceDashboard.attributionAnalyzer.getConversionAttribution).toBe('function');
        });

        test('should have insights generator component', () => {
            expect(performanceDashboard.insightsGenerator).toBeDefined();
            expect(typeof performanceDashboard.insightsGenerator.generateAutomatedInsights).toBe('function');
        });

        test('should have cache manager component', () => {
            expect(performanceDashboard.cacheManager).toBeDefined();
            expect(typeof performanceDashboard.cacheManager.getCachedData).toBe('function');
            expect(typeof performanceDashboard.cacheManager.setCachedData).toBe('function');
        });
    });

    describe('Error Handling', () => {
        test('should handle errors gracefully in getCampaignMetrics', async () => {
            // Mock an error in metrics collection
            const originalCollectGA4 = performanceDashboard.metricsCollector.collectGA4Metrics;
            performanceDashboard.metricsCollector.collectGA4Metrics = jest.fn().mockRejectedValue(new Error('API Error'));

            await expect(performanceDashboard.getCampaignMetrics()).rejects.toThrow('API Error');

            // Restore original method
            performanceDashboard.metricsCollector.collectGA4Metrics = originalCollectGA4;
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
});