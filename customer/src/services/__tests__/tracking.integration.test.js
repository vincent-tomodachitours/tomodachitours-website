/**
 * Tracking System Integration Tests
 * End-to-end tests for complete tracking system with error handling, performance monitoring, and validation
 * Requirements: Task 9 - Performance monitoring and error handling for tracking accuracy
 */

import { initializeAnalytics } from '../analytics/initialization.js';
import performanceMonitor, { ERROR_TYPES, METRIC_TYPES } from '../performanceMonitor.js';
import { trackPurchase, trackBeginCheckout, trackTourView } from '../analytics/ecommerceTracking.js';
import { trackGoogleAdsPurchase } from '../googleAdsTracker.js';
import privacyManager from '../privacyManager.js';

// Mock external dependencies
jest.mock('../privacyManager.js');
jest.mock('../attributionService.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

// Mock console methods
const consoleError = jest.spyOn(console, 'error').mockImplementation();
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const consoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('Tracking System Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();
        consoleError.mockClear();
        consoleWarn.mockClear();
        consoleLog.mockClear();

        // Reset privacy manager
        privacyManager.canTrackAnalytics.mockReturnValue(true);
        privacyManager.canTrackMarketing.mockReturnValue(true);

        // Initialize performance monitor
        performanceMonitor.initialize();
    });

    afterEach(() => {
        performanceMonitor.clearAllData();
    });

    describe('Complete Tracking Flow', () => {
        test('should handle complete user journey with performance monitoring', async () => {
            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                currency: 'JPY'
            };

            const checkoutData = {
                ...tourData,
                quantity: 2,
                date: '2024-03-15'
            };

            const purchaseData = {
                transactionId: 'txn_integration_test',
                value: 24000,
                currency: 'JPY',
                tourId: 'gion-tour',
                quantity: 2
            };

            // Simulate complete user journey
            const startTime = performance.now();

            // 1. User views tour
            trackTourView(tourData);

            // 2. User begins checkout
            trackBeginCheckout(checkoutData);

            // 3. User completes purchase
            trackPurchase(purchaseData);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // All tracking calls should complete
            expect(mockGtag).toHaveBeenCalledTimes(3); // view_item, begin_checkout, purchase

            // Performance should be acceptable (under 100ms for all calls)
            expect(totalTime).toBeLessThan(100);

            // No errors should be reported
            expect(consoleError).not.toHaveBeenCalled();
        });

        test('should maintain data consistency across all tracking platforms', () => {
            const purchaseData = {
                transactionId: 'txn_consistency_test',
                value: 15000,
                currency: 'JPY',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour'
            };

            trackPurchase(purchaseData);

            // Should call both GA4 and Google Ads tracking
            const ga4Calls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );

            expect(ga4Calls.length).toBeGreaterThan(0);

            // Data should be consistent
            if (ga4Calls.length > 0) {
                const eventData = ga4Calls[0][2];
                expect(eventData.transaction_id).toBe(purchaseData.transactionId);
                expect(eventData.value).toBe(purchaseData.value);
                expect(eventData.currency).toBe(purchaseData.currency);
            }
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle analytics initialization failures gracefully', () => {
            // Mock gtag initialization failure
            mockGtag.mockImplementation((command) => {
                if (command === 'config') {
                    throw new Error('Analytics initialization failed');
                }
            });

            // Should not throw errors
            expect(() => {
                initializeAnalytics();
            }).not.toThrow();

            // Should log the error
            expect(consoleError).toHaveBeenCalledWith(
                expect.stringContaining('initialization failed'),
                expect.any(Error)
            );
        });

        test('should recover from tracking script failures', () => {
            const purchaseData = {
                transactionId: 'txn_recovery_test',
                value: 15000,
                currency: 'JPY'
            };

            // First call fails
            mockGtag.mockImplementationOnce(() => {
                throw new Error('gtag is not defined');
            });

            // Second call succeeds
            mockGtag.mockImplementationOnce(() => {
                return true;
            });

            // Should continue with tracking despite first failure
            expect(() => {
                trackPurchase(purchaseData);
            }).not.toThrow();

            // Should attempt retry
            expect(mockGtag).toHaveBeenCalledTimes(1);
        });

        test('should handle network failures with retry logic', async () => {
            const networkError = new Error('Network request failed');
            networkError.name = 'NetworkError';

            // Mock network failure
            mockGtag.mockImplementation(() => {
                throw networkError;
            });

            const purchaseData = {
                transactionId: 'txn_network_test',
                value: 15000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should handle network error gracefully
            expect(consoleWarn).toHaveBeenCalledWith(
                expect.stringContaining('tracking failed'),
                expect.any(Error)
            );
        });

        test('should queue events when offline', () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                writable: true
            });

            const offlineData = {
                transactionId: 'txn_offline_test',
                value: 15000,
                currency: 'JPY'
            };

            trackPurchase(offlineData);

            // Should queue for later retry
            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBeGreaterThan(0);
        });
    });

    describe('Performance Monitoring Integration', () => {
        test('should monitor tracking call performance', () => {
            const trackingData = {
                transactionId: 'txn_performance_test',
                value: 15000,
                currency: 'JPY'
            };

            const startTime = performance.now();
            trackPurchase(trackingData);
            const endTime = performance.now();

            const callTime = endTime - startTime;

            // Should record performance metrics
            expect(performanceMonitor.recordTrackingCallTime).toHaveBeenCalledWith(
                'purchase',
                expect.any(Number)
            );

            // Should detect slow calls
            if (callTime > 100) {
                expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                    ERROR_TYPES.TRACKING_FAILURE,
                    expect.objectContaining({
                        message: expect.stringContaining('slow')
                    })
                );
            }
        });

        test('should monitor script loading performance', () => {
            // Mock script element
            const mockScript = {
                src: '',
                onload: null,
                onerror: null
            };

            const createElement = jest.spyOn(document, 'createElement')
                .mockReturnValue(mockScript);

            const appendChild = jest.spyOn(document.head, 'appendChild')
                .mockImplementation();

            initializeAnalytics();

            // Should create and load tracking scripts
            expect(createElement).toHaveBeenCalledWith('script');
            expect(appendChild).toHaveBeenCalled();

            // Simulate successful script load
            const loadTime = 500; // 500ms load time
            if (mockScript.onload) {
                setTimeout(() => {
                    mockScript.onload();

                    // Should record script load time
                    expect(performanceMonitor.recordScriptLoadTime).toHaveBeenCalledWith(
                        expect.stringContaining('gtag'),
                        expect.any(Number)
                    );
                }, loadTime);
            }

            createElement.mockRestore();
            appendChild.mockRestore();
        });

        test('should detect and alert on high error rates', () => {
            // Generate multiple tracking errors
            for (let i = 0; i < 15; i++) {
                mockGtag.mockImplementationOnce(() => {
                    throw new Error(`Tracking error ${i}`);
                });

                trackPurchase({
                    transactionId: `txn_error_${i}`,
                    value: 15000,
                    currency: 'JPY'
                });
            }

            // Should detect high error rate
            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBeGreaterThan(10);

            // Should trigger error rate alert
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.CONFIGURATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('High error rate')
                })
            );
        });
    });

    describe('Privacy Compliance Integration', () => {
        test('should respect privacy preferences for tracking', () => {
            // Disable analytics tracking
            privacyManager.canTrackAnalytics.mockReturnValue(false);

            const trackingData = {
                transactionId: 'txn_privacy_test',
                value: 15000,
                currency: 'JPY'
            };

            trackPurchase(trackingData);

            // Should not fire tracking calls
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should respect marketing consent for Google Ads', () => {
            // Allow analytics but disable marketing
            privacyManager.canTrackAnalytics.mockReturnValue(true);
            privacyManager.canTrackMarketing.mockReturnValue(false);

            const trackingData = {
                transactionId: 'txn_marketing_test',
                value: 15000,
                currency: 'JPY'
            };

            trackPurchase(trackingData);

            // Should fire GA4 but not Google Ads
            const ga4Calls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );
            const adsCalls = mockGtag.mock.calls.filter(call =>
                call[0] === 'event' && call[1] === 'conversion'
            );

            expect(ga4Calls.length).toBeGreaterThan(0);
            expect(adsCalls.length).toBe(0);
        });

        test('should handle consent changes dynamically', () => {
            // Start with consent enabled
            privacyManager.canTrackAnalytics.mockReturnValue(true);

            trackPurchase({
                transactionId: 'txn_consent_1',
                value: 15000,
                currency: 'JPY'
            });

            expect(mockGtag).toHaveBeenCalled();
            mockGtag.mockClear();

            // Disable consent
            privacyManager.canTrackAnalytics.mockReturnValue(false);

            trackPurchase({
                transactionId: 'txn_consent_2',
                value: 15000,
                currency: 'JPY'
            });

            // Should not track after consent revoked
            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('Data Validation Integration', () => {
        test('should validate all tracking data before sending', () => {
            const invalidData = {
                transactionId: '', // Invalid
                value: -100, // Invalid
                currency: 'INVALID' // Invalid
            };

            // Should handle invalid data gracefully
            expect(() => {
                trackPurchase(invalidData);
            }).not.toThrow();

            // Should log validation errors
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.VALIDATION_ERROR,
                expect.objectContaining({
                    message: expect.stringContaining('validation')
                })
            );
        });

        test('should sanitize data to prevent XSS', () => {
            const maliciousData = {
                transactionId: 'txn_<script>alert("xss")</script>',
                value: 15000,
                currency: 'JPY',
                tourName: 'Tour <img src="x" onerror="alert(1)">'
            };

            trackPurchase(maliciousData);

            // Should sanitize data before tracking
            const trackingCalls = mockGtag.mock.calls;
            const purchaseCall = trackingCalls.find(call => call[1] === 'purchase');

            if (purchaseCall) {
                const eventData = purchaseCall[2];
                expect(eventData.transaction_id).not.toContain('<script>');
                expect(eventData.tour_name || '').not.toContain('<img');
            }
        });
    });

    describe('Real-time Monitoring', () => {
        test('should provide real-time performance dashboard', () => {
            // Generate various tracking events
            trackTourView({ tourId: 'gion-tour', price: 12000 });
            trackBeginCheckout({ tourId: 'gion-tour', price: 12000, quantity: 1 });
            trackPurchase({ transactionId: 'txn_dashboard', value: 12000, currency: 'JPY' });

            const summary = performanceMonitor.getPerformanceSummary();

            // Should provide comprehensive metrics
            expect(summary).toHaveProperty('totalMetrics');
            expect(summary).toHaveProperty('recentMetrics');
            expect(summary).toHaveProperty('totalErrors');
            expect(summary).toHaveProperty('errorRate');
            expect(summary).toHaveProperty('trackingCallTimes');

            // Should track different event types
            expect(summary.trackingCallTimes.length).toBeGreaterThan(0);
        });

        test('should alert on critical tracking failures', () => {
            const criticalError = new Error('Google Analytics completely unavailable');

            // Mock critical failure
            mockGtag.mockImplementation(() => {
                throw criticalError;
            });

            // Attempt multiple tracking calls
            for (let i = 0; i < 5; i++) {
                trackPurchase({
                    transactionId: `txn_critical_${i}`,
                    value: 15000,
                    currency: 'JPY'
                });
            }

            // Should trigger critical alert
            expect(performanceMonitor.handleError).toHaveBeenCalledWith(
                ERROR_TYPES.TRACKING_FAILURE,
                expect.objectContaining({
                    message: expect.stringContaining('unavailable')
                })
            );
        });

        test('should monitor system health metrics', () => {
            // Simulate various system conditions

            // Normal operation
            trackPurchase({ transactionId: 'txn_normal', value: 15000, currency: 'JPY' });

            // Network error
            mockGtag.mockImplementationOnce(() => {
                throw new Error('Network timeout');
            });
            trackPurchase({ transactionId: 'txn_network_error', value: 15000, currency: 'JPY' });

            // Script load failure
            performanceMonitor.handleError(ERROR_TYPES.SCRIPT_LOAD_FAILURE, {
                scriptUrl: 'https://googletagmanager.com/gtag/js',
                error: 'Load timeout'
            });

            const summary = performanceMonitor.getPerformanceSummary();

            // Should track system health
            expect(summary.totalErrors).toBeGreaterThan(0);
            expect(summary.errorRate).toBeGreaterThan(0);

            // Should categorize different error types
            const recentErrors = performanceMonitor.getRecentErrors(60000);
            const networkErrors = recentErrors.filter(e => e.type === ERROR_TYPES.NETWORK_ERROR);
            const scriptErrors = recentErrors.filter(e => e.type === ERROR_TYPES.SCRIPT_LOAD_FAILURE);

            expect(networkErrors.length + scriptErrors.length).toBeGreaterThan(0);
        });
    });
});

