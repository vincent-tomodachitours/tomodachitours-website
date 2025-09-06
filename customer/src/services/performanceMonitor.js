/**
 * Performance Monitor Service
 * Handles performance monitoring, error tracking, and alerting for Google Ads analytics integration
 * Requirements: 1.1, 2.2, 4.3
 */

import privacyManager from './privacyManager.js';

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
    // Script load timeout (milliseconds)
    SCRIPT_LOAD_TIMEOUT: 10000,
    // Maximum retry attempts for failed tracking calls
    MAX_RETRIES: 3,
    // Retry delay multiplier (exponential backoff)
    RETRY_DELAY_BASE: 1000,
    // Performance metrics collection interval
    METRICS_COLLECTION_INTERVAL: 30000,
    // Error reporting batch size
    ERROR_BATCH_SIZE: 10,
    // Maximum errors to store locally
    MAX_STORED_ERRORS: 100,
    // Performance data retention period (7 days)
    DATA_RETENTION_PERIOD: 7 * 24 * 60 * 60 * 1000
};

// Storage keys
const STORAGE_KEYS = {
    PERFORMANCE_METRICS: 'performance_metrics',
    ERROR_LOG: 'tracking_error_log',
    SCRIPT_LOAD_TIMES: 'script_load_times',
    TRACKING_FAILURES: 'tracking_failures'
};

// Error types
export const ERROR_TYPES = {
    SCRIPT_LOAD_FAILURE: 'script_load_failure',
    TRACKING_FAILURE: 'tracking_failure',
    VALIDATION_ERROR: 'validation_error',
    NETWORK_ERROR: 'network_error',
    PRIVACY_ERROR: 'privacy_error',
    CONFIGURATION_ERROR: 'configuration_error'
};

// Performance metric types
export const METRIC_TYPES = {
    SCRIPT_LOAD_TIME: 'script_load_time',
    TRACKING_CALL_TIME: 'tracking_call_time',
    VALIDATION_TIME: 'validation_time',
    ERROR_RATE: 'error_rate',
    SUCCESS_RATE: 'success_rate'
};

class PerformanceMonitor {
    constructor() {
        this.initialized = false;
        this.errorQueue = [];
        this.metricsQueue = [];
        this.retryQueue = new Map();
        this.scriptLoadTimes = new Map();
        this.trackingCallTimes = new Map();
        this.errorCallbacks = new Map();
        this.performanceCallbacks = new Map();

        // Track intervals for cleanup
        this.intervals = [];
        this.timeouts = [];
        this.isPageVisible = true;

        // Bind methods to preserve context
        this.handleError = this.handleError.bind(this);
        this.retryFailedOperation = this.retryFailedOperation.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize performance monitoring
     */
    initialize() {
        if (this.initialized) return;

        console.log('Initializing Performance Monitor');

        // Set up error handling
        this.setupGlobalErrorHandling();

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        // Set up page visibility handling
        this.setupPageVisibilityHandling();

        // Start periodic cleanup and reporting
        this.startPeriodicTasks();

        // Load existing data
        this.loadStoredData();

        this.initialized = true;
        console.log('Performance Monitor initialized');
    }

    /**
     * Set up global error handling for tracking failures
     */
    setupGlobalErrorHandling() {
        // Only set up in browser environment
        if (typeof window === 'undefined') return;

        // Capture unhandled errors that might affect tracking
        window.addEventListener('error', (event) => {
            if (this.isTrackingRelatedError(event.error)) {
                this.handleError(ERROR_TYPES.SCRIPT_LOAD_FAILURE, {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error?.stack
                });
            }
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (this.isTrackingRelatedError(event.reason)) {
                this.handleError(ERROR_TYPES.NETWORK_ERROR, {
                    message: 'Unhandled promise rejection',
                    reason: event.reason?.toString(),
                    stack: event.reason?.stack
                });
            }
        });
    }

    /**
     * Check if error is related to tracking functionality
     */
    isTrackingRelatedError(error) {
        if (!error) return false;

        const trackingKeywords = [
            'gtag', 'analytics', 'google-analytics', 'googletagmanager',
            'conversion', 'remarketing', 'attribution', 'gclid'
        ];

        const errorString = error.toString().toLowerCase();
        return trackingKeywords.some(keyword => errorString.includes(keyword));
    }

    /**
     * Set up performance monitoring for tracking scripts
     */
    setupPerformanceMonitoring() {
        // Monitor script loading performance
        this.monitorScriptLoading();

        // Monitor tracking call performance
        this.monitorTrackingCalls();

        // Monitor page performance impact
        this.monitorPagePerformance();
    }

    /**
     * Monitor script loading performance
     */
    monitorScriptLoading() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (this.isTrackingScript(entry.name)) {
                    const loadTime = entry.responseEnd - entry.startTime;
                    this.recordScriptLoadTime(entry.name, loadTime);

                    // Check for slow loading scripts
                    if (loadTime > 5000) {
                        this.handleError(ERROR_TYPES.SCRIPT_LOAD_FAILURE, {
                            script: entry.name,
                            loadTime: loadTime,
                            message: 'Slow script loading detected'
                        });
                    }
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Performance Observer not supported:', error);
        }
    }

