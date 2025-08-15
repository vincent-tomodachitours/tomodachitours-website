/**
 * Performance Monitor Service Tests
 * Tests for error handling, retry logic, and performance monitoring
 */

import performanceMonitor, { ERROR_TYPES, METRIC_TYPES } from '../performanceMonitor.js';

// Mock dependencies
jest.mock('../privacyManager.js', () => ({
    canTrackAnalytics: jest.fn(() => true)
}));

// Mock performance API
const mockPerformance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000
    },
    navigation: {
        type: 1,
        redirectCount: 0
    }
};

Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    disconnect: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

describe('PerformanceMonitor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);

        // Reset performance monitor state
        performanceMonitor.clearAllData();
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(() => {
                performanceMonitor.initialize();
            }).not.toThrow();
        });

        test('should set up global error handling', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            performanceMonitor.initialize();

            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });

        test('should load stored data on initialization', () => {
            const mockErrors = JSON.stringify([
                { id: 'error1', type: ERROR_TYPES.TRACKING_FAILURE, timestamp: Date.now() }
            ]);
            const mockMetrics = JSON.stringify([
                { id: 'metric1', type: METRIC_TYPES.SCRIPT_LOAD_TIME, timestamp: Date.now() }
            ]);

            localStorageMock.getItem
                .mockReturnValueOnce(mockErrors)
                .mockReturnValueOnce(mockMetrics);

            performanceMonitor.initialize();

            expect(localStorageMock.getItem).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should handle tracking errors', () => {
            const errorData = {
                message: 'Test tracking error',
                action: 'test_action'
            };

            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, errorData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(1);
            expect(summary.recentErrors).toBe(1);
        });

        test('should store errors in localStorage', () => {
            const errorData = {
                message: 'Test error',
                action: 'test_action'
            };

            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, errorData);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'tracking_error_log',
                expect.stringContaining('Test error')
            );
        });

        test('should limit stored errors to maximum', () => {
            // Add more errors than the maximum allowed
            for (let i = 0; i < 105; i++) {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    message: `Error ${i}`
                });
            }

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(100); // Should be limited to MAX_STORED_ERRORS
        });

        test('should notify error callbacks', () => {
            const mockCallback = jest.fn();
            const callbackId = performanceMonitor.onError(mockCallback);

            const errorData = { message: 'Test error' };
            performanceMonitor.handleError(ERROR_TYPES.NETWORK_ERROR, errorData);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ERROR_TYPES.NETWORK_ERROR,
                    data: errorData
                })
            );

            performanceMonitor.offError(callbackId);
        });
    });

    describe('Performance Metrics', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should record performance metrics', () => {
            const metricData = {
                loadTime: 1500,
                script: 'test-script'
            };

            performanceMonitor.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, metricData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalMetrics).toBe(1);
        });

        test('should record script load times', () => {
            const scriptUrl = 'https://googletagmanager.com/gtag/js';
            const loadTime = 1200;

            performanceMonitor.recordScriptLoadTime(scriptUrl, loadTime);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.scriptLoadTimes).toHaveLength(1);
            expect(summary.scriptLoadTimes[0].loadTime).toBe(loadTime);
        });

        test('should record tracking call times', () => {
            const eventType = 'conversion';
            const callTime = 50;

            performanceMonitor.recordTrackingCallTime(eventType, callTime);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.trackingCallTimes).toHaveLength(1);
            expect(summary.trackingCallTimes[0].callTime).toBe(callTime);
        });

        test('should alert on slow tracking calls', () => {
            const eventType = 'conversion';
            const slowCallTime = 1500; // Over 1000ms threshold

            performanceMonitor.recordTrackingCallTime(eventType, slowCallTime);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(1); // Should have generated an error
        });
    });

    describe('Retry Logic', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should schedule retries for retryable errors', async () => {
            const retryableError = {
                id: 'test-error',
                type: ERROR_TYPES.NETWORK_ERROR,
                data: { message: 'Network timeout' },
                retryCount: 0
            };

            // Mock setTimeout to capture retry scheduling
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
                // Execute immediately for testing
                fn();
                return 123;
            });

            performanceMonitor.scheduleRetry(retryableError);

            expect(setTimeoutSpy).toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });

        test('should not retry non-retryable errors', () => {
            const nonRetryableError = {
                id: 'test-error',
                type: ERROR_TYPES.VALIDATION_ERROR,
                data: { message: 'Invalid data' },
                retryCount: 0
            };

            const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

            performanceMonitor.scheduleRetry(nonRetryableError);

            expect(setTimeoutSpy).not.toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });

        test('should stop retrying after max attempts', () => {
            const maxRetriesError = {
                id: 'test-error',
                type: ERROR_TYPES.NETWORK_ERROR,
                data: { message: 'Network timeout' },
                retryCount: 3 // Already at max retries
            };

            const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

            performanceMonitor.scheduleRetry(maxRetriesError);

            expect(setTimeoutSpy).not.toHaveBeenCalled();
            setTimeoutSpy.mockRestore();
        });
    });

    describe('Script Loading Monitoring', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should identify tracking scripts', () => {
            const trackingUrls = [
                'https://googletagmanager.com/gtag/js',
                'https://google-analytics.com/analytics.js',
                'https://googleadservices.com/pagead/conversion.js'
            ];

            const nonTrackingUrls = [
                'https://example.com/script.js',
                'https://cdn.jsdelivr.net/npm/package'
            ];

            trackingUrls.forEach(url => {
                expect(performanceMonitor.isTrackingScript(url)).toBe(true);
            });

            nonTrackingUrls.forEach(url => {
                expect(performanceMonitor.isTrackingScript(url)).toBe(false);
            });
        });

        test('should get friendly script names', () => {
            const scriptMappings = [
                ['https://googletagmanager.com/gtag/js', 'gtag'],
                ['https://googletagmanager.com/gtm.js', 'google_tag_manager'],
                ['https://google-analytics.com/analytics.js', 'google_analytics'],
                ['https://googleadservices.com/pagead/conversion.js', 'google_ads'],
                ['https://unknown-domain.com/script.js', 'unknown_tracking_script']
            ];

            scriptMappings.forEach(([url, expectedName]) => {
                expect(performanceMonitor.getScriptName(url)).toBe(expectedName);
            });
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should clean up old data', () => {
            // Add old error (older than retention period)
            const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                message: 'Old error',
                timestamp: oldTimestamp
            });

            // Add recent error
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                message: 'Recent error'
            });

            // Trigger cleanup
            performanceMonitor.cleanupOldData();

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(1); // Only recent error should remain
        });

        test('should clear all data', () => {
            // Add some data
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, { message: 'Test' });
            performanceMonitor.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, { loadTime: 1000 });

            performanceMonitor.clearAllData();

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(0);
            expect(summary.totalMetrics).toBe(0);
            expect(localStorageMock.removeItem).toHaveBeenCalled();
        });
    });

    describe('Performance Summary', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should provide comprehensive performance summary', () => {
            // Add some test data
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, { message: 'Test error' });
            performanceMonitor.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, { loadTime: 1000 });
            performanceMonitor.recordScriptLoadTime('test-script', 1500);
            performanceMonitor.recordTrackingCallTime('conversion', 100);

            const summary = performanceMonitor.getPerformanceSummary();

            expect(summary).toHaveProperty('totalMetrics');
            expect(summary).toHaveProperty('recentMetrics');
            expect(summary).toHaveProperty('totalErrors');
            expect(summary).toHaveProperty('recentErrors');
            expect(summary).toHaveProperty('errorRate');
            expect(summary).toHaveProperty('scriptLoadTimes');
            expect(summary).toHaveProperty('trackingCallTimes');

            expect(summary.totalErrors).toBe(1);
            expect(summary.totalMetrics).toBe(1);
            expect(summary.scriptLoadTimes).toHaveLength(1);
            expect(summary.trackingCallTimes).toHaveLength(1);
        });

        test('should calculate error rate correctly', () => {
            // Add errors and metrics
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, { message: 'Error 1' });
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, { message: 'Error 2' });

            for (let i = 0; i < 8; i++) {
                performanceMonitor.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, { loadTime: 1000 });
            }

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.errorRate).toBe(2 / 8); // 2 errors out of 8 metrics
        });
    });

    describe('Error Detection', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should detect tracking-related errors', () => {
            const trackingError = new Error('gtag is not defined');
            const nonTrackingError = new Error('generic error');

            expect(performanceMonitor.isTrackingRelatedError(trackingError)).toBe(true);
            expect(performanceMonitor.isTrackingRelatedError(nonTrackingError)).toBe(false);
        });

        test('should detect Google Analytics errors', () => {
            const gaError = new Error('analytics.js failed to load');
            const gtagError = new Error('GoogleTagManager is undefined');
            const conversionError = new Error('conversion tracking failed');

            expect(performanceMonitor.isTrackingRelatedError(gaError)).toBe(true);
            expect(performanceMonitor.isTrackingRelatedError(gtagError)).toBe(true);
            expect(performanceMonitor.isTrackingRelatedError(conversionError)).toBe(true);
        });
    });

    describe('Alerting System', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should trigger alerts for high error rates', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simulate high error rate (more than 10 errors in 5 minutes)
            for (let i = 0; i < 12; i++) {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    message: `Error ${i}`,
                    timestamp: Date.now()
                });
            }

            // checkErrorRate should be called and detect high error rate
            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBeGreaterThan(10);

            consoleSpy.mockRestore();
        });

        test('should report errors in batches', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Add multiple unreported errors
            for (let i = 0; i < 15; i++) {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    message: `Error ${i}`
                });
            }

            // Trigger error reporting
            performanceMonitor.reportErrors();

            // Should batch and report errors
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reporting'));

            consoleSpy.mockRestore();
        });

        test('should not report errors when privacy disallows tracking', () => {
            const privacyManager = require('../privacyManager.js').default;
            privacyManager.canTrackAnalytics.mockReturnValue(false);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Add errors
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, { message: 'Test error' });

            // Try to report errors
            performanceMonitor.reportErrors();

            // Should not report when privacy disallows
            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Reporting'));

            consoleSpy.mockRestore();
        });

        test('should alert on script load timeouts', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simulate script load timeout
            performanceMonitor.handleError(ERROR_TYPES.SCRIPT_LOAD_FAILURE, {
                message: 'Script load timeout',
                scriptUrl: 'https://googletagmanager.com/gtag/js',
                timeout: 10000
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('script_load_failure'),
                expect.any(Object)
            );

            consoleSpy.mockRestore();
        });

        test('should alert on consecutive tracking failures', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simulate consecutive failures for same tracking call
            for (let i = 0; i < 5; i++) {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    message: 'Conversion tracking failed',
                    function: 'trackGoogleAdsPurchase',
                    attempt: i + 1
                });
            }

            // Should have logged multiple errors
            expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(5);

            consoleSpy.mockRestore();
        });
    });

    describe('Performance Impact Monitoring', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should monitor script load impact on page performance', () => {
            // Mock performance API
            const mockEntries = [
                {
                    name: 'https://googletagmanager.com/gtag/js',
                    startTime: 100,
                    responseEnd: 250,
                    transferSize: 15000
                }
            ];

            global.performance.getEntriesByType = jest.fn().mockReturnValue(mockEntries);

            performanceMonitor.monitorPagePerformance();

            expect(performance.getEntriesByType).toHaveBeenCalledWith('resource');
        });

        test('should record memory usage metrics', () => {
            // Mock performance.memory
            const mockMemory = {
                usedJSHeapSize: 5000000,
                totalJSHeapSize: 10000000,
                jsHeapSizeLimit: 2147483648
            };

            Object.defineProperty(performance, 'memory', {
                value: mockMemory,
                writable: true
            });

            performanceMonitor.collectPerformanceMetrics();

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalMetrics).toBeGreaterThan(0);
        });

        test('should detect page load impact from tracking scripts', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Simulate slow script loading affecting page load
            performanceMonitor.recordScriptLoadTime('https://googletagmanager.com/gtag/js', 3000);

            // Should detect and warn about slow script load
            const summary = performanceMonitor.getPerformanceSummary();
            const slowScript = summary.scriptLoadTimes.find(s => s.loadTime > 2000);
            expect(slowScript).toBeDefined();

            consoleSpy.mockRestore();
        });
    });

    describe('Data Validation and Error Prevention', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should validate tracking data before processing', () => {
            // Test with invalid data types
            expect(() => {
                performanceMonitor.handleError(null, { message: 'test' });
            }).not.toThrow();

            expect(() => {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, null);
            }).not.toThrow();

            expect(() => {
                performanceMonitor.recordMetric(undefined, { value: 100 });
            }).not.toThrow();
        });

        test('should sanitize error data to prevent XSS', () => {
            const maliciousData = {
                message: '<script>alert("xss")</script>',
                userInput: 'javascript:alert(1)'
            };

            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, maliciousData);

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalErrors).toBe(1);

            // Error should be stored but data should be safe
            const errors = performanceMonitor.getRecentErrors(60000);
            expect(errors[0].data.message).not.toContain('<script>');
        });

        test('should validate metric data types', () => {
            // Test with various invalid metric data
            const invalidMetrics = [
                { loadTime: 'not-a-number' },
                { loadTime: null },
                { loadTime: undefined },
                {},
                null
            ];

            invalidMetrics.forEach(metric => {
                expect(() => {
                    performanceMonitor.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, metric);
                }).not.toThrow();
            });
        });

        test('should handle storage quota exceeded gracefully', () => {
            const storageError = new Error('QuotaExceededError');
            const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw storageError;
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Should handle storage error gracefully
            expect(() => {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, { message: 'test' });
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith('Failed to store error:', storageError);

            setItemSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe('Real-time Monitoring and Alerting', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should start periodic monitoring tasks', () => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation();

            performanceMonitor.startPeriodicTasks();

            // Should set up intervals for metrics collection, cleanup, and error reporting
            expect(setIntervalSpy).toHaveBeenCalledTimes(3);
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000); // metrics
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 3600000); // cleanup
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 300000); // error reporting

            setIntervalSpy.mockRestore();
        });

        test('should detect and alert on tracking script failures', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simulate script loading failure
            const scriptError = new ErrorEvent('error', {
                filename: 'https://googletagmanager.com/gtag/js',
                message: 'Script error'
            });

            // Trigger error handler
            window.dispatchEvent(scriptError);

            // Should detect and handle tracking script error
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should monitor tracking call success rates', () => {
            // Record successful tracking calls
            for (let i = 0; i < 8; i++) {
                performanceMonitor.recordTrackingCallTime('conversion', 50);
            }

            // Record failed tracking calls
            for (let i = 0; i < 2; i++) {
                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    function: 'conversion',
                    message: 'Tracking failed'
                });
            }

            const summary = performanceMonitor.getPerformanceSummary();
            // Success rate should be 80% (8 success, 2 failures)
            expect(summary.errorRate).toBe(0.2);
        });

        test('should alert on critical tracking failures', () => {
            const errorCallbacks = [];
            const callbackId = performanceMonitor.onError((error) => {
                errorCallbacks.push(error);
            });

            // Simulate critical tracking failure
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                message: 'Google Ads conversion tracking completely failed',
                severity: 'critical'
            });

            expect(errorCallbacks).toHaveLength(1);
            expect(errorCallbacks[0].type).toBe(ERROR_TYPES.CONFIGURATION_ERROR);

            performanceMonitor.offError(callbackId);
        });
    });

    describe('Error Recovery and Retry Logic', () => {
        beforeEach(() => {
            performanceMonitor.initialize();
        });

        test('should implement exponential backoff for retries', async () => {
            const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

            const error = {
                id: 'test-error',
                type: ERROR_TYPES.NETWORK_ERROR,
                data: { message: 'Network timeout' },
                retryCount: 0
            };

            // First retry should be 1000ms
            performanceMonitor.scheduleRetry(error);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

            // Second retry should be 2000ms
            error.retryCount = 1;
            performanceMonitor.scheduleRetry(error);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

            // Third retry should be 4000ms
            error.retryCount = 2;
            performanceMonitor.scheduleRetry(error);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4000);

            setTimeoutSpy.mockRestore();
        });

        test('should track retry success metrics', () => {
            const error = {
                id: 'test-error-success',
                type: ERROR_TYPES.TRACKING_FAILURE,
                data: { message: 'Temporary failure' },
                retryCount: 1
            };

            // Simulate successful retry
            performanceMonitor.recordMetric(METRIC_TYPES.SUCCESS_RATE, {
                errorId: error.id,
                retryCount: error.retryCount,
                timestamp: Date.now()
            });

            const summary = performanceMonitor.getPerformanceSummary();
            expect(summary.totalMetrics).toBe(1);
        });

        test('should handle network errors with appropriate retry strategy', async () => {
            const mockRetryNetworkOperation = jest.fn().mockResolvedValue(true);
            performanceMonitor.retryNetworkOperation = mockRetryNetworkOperation;

            const networkError = {
                id: 'network-error',
                type: ERROR_TYPES.NETWORK_ERROR,
                data: { message: 'Network timeout', endpoint: '/tracking' },
                retryCount: 0
            };

            await performanceMonitor.retryFailedOperation(networkError);

            expect(mockRetryNetworkOperation).toHaveBeenCalledWith(networkError.data);
        });

        test('should queue failed operations for offline retry', () => {
            // Simulate offline mode
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                writable: true
            });

            const offlineError = {
                id: 'offline-error',
                type: ERROR_TYPES.NETWORK_ERROR,
                data: { message: 'Network unavailable' },
                retryCount: 0
            };

            performanceMonitor.scheduleRetry(offlineError);

            // Should queue for retry when back online
            expect(performanceMonitor.retryQueue.has(offlineError.id)).toBe(true);
        });
    });
});

