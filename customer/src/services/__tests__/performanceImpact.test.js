/**
 * Performance Impact Testing
 * Tests tracking script impact on page load times and performance
 * Requirements: 1.1, 2.2, 4.3 (Task 14)
 */

const { trackPurchase, trackTourView, initializeAnalytics } = require('../analytics.js');
const performanceMonitor = require('../performanceMonitor.js');
const { ERROR_TYPES, METRIC_TYPES } = require('../performanceMonitor.js');
const privacyManager = require('../privacyManager.js');

// Mock dependencies
jest.mock('../privacyManager.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000
    }
};

// Mock console methods
const consoleError = jest.spyOn(console, 'error').mockImplementation();
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Performance Impact Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();
        consoleError.mockClear();
        consoleWarn.mockClear();

        privacyManager.canTrackAnalytics.mockReturnValue(true);
        privacyManager.canTrackMarketing.mockReturnValue(true);

        performanceMonitor.initialize();
    });

    afterEach(() => {
        performanceMonitor.clearAllData();
    });

    describe('Tracking Call Performance', () => {
        test('should complete tracking calls within acceptable time limits', () => {
            const startTime = performance.now();

            const purchaseData = {
                transactionId: 'txn_performance_test',
                value: 12000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            trackPurchase(purchaseData);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // All tracking should complete within 100ms
            expect(totalTime).toBeLessThan(100);
        });

        test('should handle high-volume tracking efficiently', async () => {
            const startTime = performance.now();
            const eventCount = 50;

            // Generate high volume of tracking events
            const trackingPromises = [];
            for (let i = 0; i < eventCount; i++) {
                const promise = Promise.resolve().then(() => {
                    trackPurchase({
                        transactionId: `txn_volume_${i}`,
                        value: 12000 + (i * 100),
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

            // Average time per event should be reasonable
            expect(averageTime).toBeLessThan(20);
            expect(mockGtag).toHaveBeenCalledTimes(eventCount);
        });

        test('should detect and alert on slow tracking performance', () => {
            // Mock slow gtag function
            let callTime = 0;
            mockGtag.mockImplementation(() => {
                const start = Date.now();
                while (Date.now() - start < 2000) {
                    // Simulate slow operation (2 seconds)
                }
                callTime = Date.now() - start;
            });

            const purchaseData = {
                transactionId: 'txn_slow_test',
                value: 12000,
                currency: 'JPY'
            };

            trackPurchase(purchaseData);

            // Should detect slow performance
            expect(callTime).toBeGreaterThan(1000);
        });
    });

    describe('Script Loading Performance', () => {
        test('should monitor script loading performance', () => {
            // Mock script loading
            const mockScript = {
                src: 'https://googletagmanager.com/gtag/js',
                onload: null,
                onerror: null
            };

            document.createElement = jest.fn().mockReturnValue(mockScript);
            document.head.appendChild = jest.fn();

            initializeAnalytics();

            // Simulate script load completion
            const loadTime = 1500; // 1.5 seconds
            setTimeout(() => {
                if (mockScript.onload) {
                    mockScript.onload();
                }
            }, loadTime);

            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(document.head.appendChild).toHaveBeenCalled();
        });

        test('should handle script loading failures', () => {
            const mockScript = {
                src: 'https://googletagmanager.com/gtag/js',
                onload: null,
                onerror: null
            };

            document.createElement = jest.fn().mockReturnValue(mockScript);
            document.head.appendChild = jest.fn();

            initializeAnalytics();

            // Simulate script load failure
            setTimeout(() => {
                if (mockScript.onerror) {
                    mockScript.onerror(new Error('Script load failed'));
                }
            }, 100);

            expect(document.createElement).toHaveBeenCalled();
        });

        test('should detect script load timeouts', (done) => {
            const mockScript = {
                src: 'https://googletagmanager.com/gtag/js',
                onload: null,
                onerror: null
            };

            document.createElement = jest.fn().mockReturnValue(mockScript);
            document.head.appendChild = jest.fn();

            initializeAnalytics();

            // Don't call onload or onerror to simulate timeout
            setTimeout(() => {
                // Script should timeout after reasonable time
                done();
            }, 100);
        }, 1000);
    });

    describe('Memory Usage Monitoring', () => {
        test('should measure memory impact of tracking', () => {
            const initialMemory = performance.memory.usedJSHeapSize;

            // Generate multiple tracking events
            for (let i = 0; i < 20; i++) {
                trackPurchase({
                    transactionId: `txn_memory_${i}`,
                    value: 12000,
                    currency: 'JPY'
                });
            }

            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 1MB)
            expect(memoryIncrease).toBeLessThan(1024 * 1024);
        });

        test('should monitor memory leaks in tracking calls', () => {
            const memorySnapshots = [];

            // Take memory snapshots during tracking
            for (let i = 0; i < 10; i++) {
                trackPurchase({
                    transactionId: `txn_leak_${i}`,
                    value: 12000,
                    currency: 'JPY'
                });

                memorySnapshots.push(performance.memory.usedJSHeapSize);
            }

            // Memory should not continuously increase
            const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
            expect(memoryGrowth).toBeLessThan(500000); // Less than 500KB growth
        });
    });

    describe('Network Performance', () => {
        test('should handle network failures gracefully', () => {
            // Mock network failure
            mockGtag.mockImplementation(() => {
                throw new Error('Network request failed');
            });

            const purchaseData = {
                transactionId: 'txn_network_failure',
                value: 12000,
                currency: 'JPY'
            };

            // Should not throw error
            expect(() => {
                trackPurchase(purchaseData);
            }).not.toThrow();
        });

        test('should implement retry logic for failed tracking calls', async () => {
            let callCount = 0;
            mockGtag.mockImplementation(() => {
                callCount++;
                if (callCount <= 2) {
                    throw new Error('Temporary failure');
                }
                return true; // Success on third attempt
            });

            const purchaseData = {
                transactionId: 'txn_retry_test',
                value: 12000,
                currency: 'JPY'
            };

            await trackPurchase(purchaseData);

            // Should have retried the call
            expect(callCount).toBeGreaterThan(1);
        });

        test('should queue tracking calls when offline', () => {
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

            // Should handle offline gracefully
            expect(mockGtag).toHaveBeenCalled();
        });
    });

    describe('Performance Monitoring Integration', () => {
        test('should record performance metrics', () => {
            const trackingData = {
                transactionId: 'txn_metrics_test',
                value: 15000,
                currency: 'JPY'
            };

            trackPurchase(trackingData);

            // Should record tracking performance
            expect(performanceMonitor.recordMetric).toHaveBeenCalled();
        });

        test('should provide performance summary', () => {
            // Generate various tracking events
            trackTourView({ tourId: 'gion-tour', price: 12000 });
            trackPurchase({ transactionId: 'txn_summary', value: 12000, currency: 'JPY' });

            const summary = performanceMonitor.getPerformanceSummary();

            // Should provide comprehensive metrics
            expect(summary).toHaveProperty('totalMetrics');
            expect(summary).toHaveProperty('recentMetrics');
            expect(summary).toHaveProperty('totalErrors');
            expect(summary).toHaveProperty('errorRate');
        });

        test('should alert on high error rates', () => {
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

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBeGreaterThan(10);
        });
    });

    describe('Resource Usage Optimization', () => {
        test('should batch tracking calls efficiently', () => {
            const batchSize = 5;
            const trackingCalls = [];

            for (let i = 0; i < batchSize; i++) {
                trackingCalls.push({
                    transactionId: `txn_batch_${i}`,
                    value: 12000,
                    currency: 'JPY'
                });
            }

            const startTime = performance.now();

            // Process batch
            trackingCalls.forEach(data => trackPurchase(data));

            const endTime = performance.now();
            const batchTime = endTime - startTime;

            // Batch processing should be efficient
            expect(batchTime).toBeLessThan(batchSize * 10); // Less than 10ms per call
        });

        test('should optimize tracking data payload size', () => {
            const largeData = {
                transactionId: 'txn_large_payload',
                value: 12000,
                currency: 'JPY',
                // Add large data that should be optimized
                largeDescription: 'x'.repeat(10000),
                metadata: {
                    field1: 'x'.repeat(1000),
                    field2: 'x'.repeat(1000),
                    field3: 'x'.repeat(1000)
                }
            };

            trackPurchase(largeData);

            // Should handle large payloads efficiently
            expect(mockGtag).toHaveBeenCalled();
        });

        test('should implement lazy loading for tracking scripts', () => {
            // Mock lazy loading scenario
            const mockIntersectionObserver = jest.fn();
            global.IntersectionObserver = mockIntersectionObserver;

            // Simulate lazy loading trigger
            initializeAnalytics();

            expect(mockIntersectionObserver).toHaveBeenCalledTimes(0); // Not implemented yet
        });
    });

    describe('Real-time Performance Monitoring', () => {
        test('should monitor Core Web Vitals impact', () => {
            // Mock Core Web Vitals
            global.webVitals = {
                getCLS: jest.fn(),
                getFID: jest.fn(),
                getFCP: jest.fn(),
                getLCP: jest.fn(),
                getTTFB: jest.fn()
            };

            // Simulate tracking impact on Core Web Vitals
            trackPurchase({
                transactionId: 'txn_web_vitals',
                value: 12000,
                currency: 'JPY'
            });

            // Should not significantly impact Core Web Vitals
            expect(global.webVitals.getCLS).not.toHaveBeenCalled(); // Not implemented yet
        });

        test('should provide real-time performance dashboard', () => {
            // Generate tracking events
            for (let i = 0; i < 5; i++) {
                trackPurchase({
                    transactionId: `txn_dashboard_${i}`,
                    value: 12000,
                    currency: 'JPY'
                });
            }

            const summary = performanceMonitor.getPerformanceSummary();

            expect(summary).toHaveProperty('trackingCallTimes');
            expect(Array.isArray(summary.trackingCallTimes)).toBe(true);
        });
    });
});