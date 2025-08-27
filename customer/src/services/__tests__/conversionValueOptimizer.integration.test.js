/**
 * Integration tests for Conversion Value Optimizer with GTM Service
 * 
 * Tests the integration between conversion value optimization and GTM tracking
 */

import conversionValueOptimizer from '../conversionValueOptimizer.js';
import gtmService from '../gtmService.js';

// Mock GTM service methods
jest.mock('../gtmService.js', () => ({
    trackConversion: jest.fn(),
    trackPurchaseConversion: jest.fn(),
    pushEvent: jest.fn(),
    isInitialized: true,
    debugMode: false
}));

describe('ConversionValueOptimizer Integration', () => {
    beforeEach(() => {
        // Enable features for testing
        conversionValueOptimizer.roasOptimizationEnabled = true;
        conversionValueOptimizer.revenueAttributionEnabled = true;

        // Clear mock calls
        jest.clearAllMocks();
    });

    describe('GTM Integration', () => {
        test('should optimize conversion values for GTM tracking', () => {
            const priceData = {
                basePrice: 10000,
                quantity: 1,
                currency: 'JPY'
            };

            const discountData = {
                type: 'percentage',
                value: 20
            };

            const pricingContext = {
                basePrice: 10000,
                quantity: 1,
                originalPrice: 10000,
                discount: discountData,
                campaign: 'summer_tours',
                keyword: 'kyoto tour',
                gclid: 'test_gclid_123'
            };

            // Calculate optimized pricing
            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, discountData);

            expect(result.success).toBe(true);
            expect(result.pricing.finalPrice).toBe(8000);
            expect(result.pricing.discountAmount).toBe(2000);
            expect(result.pricing.roasValue).toBe(8000);
            expect(result.pricing.roasCategory).toBe('low_value');

            // Verify ROAS data is available for GTM
            const roasData = conversionValueOptimizer.getTargetROASData(
                { conversionValue: result.pricing.finalPrice },
                result.pricing
            );

            expect(roasData).toBeDefined();
            expect(roasData.conversionValue).toBe(8000);
            expect(roasData.roasCategory).toBe('low_value');
        });

        test('should track revenue attribution for purchase conversions', () => {
            const conversionData = {
                conversionId: 'test_purchase_123',
                campaign: 'summer_tours',
                adGroup: 'kyoto_tours',
                keyword: 'kyoto tour booking',
                gclid: 'test_gclid_123',
                productId: 'tour_001',
                productName: 'Kyoto Morning Tour',
                productCategory: 'tour'
            };

            const pricingData = {
                finalPrice: 8000,
                originalTotal: 10000,
                discountAmount: 2000,
                profitMargin: 60,
                roasValue: 8000
            };

            const result = conversionValueOptimizer.trackRevenueAttribution(conversionData, pricingData);

            expect(result.success).toBe(true);
            expect(result.attributionId).toBeDefined();
            expect(result.record.revenue).toBe(8000);
            expect(result.record.campaign).toBe('summer_tours');
            expect(result.record.keyword).toBe('kyoto tour booking');
        });

        test('should generate comprehensive revenue reports', () => {
            // Add test data
            const testAttributions = [
                {
                    revenue: 8000,
                    campaign: 'summer_tours',
                    keyword: 'kyoto tour',
                    productId: 'tour_001',
                    productName: 'Kyoto Tour',
                    productCategory: 'tour',
                    discountAmount: 1000,
                    timestamp: new Date().toISOString()
                },
                {
                    revenue: 12000,
                    campaign: 'winter_tours',
                    keyword: 'osaka tour',
                    productId: 'tour_002',
                    productName: 'Osaka Tour',
                    productCategory: 'tour',
                    discountAmount: 500,
                    timestamp: new Date().toISOString()
                }
            ];

            // Clear existing data and add test data
            conversionValueOptimizer.attributionData.clear();
            testAttributions.forEach((data, index) => {
                conversionValueOptimizer.attributionData.set(`test_key_${index}`, data);
            });

            const report = conversionValueOptimizer.generateValueReport();

            expect(report.success).toBe(true);
            expect(report.report.summary.totalRevenue).toBe(20000);
            expect(report.report.summary.totalConversions).toBe(2);
            expect(report.report.summary.averageOrderValue).toBe(10000);
            expect(report.report.byCampaign).toHaveLength(2);
            expect(report.report.byProduct).toHaveLength(2);
        });

        test('should validate conversion values for accuracy', () => {
            // Test valid conversion value
            const validResult = conversionValueOptimizer.validateConversionValue(8000, {
                originalPrice: 10000,
                discountAmount: 2000,
                discountPercentage: 20
            });

            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toHaveLength(0);

            // Test invalid conversion value
            const invalidResult = conversionValueOptimizer.validateConversionValue(-100);

            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors).toContain('Conversion value cannot be negative');

            // Test excessive discount
            const excessiveDiscountResult = conversionValueOptimizer.validateConversionValue(1000, {
                discountPercentage: 95
            });

            expect(excessiveDiscountResult.isValid).toBe(false);
            expect(excessiveDiscountResult.errors).toContain('Discount percentage 95% exceeds maximum allowed 90%');
        });

        test('should handle complex pricing scenarios', () => {
            const complexPriceData = {
                basePrice: 7500,
                quantity: 2,
                currency: 'JPY'
            };

            const complexDiscountData = {
                type: 'fixed',
                value: 3000,
                maxDiscountAmount: 2500
            };

            const complexOptions = {
                pricingRules: [
                    { type: 'minimum', value: 10000 },
                    { type: 'round', value: 500 }
                ]
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(
                complexPriceData,
                complexDiscountData,
                complexOptions
            );

            expect(result.success).toBe(true);
            expect(result.pricing.originalTotal).toBe(15000);
            expect(result.pricing.discountAmount).toBe(2500); // Limited by maxDiscountAmount
            expect(result.pricing.finalPrice).toBe(12500); // After discount
            expect(result.pricing.roasCategory).toBe('medium_value');
        });

        test('should provide Target ROAS optimization recommendations', () => {
            const highValuePricing = {
                finalPrice: 25000,
                currency: 'JPY',
                profitMargin: 70,
                discountPercentage: 10
            };

            const roasData = conversionValueOptimizer.getTargetROASData(
                { conversionValue: 25000, isRepeatCustomer: true },
                highValuePricing
            );

            expect(roasData).toBeDefined();
            expect(roasData.conversionValue).toBe(25000);
            expect(roasData.roasCategory).toBe('high_value');
            expect(roasData.customerLifetimeValue).toBeGreaterThan(25000);
            expect(roasData.optimizationRecommendations).toBeDefined();
            expect(Array.isArray(roasData.optimizationRecommendations)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing pricing data gracefully', () => {
            const result = conversionValueOptimizer.calculateDynamicPrice(null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid base price data');
        });

        test('should handle attribution tracking errors', () => {
            const result = conversionValueOptimizer.trackRevenueAttribution(null, null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid conversion data');
        });

        test('should handle report generation with no data', () => {
            // Clear all attribution data
            conversionValueOptimizer.attributionData.clear();

            const result = conversionValueOptimizer.generateValueReport();

            expect(result.success).toBe(true);
            expect(result.report.summary.totalRevenue).toBe(0);
            expect(result.report.summary.totalConversions).toBe(0);
            expect(result.report.byCampaign).toHaveLength(0);
        });
    });

    describe('Performance', () => {
        test('should handle large datasets efficiently', () => {
            // Clear existing data
            conversionValueOptimizer.attributionData.clear();

            // Add large dataset
            const startTime = Date.now();
            for (let i = 0; i < 1000; i++) {
                conversionValueOptimizer.attributionData.set(`perf_test_${i}`, {
                    revenue: Math.random() * 20000 + 5000,
                    campaign: `campaign_${i % 10}`,
                    keyword: `keyword_${i % 50}`,
                    productId: `product_${i % 5}`,
                    productName: `Product ${i % 5}`,
                    productCategory: 'tour',
                    discountAmount: Math.random() * 2000,
                    timestamp: new Date().toISOString()
                });
            }

            const report = conversionValueOptimizer.generateValueReport();
            const endTime = Date.now();

            expect(report.success).toBe(true);
            expect(report.report.summary.totalConversions).toBe(1000);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });
});