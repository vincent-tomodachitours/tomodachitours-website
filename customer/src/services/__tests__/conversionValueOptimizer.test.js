/**
 * Tests for Conversion Value Optimizer Service
 * 
 * Tests dynamic pricing, discount validation, Target ROAS optimization,
 * and revenue attribution reporting functionality.
 */

import conversionValueOptimizer from '../conversionValueOptimizer.js';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
    jest.resetModules();
    process.env = {
        ...originalEnv,
        REACT_APP_TARGET_ROAS_ENABLED: 'true',
        REACT_APP_REVENUE_ATTRIBUTION_ENABLED: 'true'
    };

    // Enable features for testing
    conversionValueOptimizer.roasOptimizationEnabled = true;
    conversionValueOptimizer.revenueAttributionEnabled = true;
});

afterEach(() => {
    process.env = originalEnv;
});

describe('ConversionValueOptimizer', () => {
    describe('calculateDynamicPrice', () => {
        test('should calculate price with percentage discount', () => {
            const priceData = {
                basePrice: 10000,
                quantity: 1,
                currency: 'JPY'
            };

            const discountData = {
                type: 'percentage',
                value: 20 // 20% discount
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, discountData);

            expect(result.success).toBe(true);
            expect(result.pricing.originalTotal).toBe(10000);
            expect(result.pricing.finalPrice).toBe(8000);
            expect(result.pricing.discountAmount).toBe(2000);
            expect(result.pricing.discountPercentage).toBe(20);
        });

        test('should calculate price with fixed discount', () => {
            const priceData = {
                basePrice: 10000,
                quantity: 1,
                currency: 'JPY'
            };

            const discountData = {
                type: 'fixed',
                value: 1500 // 1500 JPY discount
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, discountData);

            expect(result.success).toBe(true);
            expect(result.pricing.originalTotal).toBe(10000);
            expect(result.pricing.finalPrice).toBe(8500);
            expect(result.pricing.discountAmount).toBe(1500);
            expect(result.pricing.discountPercentage).toBe(15);
        });

        test('should handle multiple quantity pricing', () => {
            const priceData = {
                basePrice: 5000,
                quantity: 3,
                currency: 'JPY'
            };

            const discountData = {
                type: 'percentage',
                value: 10
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, discountData);

            expect(result.success).toBe(true);
            expect(result.pricing.originalTotal).toBe(15000);
            expect(result.pricing.finalPrice).toBe(13500);
            expect(result.pricing.discountAmount).toBe(1500);
        });

        test('should apply pricing rules', () => {
            const priceData = {
                basePrice: 4567,
                quantity: 1,
                currency: 'JPY'
            };

            const options = {
                pricingRules: [
                    { type: 'minimum', value: 5000 },
                    { type: 'round', value: 100 }
                ]
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, null, options);

            expect(result.success).toBe(true);
            expect(result.pricing.finalPrice).toBe(5000); // Applied minimum rule
        });

        test('should handle maximum discount limits', () => {
            const priceData = {
                basePrice: 10000,
                quantity: 1,
                currency: 'JPY'
            };

            const discountData = {
                type: 'percentage',
                value: 50,
                maxDiscountAmount: 3000
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData, discountData);

            expect(result.success).toBe(true);
            expect(result.pricing.discountAmount).toBe(3000); // Limited by maxDiscountAmount
            expect(result.pricing.finalPrice).toBe(7000);
        });

        test('should return error for invalid price data', () => {
            const result = conversionValueOptimizer.calculateDynamicPrice(null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid base price data');
        });

        test('should include Target ROAS data when enabled', () => {
            const priceData = {
                basePrice: 15000,
                quantity: 1,
                currency: 'JPY'
            };

            const result = conversionValueOptimizer.calculateDynamicPrice(priceData);

            expect(result.success).toBe(true);
            expect(result.pricing.roasValue).toBe(15000);
            expect(result.pricing.roasCategory).toBe('medium_value');
            expect(result.pricing.profitMargin).toBeGreaterThan(0);
        });
    });

    describe('validateConversionValue', () => {
        test('should validate positive conversion values', () => {
            const result = conversionValueOptimizer.validateConversionValue(5000);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.correctedValue).toBe(5000);
        });

        test('should reject negative values', () => {
            const result = conversionValueOptimizer.validateConversionValue(-100);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Conversion value cannot be negative');
        });

        test('should reject non-numeric values', () => {
            const result = conversionValueOptimizer.validateConversionValue('invalid');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Conversion value must be a valid number');
        });

        test('should warn about values below minimum threshold', () => {
            const result = conversionValueOptimizer.validateConversionValue(500);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Conversion value 500 is below minimum threshold 1000');
            expect(result.correctedValue).toBe(1000);
        });

        test('should warn about values above maximum threshold', () => {
            const result = conversionValueOptimizer.validateConversionValue(150000);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Conversion value 150000 exceeds maximum threshold 100000');
            expect(result.correctedValue).toBe(100000);
        });

        test('should validate discount percentage limits', () => {
            const context = {
                discountPercentage: 95
            };

            const result = conversionValueOptimizer.validateConversionValue(1000, context);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Discount percentage 95% exceeds maximum allowed 90%');
        });

        test('should detect price calculation inconsistencies', () => {
            const context = {
                originalPrice: 10000,
                discountAmount: 2000
            };

            const result = conversionValueOptimizer.validateConversionValue(7500, context);

            expect(result.warnings.some(w => w.includes('Price calculation inconsistency'))).toBe(true);
        });
    });

    describe('trackRevenueAttribution', () => {
        test('should track revenue attribution successfully', () => {
            const conversionData = {
                conversionId: 'test_conversion_123',
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
                profitMargin: 65,
                roasValue: 8000
            };

            const result = conversionValueOptimizer.trackRevenueAttribution(conversionData, pricingData);

            expect(result.success).toBe(true);
            expect(result.attributionId).toBeDefined();
            expect(result.record.revenue).toBe(8000);
            expect(result.record.campaign).toBe('summer_tours');
            expect(result.record.keyword).toBe('kyoto tour booking');
        });

        test('should handle missing attribution data gracefully', () => {
            const conversionData = {};
            const pricingData = {
                finalPrice: 5000,
                originalTotal: 5000,
                discountAmount: 0
            };

            const result = conversionValueOptimizer.trackRevenueAttribution(conversionData, pricingData);

            expect(result.success).toBe(true);
            expect(result.record.campaign).toBe('unknown');
            expect(result.record.keyword).toBe('unknown');
        });

        test('should return failure when revenue attribution is disabled', () => {
            process.env.REACT_APP_REVENUE_ATTRIBUTION_ENABLED = 'false';

            // Need to re-import to get updated environment
            jest.resetModules();
            const { default: optimizer } = require('../conversionValueOptimizer.js');

            const result = optimizer.trackRevenueAttribution({}, {});

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Revenue attribution disabled');
        });
    });

    describe('generateValueReport', () => {
        beforeEach(() => {
            // Clear any existing attribution data
            conversionValueOptimizer.attributionData.clear();
        });

        test('should generate comprehensive revenue report', () => {
            // Add some test attribution data
            const testData = [
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

            testData.forEach((data, index) => {
                conversionValueOptimizer.attributionData.set(`test_key_${index}`, data);
            });

            const result = conversionValueOptimizer.generateValueReport();

            expect(result.success).toBe(true);
            expect(result.report.summary.totalRevenue).toBe(20000);
            expect(result.report.summary.totalConversions).toBe(2);
            expect(result.report.summary.averageOrderValue).toBe(10000);
            expect(result.report.byCampaign).toHaveLength(2);
            expect(result.report.byProduct).toHaveLength(2);
        });

        test('should filter report by date range', () => {
            const oldDate = new Date('2023-01-01').toISOString();
            const newDate = new Date().toISOString();

            conversionValueOptimizer.attributionData.set('old_conversion', {
                revenue: 5000,
                campaign: 'old_campaign',
                timestamp: oldDate
            });

            conversionValueOptimizer.attributionData.set('new_conversion', {
                revenue: 8000,
                campaign: 'new_campaign',
                timestamp: newDate
            });

            const filters = {
                dateFrom: '2024-01-01'
            };

            const result = conversionValueOptimizer.generateValueReport(filters);

            expect(result.success).toBe(true);
            expect(result.report.summary.totalRevenue).toBe(8000);
            expect(result.report.summary.totalConversions).toBe(1);
        });

        test('should handle empty attribution data', () => {
            const result = conversionValueOptimizer.generateValueReport();

            expect(result.success).toBe(true);
            expect(result.report.summary.totalRevenue).toBe(0);
            expect(result.report.summary.totalConversions).toBe(0);
            expect(result.report.byCampaign).toHaveLength(0);
        });
    });

    describe('getTargetROASData', () => {
        test('should return ROAS optimization data when enabled', () => {
            const conversionData = {
                conversionValue: 15000,
                isRepeatCustomer: true
            };

            const pricingData = {
                finalPrice: 15000,
                currency: 'JPY',
                profitMargin: 70
            };

            const result = conversionValueOptimizer.getTargetROASData(conversionData, pricingData);

            expect(result).toBeDefined();
            expect(result.conversionValue).toBe(15000);
            expect(result.currency).toBe('JPY');
            expect(result.roasCategory).toBe('medium_value');
            expect(result.customerLifetimeValue).toBeGreaterThan(15000);
            expect(result.optimizationRecommendations).toBeDefined();
        });

        test('should return null when Target ROAS is disabled', () => {
            process.env.REACT_APP_TARGET_ROAS_ENABLED = 'false';

            // Need to re-import to get updated environment
            jest.resetModules();
            const { default: optimizer } = require('../conversionValueOptimizer.js');

            const result = optimizer.getTargetROASData({}, {});

            expect(result).toBeNull();
        });
    });

    describe('ROAS categorization', () => {
        test('should categorize conversion values correctly', () => {
            // Test high value
            const highValueResult = conversionValueOptimizer.calculateDynamicPrice({
                basePrice: 25000,
                quantity: 1,
                currency: 'JPY'
            });
            expect(highValueResult.pricing.roasCategory).toBe('high_value');

            // Test medium value
            const mediumValueResult = conversionValueOptimizer.calculateDynamicPrice({
                basePrice: 15000,
                quantity: 1,
                currency: 'JPY'
            });
            expect(mediumValueResult.pricing.roasCategory).toBe('medium_value');

            // Test low value
            const lowValueResult = conversionValueOptimizer.calculateDynamicPrice({
                basePrice: 7000,
                quantity: 1,
                currency: 'JPY'
            });
            expect(lowValueResult.pricing.roasCategory).toBe('low_value');

            // Test minimal value
            const minimalValueResult = conversionValueOptimizer.calculateDynamicPrice({
                basePrice: 3000,
                quantity: 1,
                currency: 'JPY'
            });
            expect(minimalValueResult.pricing.roasCategory).toBe('minimal_value');
        });
    });

    describe('Error handling', () => {
        test('should handle calculation errors gracefully', () => {
            const result = conversionValueOptimizer.calculateDynamicPrice({
                basePrice: 'invalid',
                quantity: 1
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.pricing).toBeNull();
        });

        test('should handle attribution tracking errors', () => {
            // Mock console.error to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = conversionValueOptimizer.trackRevenueAttribution(null, null);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            consoleSpy.mockRestore();
        });

        test('should handle report generation errors', () => {
            // Mock console.error to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Force an error by corrupting internal data
            const originalMap = conversionValueOptimizer.attributionData;
            conversionValueOptimizer.attributionData = null;

            const result = conversionValueOptimizer.generateValueReport();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

            // Restore
            conversionValueOptimizer.attributionData = originalMap;
            consoleSpy.mockRestore();
        });
    });
});