// Integration tests for performance monitoring with actual tracking functions
describe('Performance Monitor Integration', () => {
    let performanceMonitor;

    beforeEach(() => {
        performanceMonitor = require('../performanceMonitor.js').default;
        performanceMonitor.initialize();
    });

    test('should integrate with Google Ads tracker error handling', async () => {
        const { trackGoogleAdsPurchase } = await import('../googleAdsTracker.js');

        const errorSpy = jest.spyOn(performanceMonitor, 'handleError');

        // Mock gtag to simulate failure
        global.gtag = jest.fn().mockImplementation(() => {
            throw new Error('gtag failed');
        });

        // This should trigger performance monitor error handling
        try {
            await trackGoogleAdsPurchase({ value: 5000, transactionId: 'test' });
        } catch (error) {
            // Expected to fail
        }

        // Performance monitor should have been notified
        expect(errorSpy).toHaveBeenCalledWith(
            ERROR_TYPES.TRACKING_FAILURE,
            expect.objectContaining({
                message: expect.stringContaining('gtag')
            })
        );
    });

    test('should monitor analytics initialization performance', async () => {
        const { initializeAnalytics } = await import('../analytics/initialization.js');

        const metricSpy = jest.spyOn(performanceMonitor, 'recordMetric');

        // Should record initialization performance
        initializeAnalytics();

        expect(metricSpy).toHaveBeenCalledWith(
            'service_initialization_time',
            expect.objectContaining({
                service: expect.any(String),
                initTime: expect.any(Number)
            })
        );
    });
});