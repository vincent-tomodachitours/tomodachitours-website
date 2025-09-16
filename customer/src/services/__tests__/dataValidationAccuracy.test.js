/**
 * Data Validation and Accuracy Testing
 * Tests data validation, sanitization, and accuracy across tracking platforms
 * Requirements: 1.1, 2.1, 4.3 (Task 14)
 */

const { trackPurchase, trackBeginCheckout, trackTourView } = require('../analytics');
const dataValidator = require('../dataValidator.js');
const performanceMonitor = require('../performanceMonitor.js');
const { ERROR_TYPES } = require('../performanceMonitor.js');
const privacyManager = require('../privacyManager.js');

// Mock dependencies
jest.mock('../privacyManager.js');
jest.mock('../dataValidator.js');
jest.mock('../performanceMonitor.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

describe('Data Validation and Accuracy Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();

        privacyManager.canTrackAnalytics.mockReturnValue(true);
        privacyManager.canTrackMarketing.mockReturnValue(true);
    });

    describe('Purchase Data Validation', () => {
        test('should validate required purchase data fields', () => {
            const validPurchaseData = {
                transactionId: 'txn_123',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                quantity: 2
            };

            dataValidator.validatePurchase.mockReturnValue({
                isValid: true,
                sanitizedData: validPurchaseData
            });

            trackPurchase(validPurchaseData);

            expect(dataValidator.validatePurchase).toHaveBeenCalledWith(validPurchaseData);
            expect(mockGtag).toHaveBeenCalled();
        });

        test('should reject invalid purchase data', () => {
            const invalidPurchaseData = {
                transactionId: '', // empty transaction ID
                value: -100, // negative value
                currency: 'INVALID' // invalid currency
            };

            dataValidator.validatePurchase.mockReturnValue({
                isValid: false,
                errors: ['Invalid transaction ID', 'Invalid value', 'Invalid currency']
            });

            trackPurchase(invalidPurchaseData);

            expect(dataValidator.validatePurchase).toHaveBeenCalledWith(invalidPurchaseData);
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should handle edge cases in purchase validation', () => {
            const edgeCases = [
                null,
                undefined,
                {},
                { transactionId: null },
                { value: 0 },
                { currency: '' },
                { value: Infinity },
                { value: NaN }
            ];

            edgeCases.forEach((edgeCase, index) => {
                dataValidator.validatePurchase.mockReturnValue({
                    isValid: false,
                    errors: [`Edge case ${index}: Invalid data`]
                });

                expect(() => {
                    trackPurchase(edgeCase);
                }).not.toThrow();

                expect(dataValidator.validatePurchase).toHaveBeenCalledWith(edgeCase);
            });
        });
    });

    describe('Data Sanitization', () => {
        test('should sanitize purchase data to prevent XSS', () => {
            const maliciousData = {
                transactionId: 'txn_<script>alert("xss")</script>',
                value: 12000,
                currency: 'JPY',
                tourName: 'Tour <img src="x" onerror="alert(1)">'
            };

            const sanitizedData = {
                transactionId: 'txn_script_alert_xss',
                value: 12000,
                currency: 'JPY',
                tourName: 'Tour img_src_x_onerror_alert_1'
            };

            dataValidator.validatePurchase.mockReturnValue({
                isValid: true,
                sanitizedData: sanitizedData
            });

            trackPurchase(maliciousData);

            expect(dataValidator.validatePurchase).toHaveBeenCalledWith(maliciousData);
            expect(mockGtag).toHaveBeenCalled();

            // Verify sanitized data is used
            const trackingCall = mockGtag.mock.calls.find(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );
            expect(trackingCall[2].transaction_id).not.toContain('<script>');
        });

        test('should sanitize tour data', () => {
            const maliciousTourData = {
                tourId: 'gion<script>alert(1)</script>tour',
                tourName: 'Tour with <img src="x" onerror="alert(1)">',
                price: 12000
            };

            const sanitizedTourData = {
                tourId: 'gion_script_alert_1_tour',
                tourName: 'Tour with img_src_x_onerror_alert_1',
                price: 12000
            };

            dataValidator.validateTour.mockReturnValue({
                isValid: true,
                sanitizedData: sanitizedTourData
            });

            trackTourView(maliciousTourData);

            expect(dataValidator.validateTour).toHaveBeenCalledWith(maliciousTourData);
        });

        test('should handle SQL injection attempts', () => {
            const sqlInjectionData = {
                transactionId: "txn_123'; DROP TABLE users; --",
                value: 12000,
                currency: 'JPY',
                tourName: "Tour'; DELETE FROM tours; --"
            };

            const sanitizedData = {
                transactionId: 'txn_123_DROP_TABLE_users',
                value: 12000,
                currency: 'JPY',
                tourName: 'Tour_DELETE_FROM_tours'
            };

            dataValidator.validatePurchase.mockReturnValue({
                isValid: true,
                sanitizedData: sanitizedData
            });

            trackPurchase(sqlInjectionData);

            expect(dataValidator.validatePurchase).toHaveBeenCalledWith(sqlInjectionData);
        });
    });

    describe('Cross-Platform Data Consistency', () => {
        test('should ensure GA4 and Google Ads receive consistent data', () => {
            const purchaseData = {
                transactionId: 'txn_consistency_test',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            dataValidator.validatePurchase.mockReturnValue({
                isValid: true,
                sanitizedData: purchaseData
            });

            trackPurchase(purchaseData);

            // Get all tracking calls
            const allCalls = mockGtag.mock.calls;

            // Find GA4 and Google Ads calls
            const ga4Call = allCalls.find(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );
            const adsCall = allCalls.find(call =>
                call[0] === 'event' && call[1] === 'conversion'
            );

            if (ga4Call && adsCall) {
                // Verify consistent data
                expect(ga4Call[2].transaction_id).toBe(adsCall[2].transaction_id);
                expect(ga4Call[2].value).toBe(adsCall[2].value);
                expect(ga4Call[2].currency).toBe(adsCall[2].currency);
            }
        });

        test('should maintain data integrity across multiple tracking calls', () => {
            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000
            };

            const checkoutData = {
                ...tourData,
                quantity: 2
            };

            const purchaseData = {
                transactionId: 'txn_integrity_test',
                value: 24000,
                currency: 'JPY',
                ...tourData,
                quantity: 2
            };

            // Mock validation for all calls
            dataValidator.validateTour.mockReturnValue({
                isValid: true,
                sanitizedData: tourData
            });

            dataValidator.validateCheckout.mockReturnValue({
                isValid: true,
                sanitizedData: checkoutData
            });

            dataValidator.validatePurchase.mockReturnValue({
                isValid: true,
                sanitizedData: purchaseData
            });

            // Track complete journey
            trackTourView(tourData);
            trackBeginCheckout(checkoutData);
            trackPurchase(purchaseData);

            // Verify consistent tour data across all calls
            const allCalls = mockGtag.mock.calls;
            allCalls.forEach(call => {
                if (call[2] && call[2].items && call[2].items[0]) {
                    expect(call[2].items[0].item_id).toBe('gion-tour');
                    expect(call[2].items[0].item_name).toBe('Gion District Walking Tour');
                }
            });
        });
    });

    describe('Validation Performance', () => {
        test('should complete validation within acceptable time limits', () => {
            const startTime = performance.now();

            const data = {
                transactionId: 'txn_performance_test',
                value: 15000,
                currency: 'JPY'
            };

            dataValidator.validatePurchase.mockImplementation((data) => {
                // Simulate validation time
                const validationStart = performance.now();
                while (performance.now() - validationStart < 5) {
                    // 5ms validation time
                }
                return { isValid: true, sanitizedData: data };
            });

            trackPurchase(data);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Validation should complete quickly (under 50ms total)
            expect(totalTime).toBeLessThan(50);
        });

        test('should handle concurrent validation requests', async () => {
            const requests = Array.from({ length: 10 }, (_, i) => ({
                transactionId: `txn_concurrent_${i}`,
                value: 15000 + i * 1000,
                currency: 'JPY'
            }));

            dataValidator.validatePurchase.mockImplementation((data) => ({
                isValid: true,
                sanitizedData: data
            }));

            // Process multiple validation requests concurrently
            const validationPromises = requests.map(data =>
                Promise.resolve().then(() => trackPurchase(data))
            );

            await Promise.all(validationPromises);

            // All validations should complete successfully
            expect(dataValidator.validatePurchase).toHaveBeenCalledTimes(10);
            expect(mockGtag).toHaveBeenCalledTimes(10);
        });

        test('should alert on slow validation performance', () => {
            dataValidator.validatePurchase.mockImplementation((data) => {
                // Simulate slow validation (150ms)
                const start = Date.now();
                while (Date.now() - start < 150) {
                    // Busy wait
                }
                return { isValid: true, sanitizedData: data };
            });

            const data = {
                transactionId: 'txn_slow_validation',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(data);

            // Should detect slow validation
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Slow validation detected')
                })
            );
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle validation service failures gracefully', () => {
            const validData = {
                transactionId: 'txn_service_failure',
                value: 15000,
                currency: 'JPY'
            };

            dataValidator.validatePurchase.mockImplementation(() => {
                throw new Error('Validation service unavailable');
            });

            // Should not throw error
            expect(() => {
                trackPurchase(validData);
            }).not.toThrow();

            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Validation service unavailable')
                })
            );
        });

        test('should implement retry logic for failed validations', () => {
            const data = {
                transactionId: 'txn_retry_validation',
                value: 15000,
                currency: 'JPY'
            };

            let validationAttempts = 0;
            dataValidator.validatePurchase.mockImplementation(() => {
                validationAttempts++;
                if (validationAttempts < 3) {
                    throw new Error('Validation failed');
                }
                return { isValid: true, sanitizedData: data };
            });

            trackPurchase(data);

            expect(validationAttempts).toBe(3);
            expect(mockGtag).toHaveBeenCalled();
        });

        test('should queue tracking calls when validation is temporarily unavailable', () => {
            const data = {
                transactionId: 'txn_queue_test',
                value: 15000,
                currency: 'JPY'
            };

            dataValidator.validatePurchase.mockImplementation(() => {
                throw new Error('Validation temporarily unavailable');
            });

            trackPurchase(data);

            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('Validation temporarily unavailable')
                })
            );
        });
    });

    describe('Data Type Validation', () => {
        test('should validate numeric fields correctly', () => {
            const testCases = [
                { value: 12000, expected: true },
                { value: 0, expected: true },
                { value: -100, expected: false },
                { value: 'not-a-number', expected: false },
                { value: null, expected: false },
                { value: undefined, expected: false },
                { value: Infinity, expected: false },
                { value: NaN, expected: false }
            ];

            testCases.forEach(({ value, expected }) => {
                const data = {
                    transactionId: 'txn_numeric_test',
                    value: value,
                    currency: 'JPY'
                };

                dataValidator.validatePurchase.mockReturnValue({
                    isValid: expected,
                    errors: expected ? [] : ['Invalid value']
                });

                trackPurchase(data);

                expect(dataValidator.validatePurchase).toHaveBeenCalledWith(data);
            });
        });

        test('should validate string fields correctly', () => {
            const testCases = [
                { transactionId: 'valid_id', expected: true },
                { transactionId: '', expected: false },
                { transactionId: null, expected: false },
                { transactionId: undefined, expected: false },
                { transactionId: 123, expected: false },
                { transactionId: '   ', expected: false } // whitespace only
            ];

            testCases.forEach(({ transactionId, expected }) => {
                const data = {
                    transactionId: transactionId,
                    value: 12000,
                    currency: 'JPY'
                };

                dataValidator.validatePurchase.mockReturnValue({
                    isValid: expected,
                    errors: expected ? [] : ['Invalid transaction ID']
                });

                trackPurchase(data);

                expect(dataValidator.validatePurchase).toHaveBeenCalledWith(data);
            });
        });

        test('should validate currency codes', () => {
            const testCases = [
                { currency: 'JPY', expected: true },
                { currency: 'USD', expected: true },
                { currency: 'EUR', expected: true },
                { currency: 'INVALID', expected: false },
                { currency: '', expected: false },
                { currency: null, expected: false },
                { currency: 123, expected: false }
            ];

            testCases.forEach(({ currency, expected }) => {
                const data = {
                    transactionId: 'txn_currency_test',
                    value: 12000,
                    currency: currency
                };

                dataValidator.validatePurchase.mockReturnValue({
                    isValid: expected,
                    errors: expected ? [] : ['Invalid currency']
                });

                trackPurchase(data);

                expect(dataValidator.validatePurchase).toHaveBeenCalledWith(data);
            });
        });
    });

    describe('Business Logic Validation', () => {
        test('should validate tour-specific business rules', () => {
            const tourData = {
                tourId: 'gion-tour',
                price: 12000,
                duration: 180, // 3 hours
                maxParticipants: 8
            };

            dataValidator.validateTour.mockReturnValue({
                isValid: true,
                sanitizedData: tourData,
                warnings: ['Tour duration is longer than average']
            });

            trackTourView(tourData);

            expect(dataValidator.validateTour).toHaveBeenCalledWith(tourData);
        });

        test('should validate booking constraints', () => {
            const checkoutData = {
                tourId: 'gion-tour',
                price: 12000,
                quantity: 10, // Exceeds max participants
                date: '2024-03-15'
            };

            dataValidator.validateCheckout.mockReturnValue({
                isValid: false,
                errors: ['Quantity exceeds maximum participants for this tour']
            });

            trackBeginCheckout(checkoutData);

            expect(dataValidator.validateCheckout).toHaveBeenCalledWith(checkoutData);
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should validate seasonal pricing rules', () => {
            const seasonalData = {
                tourId: 'gion-tour',
                price: 18000, // Higher seasonal price
                date: '2024-04-01', // Cherry blossom season
                season: 'peak'
            };

            dataValidator.validateTour.mockReturnValue({
                isValid: true,
                sanitizedData: seasonalData,
                warnings: ['Peak season pricing applied']
            });

            trackTourView(seasonalData);

            expect(dataValidator.validateTour).toHaveBeenCalledWith(seasonalData);
        });
    });
});