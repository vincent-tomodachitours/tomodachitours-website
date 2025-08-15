/**
 * Tracking Validation Tests
 * Comprehensive tests for data validation for all conversion and event tracking
 * Requirements: 1.1, 2.1, 4.3 (Task 9)
 */

import dataValidator from '../dataValidator.js';
import performanceMonitor, { ERROR_TYPES } from '../performanceMonitor.js';
import { trackPurchase, trackBeginCheckout, trackTourView } from '../analytics/ecommerceTracking.js';
import { trackGoogleAdsPurchase, trackGoogleAdsBeginCheckout } from '../googleAdsTracker.js';

// Mock dependencies
jest.mock('../privacyManager.js', () => ({
    canTrackAnalytics: jest.fn(() => true)
}));

jest.mock('../performanceMonitor.js', () => ({
    handleError: jest.fn(),
    recordMetric: jest.fn(),
    recordTrackingCallTime: jest.fn(),
    ERROR_TYPES: {
        VALIDATION_ERROR: 'validation_error',
        TRACKING_FAILURE: 'tracking_failure'
    }
}));

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

describe('Tracking Data Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();
    });

    describe('Purchase Event Validation', () => {
        test('should validate required purchase data fields', () => {
            const validPurchaseData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                quantity: 2
            };

            const invalidPurchaseData = [
                { /* missing all fields */ },
                { transactionId: '' }, // empty transaction ID
                { transactionId: 'txn_123', value: -100 }, // negative value
                { transactionId: 'txn_123', value: 'not-a-number' }, // invalid value type
                { transactionId: 'txn_123', value: 15000, currency: 'INVALID' }, // invalid currency
                { transactionId: 'txn_123', value: 15000, quantity: -1 }, // negative quantity
            ];

            // Valid data should pass validation
            expect(() => {
                dataValidator.validatePurchase(validPurchaseData);
            }).not.toThrow();

            // Invalid data should trigger validation errors
            invalidPurchaseData.forEach((data, index) => {
                expect(() => {
                    dataValidator.validatePurchase(data);
                }).toThrow();
            });
        });

        test('should sanitize purchase data to prevent XSS', () => {
            const maliciousPurchaseData = {
                transactionId: 'txn_<script>alert("xss")</script>',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion<script>alert(1)</script>tour',
                tourName: 'Tour with <img src="x" onerror="alert(1)">',
                customerName: 'javascript:alert("xss")',
                customerEmail: 'test<script>@example.com'
            };

            const sanitizedData = dataValidator.sanitizePurchaseData(maliciousPurchaseData);

            expect(sanitizedData.transactionId).not.toContain('<script>');
            expect(sanitizedData.tourId).not.toContain('<script>');
            expect(sanitizedData.tourName).not.toContain('<img');
            expect(sanitizedData.customerName).not.toContain('javascript:');
            expect(sanitizedData.customerEmail).not.toContain('<script>');
        });

        test('should validate purchase tracking calls with performance monitoring', () => {
            const validData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            trackPurchase(validData);

            // Should record tracking call performance
            expect(performanceMonitor.recordTrackingCallTime).toHaveBeenCalledWith(
                'purchase',
                expect.any(Number)
            );

            // Should not trigger validation errors
            expect(performanceMonitor.handleError).not.toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.any(Object)
            );
        });
    });

    describe('Tour View Event Validation', () => {
        test('should validate tour view data structure', () => {
            const validTourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                currency: 'JPY',
                category: 'walking_tour',
                duration: 180
            };

            const invalidTourData = [
                { /* missing fields */ },
                { tourId: '', tourName: 'Valid Name' }, // empty tour ID
                { tourId: 'gion-tour', price: 'free' }, // invalid price type
                { tourId: 'gion-tour', price: -1000 }, // negative price
                { tourId: 'gion-tour', duration: 'all-day' }, // invalid duration type
                { tourId: 'gion-tour', category: 'invalid_category' } // invalid category
            ];

            // Valid data should pass
            expect(() => {
                dataValidator.validateTour(validTourData);
            }).not.toThrow();

            // Invalid data should fail
            invalidTourData.forEach(data => {
                expect(() => {
                    dataValidator.validateTour(data);
                }).toThrow();
            });
        });

        test('should handle missing tour data gracefully', () => {
            // Should not throw errors for undefined/null data
            expect(() => trackTourView(null)).not.toThrow();
            expect(() => trackTourView(undefined)).not.toThrow();
            expect(() => trackTourView({})).not.toThrow();

            // Should trigger appropriate error handling
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Invalid tour data')
                })
            );
        });
    });

    describe('Checkout Event Validation', () => {
        test('should validate checkout data completeness', () => {
            const validCheckoutData = {
                tourId: 'gion-tour',
                price: 12000,
                currency: 'JPY',
                quantity: 2,
                date: '2024-03-15',
                participants: 2
            };

            const incompleteCheckoutData = [
                { tourId: 'gion-tour' }, // missing price
                { tourId: 'gion-tour', price: 12000 }, // missing currency
                { tourId: 'gion-tour', price: 12000, currency: 'JPY', quantity: 0 }, // zero quantity
                { tourId: 'gion-tour', price: 12000, currency: 'JPY', date: 'invalid-date' } // invalid date
            ];

            expect(() => {
                dataValidator.validateCheckout(validCheckoutData);
            }).not.toThrow();

            incompleteCheckoutData.forEach(data => {
                expect(() => {
                    dataValidator.validateCheckout(data);
                }).toThrow();
            });
        });

        test('should validate checkout flow with tracking', () => {
            const checkoutData = {
                tourId: 'gion-tour',
                price: 12000,
                currency: 'JPY',
                quantity: 1
            };

            trackBeginCheckout(checkoutData);

            // Should validate data before tracking
            expect(performanceMonitor.recordTrackingCallTime).toHaveBeenCalledWith(
                'begin_checkout',
                expect.any(Number)
            );
        });
    });

    describe('Google Ads Conversion Validation', () => {
        test('should validate Google Ads conversion data', () => {
            const validConversionData = {
                value: 15000,
                currency: 'JPY',
                transactionId: 'txn_123',
                conversionLabel: 'purchase_conversion'
            };

            const invalidConversionData = [
                { value: 'invalid' }, // non-numeric value
                { value: 15000, currency: 'INVALID' }, // invalid currency
                { value: 15000, currency: 'JPY', transactionId: '' }, // empty transaction ID
                { value: 15000, currency: 'JPY', conversionLabel: null } // null conversion label
            ];

            expect(() => {
                dataValidator.validateGoogleAdsConversion(validConversionData);
            }).not.toThrow();

            invalidConversionData.forEach(data => {
                expect(() => {
                    dataValidator.validateGoogleAdsConversion(data);
                }).toThrow();
            });
        });

        test('should handle Google Ads tracking failures gracefully', () => {
            const conversionData = {
                value: 15000,
                currency: 'JPY',
                transactionId: 'txn_123'
            };

            // Mock gtag to throw error
            mockGtag.mockImplementation(() => {
                throw new Error('Google Ads script not loaded');
            });

            // Should handle tracking failure gracefully
            expect(() => {
                trackGoogleAdsPurchase(conversionData);
            }).not.toThrow();

            // Should record tracking failure
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.TRACKING_FAILURE,
                expect.objectContaining({
                    message: expect.stringContaining('Google Ads')
                })
            );
        });
    });

    describe('Cross-Platform Data Consistency', () => {
        test('should ensure GA4 and Google Ads receive consistent data', () => {
            const purchaseData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour'
            };

            trackPurchase(purchaseData);

            // Check that both GA4 and Google Ads tracking were called
            const ga4Calls = mockGtag.mock.calls.filter(call => call[0] === 'event' && call[1] === 'purchase');
            const googleAdsCalls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'conversion'
            );

            expect(ga4Calls.length).toBeGreaterThan(0);
            expect(googleAdsCalls.length).toBeGreaterThan(0);

            // Verify data consistency between platforms
            if (ga4Calls.length > 0 && googleAdsCalls.length > 0) {
                const ga4Data = ga4Calls[0][2];
                const googleAdsData = googleAdsCalls[0][2];

                expect(ga4Data.transaction_id).toBe(googleAdsData.transaction_id);
                expect(ga4Data.value).toBe(googleAdsData.value);
                expect(ga4Data.currency).toBe(googleAdsData.currency);
            }
        });

        test('should validate attribution data consistency', () => {
            const purchaseData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            // Mock attribution data
            const mockAttributionData = {
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'gion_tour_2024',
                gclid: 'abc123'
            };

            // Set up attribution context
            sessionStorage.setItem('attribution_data', JSON.stringify(mockAttributionData));

            trackPurchase(purchaseData);

            // Verify attribution data is included in tracking calls
            const trackingCalls = mockGtag.mock.calls;
            const callWithAttribution = trackingCalls.find(call =>
                call[2] && call[2].utm_source
            );

            expect(callWithAttribution).toBeDefined();
            if (callWithAttribution) {
                expect(callWithAttribution[2].utm_source).toBe('google');
                expect(callWithAttribution[2].gclid).toBe('abc123');
            }
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should implement retry logic for failed validations', () => {
            const invalidData = {
                transactionId: '', // Invalid
                value: 'not-a-number' // Invalid
            };

            let validationAttempts = 0;
            const originalValidate = dataValidator.validatePurchase;

            dataValidator.validatePurchase = jest.fn().mockImplementation((data) => {
                validationAttempts++;
                if (validationAttempts < 3) {
                    throw new Error('Validation failed');
                }
                return originalValidate.call(dataValidator, {
                    ...data,
                    transactionId: 'txn_fixed',
                    value: 15000
                });
            });

            // Should retry validation on failure
            expect(() => {
                trackPurchase(invalidData);
            }).not.toThrow();

            expect(validationAttempts).toBe(3);
        });

        test('should queue tracking calls when validation service is unavailable', () => {
            const validData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY'
            };

            // Mock validation service failure
            const originalValidate = dataValidator.validatePurchase;
            dataValidator.validatePurchase = jest.fn().mockImplementation(() => {
                throw new Error('Validation service unavailable');
            });

            // Should queue for later retry
            trackPurchase(validData);

            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Validation service unavailable')
                })
            );

            // Restore original function
            dataValidator.validatePurchase = originalValidate;
        });

        test('should handle concurrent validation requests', async () => {
            const requests = Array.from({ length: 10 }, (_, i) => ({
                transactionId: `txn_${i}`,
                value: 15000 + i * 1000,
                currency: 'JPY',
                tourId: 'gion-tour'
            }));

            // Process multiple validation requests concurrently
            const validationPromises = requests.map(data =>
                Promise.resolve().then(() => dataValidator.validatePurchase(data))
            );

            await expect(Promise.all(validationPromises)).resolves.not.toThrow();

            // All validations should complete successfully
            expect(performanceMonitor.recordMetric).toHaveBeenCalledWith(
                'validation_time',
                expect.objectContaining({
                    dataType: 'purchase'
                })
            );
        });
    });

    describe('Performance Impact Validation', () => {
        test('should monitor validation performance impact', () => {
            const startTime = performance.now();

            const data = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            dataValidator.validatePurchase(data);

            const endTime = performance.now();
            const validationTime = endTime - startTime;

            // Validation should complete quickly (under 10ms)
            expect(validationTime).toBeLessThan(10);

            // Should record performance metrics
            expect(performanceMonitor.recordMetric).toHaveBeenCalledWith(
                'validation_time',
                expect.objectContaining({
                    validationTime: expect.any(Number),
                    dataType: 'purchase'
                })
            );
        });

        test('should alert on slow validation performance', () => {
            // Mock slow validation
            const originalNow = performance.now;
            let callCount = 0;
            performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 150; // 150ms validation time
            });

            const data = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY'
            };

            dataValidator.validatePurchase(data);

            // Should alert on slow validation
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Slow validation detected')
                })
            );

            performance.now = originalNow;
        });

        test('should batch validation operations for efficiency', () => {
            const batchData = Array.from({ length: 5 }, (_, i) => ({
                transactionId: `txn_${i}`,
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour'
            }));

            const startTime = performance.now();

            // Validate batch
            batchData.forEach(data => dataValidator.validatePurchase(data));

            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const averageTime = totalTime / batchData.length;

            // Average validation time should be reasonable
            expect(averageTime).toBeLessThan(5);

            // Should record batch metrics
            expect(performanceMonitor.recordMetric).toHaveBeenCalledWith(
                'validation_time',
                expect.objectContaining({
                    dataType: 'purchase',
                    batchSize: 1 // Called once per item
                })
            );
        });
    });
});