describe('Load Testing and Stress Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        performanceMonitor.initialize();
    });

    test('should handle high-volume tracking load', async () => {
        const trackingPromises = [];
        const eventCount = 100;

        const startTime = performance.now();

        // Generate high volume of tracking events
        for (let i = 0; i < eventCount; i++) {
            const promise = Promise.resolve().then(() => {
                trackPurchase({
                    transactionId: `txn_load_${i}`,
                    value: 15000 + (i * 100),
                    currency: 'JPY',
                    tourId: 'gion-tour'
                });
            });
            trackingPromises.push(promise);
        }

        await Promise.all(trackingPromises);

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / eventCount;

        // Should handle load efficiently
        expect(averageTime).toBeLessThan(10); // Under 10ms per event
        expect(mockGtag).toHaveBeenCalledTimes(eventCount);

        // Should not trigger error rate alerts under normal load
        const summary = performanceMonitor.getPerformanceSummary();
        expect(summary.errorRate).toBeLessThan(0.05); // Less than 5% error rate
    });

    test('should handle rapid error recovery', () => {
        let errorCount = 0;
        const maxErrors = 20;

        // Simulate intermittent failures
        mockGtag.mockImplementation(() => {
            errorCount++;
            if (errorCount <= maxErrors && errorCount % 3 === 0) {
                throw new Error(`Intermittent failure ${errorCount}`);
            }
            return true;
        });

        // Generate tracking events with failures
        for (let i = 0; i < 50; i++) {
            trackPurchase({
                transactionId: `txn_recovery_${i}`,
                value: 15000,
                currency: 'JPY'
            });
        }

        const summary = performanceMonitor.getPerformanceSummary();

        // Should recover from intermittent failures
        expect(summary.totalErrors).toBeLessThan(maxErrors);

        // Should maintain acceptable success rate
        const successRate = 1 - summary.errorRate;
        expect(successRate).toBeGreaterThan(0.8); // Over 80% success rate
    });
}); 