    /**
     * Check if resource is a tracking script
     */
    isTrackingScript(url) {
        const trackingDomains = [
            'googletagmanager.com',
            'google-analytics.com',
            'googleadservices.com',
            'doubleclick.net'
        ];

        return trackingDomains.some(domain => url.includes(domain));
    }

    /**
     * Record script load time
     */
    recordScriptLoadTime(scriptUrl, loadTime) {
        const scriptName = this.getScriptName(scriptUrl);
        this.scriptLoadTimes.set(scriptName, {
            url: scriptUrl,
            loadTime: loadTime,
            timestamp: Date.now()
        });

        this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
            script: scriptName,
            loadTime: loadTime,
            timestamp: Date.now()
        });

        console.log(`Script load time recorded: ${scriptName} - ${loadTime}ms`);
    }

    /**
     * Get friendly script name from URL
     */
    getScriptName(url) {
        if (url.includes('gtag')) return 'gtag';
        if (url.includes('gtm')) return 'google_tag_manager';
        if (url.includes('analytics')) return 'google_analytics';
        if (url.includes('googleadservices')) return 'google_ads';
        return 'unknown_tracking_script';
    }

    /**
     * Monitor tracking call performance
     */
    monitorTrackingCalls() {
        // Only monitor in browser environment
        if (typeof window === 'undefined' || !window.gtag) return;

        // Wrap gtag function to monitor performance
        const originalGtag = window.gtag;
        window.gtag = (...args) => {
            const startTime = performance.now();

            try {
                const result = originalGtag.apply(this, args);
                const endTime = performance.now();
                const callTime = endTime - startTime;

                this.recordTrackingCallTime(args[0], callTime);
                return result;
            } catch (error) {
                const endTime = performance.now();
                const callTime = endTime - startTime;

                this.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    function: 'gtag',
                    args: args,
                    error: error.message,
                    callTime: callTime
                });

                throw error;
            }
        };
    }

    /**
     * Record tracking call performance
     */
    recordTrackingCallTime(eventType, callTime) {
        const key = `gtag_${eventType}`;
        this.trackingCallTimes.set(key, {
            eventType: eventType,
            callTime: callTime,
            timestamp: Date.now()
        });

        this.recordMetric(METRIC_TYPES.TRACKING_CALL_TIME, {
            eventType: eventType,
            callTime: callTime,
            timestamp: Date.now()
        });

        // Alert on slow tracking calls
        if (callTime > 1000) {
            this.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                eventType: eventType,
                callTime: callTime,
                message: 'Slow tracking call detected'
            });
        }
    }

    /**
     * Monitor page performance impact of tracking scripts
     */
    monitorPagePerformance() {
        // Only monitor in browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        // Monitor Core Web Vitals impact
        if ('web-vital' in window) {
            // This would integrate with web-vitals library if available
            console.log('Web Vitals monitoring would be set up here');
        }

        // Monitor DOM ready time impact
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
                    metric: 'dom_content_loaded',
                    timestamp: Date.now(),
                    value: performance.now()
                });
            });
        }
    }

    /**
     * Handle tracking errors with retry logic
     */
    handleError(errorType, errorData) {
        const error = {
            id: this.generateErrorId(),
            type: errorType,
            timestamp: Date.now(),
            data: errorData,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            retryCount: 0
        };

        console.error(`Tracking error [${errorType}]:`, errorData);

        // Store error
        this.storeError(error);

        // Notify error callbacks
        this.notifyErrorCallbacks(error);

        // Attempt retry for retryable errors
        if (this.isRetryableError(errorType)) {
            this.scheduleRetry(error);
        }

        // Check if error rate is too high
        this.checkErrorRate();
    }

    /**
     * Store error in local storage
     */
    storeError(error) {
        try {
            this.errorQueue.push(error);

            // Limit queue size
            if (this.errorQueue.length > PERFORMANCE_CONFIG.MAX_STORED_ERRORS) {
                this.errorQueue = this.errorQueue.slice(-PERFORMANCE_CONFIG.MAX_STORED_ERRORS);
            }

            // Store in localStorage (browser only) - but not when page is hidden
            if (typeof localStorage !== 'undefined' && this.isPageVisible && !document.hidden) {
                localStorage.setItem(STORAGE_KEYS.ERROR_LOG, JSON.stringify(this.errorQueue));
            }
        } catch (storageError) {
            // Don't log storage errors when page is hidden to prevent cascading errors
            if (this.isPageVisible && !document.hidden) {
                console.warn('Failed to store error:', storageError);
            }
        }
    }

    /**
     * Check if error type is retryable
     */
    isRetryableError(errorType) {
        const retryableErrors = [
            ERROR_TYPES.NETWORK_ERROR,
            ERROR_TYPES.TRACKING_FAILURE,
            ERROR_TYPES.SCRIPT_LOAD_FAILURE
        ];
        return retryableErrors.includes(errorType);
    }

    /**
     * Schedule retry for failed operation
     */
    scheduleRetry(error) {
        if (error.retryCount >= PERFORMANCE_CONFIG.MAX_RETRIES) {
            console.error(`Max retries exceeded for error ${error.id}`);
            return;
        }

        const delay = PERFORMANCE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, error.retryCount);

        const timeoutId = setTimeout(() => {
            // Don't retry if page is hidden
            if (this.isPageVisible && !document.hidden) {
                this.retryFailedOperation(error);
            } else {
                console.log(`Skipping retry for error ${error.id} - page is hidden`);
            }
        }, delay);

        this.timeouts.push(timeoutId);
        console.log(`Scheduled retry for error ${error.id} in ${delay}ms`);
    }

    /**
     * Retry failed operation
     */
    async retryFailedOperation(error) {
        error.retryCount++;

        try {
            let success = false;

            switch (error.type) {
                case ERROR_TYPES.SCRIPT_LOAD_FAILURE:
                    success = await this.retryScriptLoad(error.data);
                    break;
                case ERROR_TYPES.TRACKING_FAILURE:
                    success = await this.retryTrackingCall(error.data);
                    break;
                case ERROR_TYPES.NETWORK_ERROR:
                    success = await this.retryNetworkOperation(error.data);
                    break;
                default:
                    console.warn(`No retry handler for error type: ${error.type}`);
                    return;
            }

            if (success) {
                console.log(`Retry successful for error ${error.id}`);
                this.recordMetric(METRIC_TYPES.SUCCESS_RATE, {
                    errorId: error.id,
                    retryCount: error.retryCount,
                    timestamp: Date.now()
                });
            } else {
                console.log(`Retry failed for error ${error.id}`);
                this.scheduleRetry(error);
            }
        } catch (retryError) {
            console.error(`Retry attempt failed for error ${error.id}:`, retryError);
            this.scheduleRetry(error);
        }
    }

    /**
     * Retry script loading
     */
    async retryScriptLoad(errorData) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = errorData.script || errorData.url;
            script.async = true;

            const timeout = setTimeout(() => {
                resolve(false);
            }, PERFORMANCE_CONFIG.SCRIPT_LOAD_TIMEOUT);

            script.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };

            script.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Retry tracking call
     */
    async retryTrackingCall(errorData) {
        try {
            if (window.gtag && errorData.args) {
                window.gtag(...errorData.args);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Retry tracking call failed:', error);
            return false;
        }
    }

    /**
     * Retry network operation
     */
    async retryNetworkOperation(errorData) {
        try {
            // This would retry specific network operations
            // Implementation depends on the specific operation
            console.log('Retrying network operation:', errorData);
            return true;
        } catch (error) {
            console.error('Retry network operation failed:', error);
            return false;
        }
    }

    /**
     * Record performance metric
     */
    recordMetric(metricType, metricData) {
        const metric = {
            id: this.generateMetricId(),
            type: metricType,
            timestamp: Date.now(),
            data: metricData
        };

        this.metricsQueue.push(metric);

        // Limit queue size
        if (this.metricsQueue.length > 1000) {
            this.metricsQueue = this.metricsQueue.slice(-1000);
        }

        // Store metrics periodically
        if (this.metricsQueue.length % 10 === 0) {
            this.storeMetrics();
        }
    }

    /**
     * Store metrics in local storage
     */
    storeMetrics() {
        try {
            // Don't store when page is hidden to prevent errors
            if (typeof localStorage !== 'undefined' && this.isPageVisible && !document.hidden) {
                localStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(this.metricsQueue));
            }
        } catch (error) {
            // Don't log storage errors when page is hidden
            if (this.isPageVisible && !document.hidden) {
                console.warn('Failed to store metrics:', error);
            }
        }
    }

    /**
     * Check error rate and alert if too high
     */
    checkErrorRate() {
        // Prevent infinite recursion by checking if we're already in error rate check
        if (this._checkingErrorRate) {
            return;
        }

        this._checkingErrorRate = true;

        try {
            const recentErrors = this.getRecentErrors(5 * 60 * 1000); // Last 5 minutes
            const errorRate = recentErrors.length;

            if (errorRate > 10) {
                // Don't trigger another error rate check when handling this error
                const error = {
                    id: this.generateErrorId(),
                    type: ERROR_TYPES.CONFIGURATION_ERROR,
                    timestamp: Date.now(),
                    data: {
                        message: 'High error rate detected',
                        errorRate: errorRate,
                        recentErrors: recentErrors.length
                    },
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                    retryCount: 0
                };

                console.error(`Tracking error [${error.type}]:`, error.data);
                this.storeError(error);
                this.notifyErrorCallbacks(error);
            }

            this.recordMetric(METRIC_TYPES.ERROR_RATE, {
                errorRate: errorRate,
                timestamp: Date.now()
            });
        } finally {
            this._checkingErrorRate = false;
        }
    }

    /**
     * Get recent errors within time window
     */
    getRecentErrors(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.errorQueue.filter(error => error.timestamp > cutoff);
    }

    /**
     * Set up page visibility handling
     */
    setupPageVisibilityHandling() {
        if (typeof document === 'undefined') return;

        // Handle page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Handle page focus/blur
        window.addEventListener('blur', () => {
            this.isPageVisible = false;
        });

        window.addEventListener('focus', () => {
            this.isPageVisible = true;
        });
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        this.isPageVisible = !document.hidden;

        if (document.hidden) {
            console.log('Page hidden - pausing performance monitoring');
            this.pausePeriodicTasks();
        } else {
            console.log('Page visible - resuming performance monitoring');
            this.resumePeriodicTasks();
        }
    }

    /**
     * Start periodic tasks
     */
    startPeriodicTasks() {
        // Only start if page is visible
        if (!this.isPageVisible) return;

        // Periodic metrics collection
        const metricsInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                this.collectPerformanceMetrics();
            }
        }, PERFORMANCE_CONFIG.METRICS_COLLECTION_INTERVAL);
        this.intervals.push(metricsInterval);

        // Periodic cleanup
        const cleanupInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                this.cleanupOldData();
            }
        }, 60 * 60 * 1000); // Every hour
        this.intervals.push(cleanupInterval);

        // Periodic error reporting
        const reportingInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                this.reportErrors();
            }
        }, 5 * 60 * 1000); // Every 5 minutes
        this.intervals.push(reportingInterval);
    }

    /**
     * Pause periodic tasks when page is hidden
     */
    pausePeriodicTasks() {
        this.intervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = [];

        this.timeouts.forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        this.timeouts = [];
    }

    /**
     * Resume periodic tasks when page becomes visible
     */
    resumePeriodicTasks() {
        // Clear any existing intervals first
        this.pausePeriodicTasks();

        // Restart periodic tasks
        this.startPeriodicTasks();
    }

    /**
     * Collect current performance metrics
     */
    collectPerformanceMetrics() {
        // Don't collect metrics if page is hidden
        if (!this.isPageVisible || document.hidden) {
            return;
        }

        try {
            // Collect memory usage if available
            if (performance.memory) {
                this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
                    metric: 'memory_usage',
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                });
            }

            // Collect navigation timing
            if (performance.navigation) {
                this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
                    metric: 'navigation_timing',
                    type: performance.navigation.type,
                    redirectCount: performance.navigation.redirectCount,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn('Error collecting performance metrics:', error);
        }
    }

    /**
     * Clean up old data
     */
    cleanupOldData() {
        const cutoff = Date.now() - PERFORMANCE_CONFIG.DATA_RETENTION_PERIOD;

        // Clean up old errors
        this.errorQueue = this.errorQueue.filter(error => error.timestamp > cutoff);

        // Clean up old metrics
        this.metricsQueue = this.metricsQueue.filter(metric => metric.timestamp > cutoff);

        // Update storage
        this.storeError({ timestamp: Date.now() }); // Trigger storage update
        this.storeMetrics();

        console.log('Performance data cleanup completed');
    }

    /**
     * Report errors to external service (if configured)
     */
    reportErrors() {
        // Don't report errors if page is hidden or privacy doesn't allow
        if (!this.isPageVisible || document.hidden || !privacyManager.canTrackAnalytics()) {
            return;
        }

        try {
            const unreportedErrors = this.errorQueue.filter(error => !error.reported);

            if (unreportedErrors.length === 0) {
                return;
            }

            // Batch errors for reporting
            const batch = unreportedErrors.slice(0, PERFORMANCE_CONFIG.ERROR_BATCH_SIZE);

            // Mark as reported
            batch.forEach(error => {
                error.reported = true;
            });

            console.log(`Reporting ${batch.length} errors`);

            // In a real implementation, this would send to an external service
            // For now, we'll just log the errors
            this.logErrorBatch(batch);
        } catch (error) {
            console.warn('Error reporting failed:', error);
        }
    }

    /**
     * Log error batch for debugging
     */
    logErrorBatch(errors) {
        // Don't log if page is hidden to prevent errors
        if (!this.isPageVisible || document.hidden) {
            return;
        }

        try {
            console.group('Error Batch Report');
            errors.forEach(error => {
                console.error(`[${error.type}] ${error.data.message || 'Unknown error'}`, error);
            });
            console.groupEnd();
        } catch (error) {
            console.warn('Error logging batch failed:', error);
        }
    }

    /**
     * Cleanup all intervals and timeouts
     */
    cleanup() {
        console.log('Cleaning up performance monitor');

        // Clear all intervals
        this.intervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = [];

        // Clear all timeouts
        this.timeouts.forEach(timeout => {
            if (timeout) clearTimeout(timeout);
        });
        this.timeouts = [];

        // Remove event listeners
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }

        if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this.cleanup);
            window.removeEventListener('blur', this.handleVisibilityChange);
            window.removeEventListener('focus', this.handleVisibilityChange);
        }
    }

    /**
     * Load stored data on initialization
     */
    loadStoredData() {
        try {
            // Load errors
            const storedErrors = localStorage.getItem(STORAGE_KEYS.ERROR_LOG);
            if (storedErrors) {
                this.errorQueue = JSON.parse(storedErrors);
            }

            // Load metrics
            const storedMetrics = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_METRICS);
            if (storedMetrics) {
                this.metricsQueue = JSON.parse(storedMetrics);
            }

            console.log(`Loaded ${this.errorQueue.length} errors and ${this.metricsQueue.length} metrics`);
        } catch (error) {
            console.error('Failed to load stored performance data:', error);
        }
    }

    /**
     * Register error callback
     */
    onError(callback) {
        const callbackId = Date.now() + Math.random();
        this.errorCallbacks.set(callbackId, callback);
        return callbackId;
    }

    /**
     * Unregister error callback
     */
    offError(callbackId) {
        this.errorCallbacks.delete(callbackId);
    }

    /**
     * Notify error callbacks
     */
    notifyErrorCallbacks(error) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
    }

    /**
     * Register performance callback
     */
    onPerformanceMetric(callback) {
        const callbackId = Date.now() + Math.random();
        this.performanceCallbacks.set(callbackId, callback);
        return callbackId;
    }

    /**
     * Unregister performance callback
     */
    offPerformanceMetric(callbackId) {
        this.performanceCallbacks.delete(callbackId);
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const recentMetrics = this.metricsQueue.filter(
            metric => metric.timestamp > Date.now() - (24 * 60 * 60 * 1000)
        );

        const recentErrors = this.getRecentErrors(24 * 60 * 60 * 1000);

        return {
            totalMetrics: this.metricsQueue.length,
            recentMetrics: recentMetrics.length,
            totalErrors: this.errorQueue.length,
            recentErrors: recentErrors.length,
            errorRate: recentErrors.length / Math.max(recentMetrics.length, 1),
            scriptLoadTimes: Array.from(this.scriptLoadTimes.values()),
            trackingCallTimes: Array.from(this.trackingCallTimes.values())
        };
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique metric ID
     */
    generateMetricId() {
        return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Clear all performance data
     */
    clearAllData() {
        this.errorQueue = [];
        this.metricsQueue = [];
        this.scriptLoadTimes.clear();
        this.trackingCallTimes.clear();

        // Clear storage (browser only)
        if (typeof localStorage !== 'undefined') {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        }

        console.log('All performance data cleared');
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;