describe('Tracking Script Load Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should validate tracking script loading success', () => {
        // Mock successful script load
        const mockScript = {
            src: 'https://googletagmanager.com/gtag/js',
            onload: null,
            onerror: null
        };

        document.createElement = jest.fn().mockReturnValue(mockScript);
        document.head.appendChild = jest.fn();

        // Simulate script load completion
        setTimeout(() => {
            if (mockScript.onload) mockScript.onload();
        }, 100);

        // Should record successful script load
        expect(performanceMonitor.recordMetric).toHaveBeenCalledWith(
            'script_load_time',
            expect.objectContaining({
                script: expect.stringContaining('gtag'),
                success: true
            })
        );
    });

    test('should handle script loading failures', () => {
        const mockScript = {
            src: 'https://googletagmanager.com/gtag/js',
            onload: null,
            onerror: null
        };

        document.createElement = jest.fn().mockReturnValue(mockScript);
        document.head.appendChild = jest.fn();

        // Simulate script load failure
        setTimeout(() => {
            if (mockScript.onerror) {
                mockScript.onerror(new Error('Script load failed'));
            }
        }, 100);

        // Should handle script load failure
        expect(performanceMonitor.handleError).toHaveBeenCalledWith(
            ERROR_TYPES.TRACKING_FAILURE,
            expect.objectContaining({
                message: expect.stringContaining('Script load failed')
            })
        );
    });

    test('should validate script load timeouts', (done) => {
        const mockScript = {
            src: 'https://googletagmanager.com/gtag/js',
            onload: null,
            onerror: null
        };

        document.createElement = jest.fn().mockReturnValue(mockScript);
        document.head.appendChild = jest.fn();

        // Simulate script load timeout (don't call onload or onerror)
        setTimeout(() => {
            // Should detect timeout
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.TRACKING_FAILURE,
                expect.objectContaining({
                    message: expect.stringContaining('timeout')
                })
            );
            done();
        }, 11000); // Wait longer than timeout threshold
    }, 12000);
}); 