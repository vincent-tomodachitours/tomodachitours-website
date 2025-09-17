/**
 * Metrics Collection Service for Performance Monitor
 */

import type { PerformanceMetric, MetricType, ScriptLoadData, TrackingCallData } from './types';
import { METRIC_TYPES, PERFORMANCE_CONFIG, STORAGE_KEYS, TRACKING_DOMAINS } from './constants';
import { storageService } from '../shared/storageService';

export class MetricsService {
    private metricsQueue: PerformanceMetric[] = [];
    private scriptLoadTimes: Map<string, ScriptLoadData> = new Map();
    private trackingCallTimes: Map<string, TrackingCallData> = new Map();
    private performanceCallbacks: Map<number, (metric: PerformanceMetric) => void> = new Map();

    constructor() {
        this.setupPerformanceMonitoring();
        this.loadStoredMetrics();
    }

    /**
     * Set up performance monitoring for tracking scripts
     */
    private setupPerformanceMonitoring(): void {
        this.monitorScriptLoading();
        this.monitorTrackingCalls();
        this.monitorPagePerformance();
    }

    /**
     * Monitor script loading performance
     */
    private monitorScriptLoading(): void {
        if (typeof PerformanceObserver === 'undefined') return;

        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (this.isTrackingScript(entry.name)) {
                    const resourceEntry = entry as PerformanceResourceTiming;
                    const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;
                    this.recordScriptLoadTime(entry.name, loadTime);
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
    private isTrackingScript(url: string): boolean {
        return TRACKING_DOMAINS.some(domain => url.includes(domain));
    }

    /**
     * Record script load time
     */
    private recordScriptLoadTime(scriptUrl: string, loadTime: number): void {
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
    private getScriptName(url: string): string {
        if (url.includes('gtag')) return 'gtag';
        if (url.includes('gtm')) return 'google_tag_manager';
        if (url.includes('analytics')) return 'google_analytics';
        if (url.includes('googleadservices')) return 'google_ads';
        return 'unknown_tracking_script';
    }

    /**
     * Monitor tracking call performance
     */
    private monitorTrackingCalls(): void {
        if (typeof window === 'undefined' || !window.gtag) return;

        // Wrap gtag function to monitor performance
        const originalGtag = window.gtag;
        window.gtag = (...args: any[]) => {
            const startTime = performance.now();

            try {
                const result = originalGtag.apply(this, args);
                const endTime = performance.now();
                const callTime = endTime - startTime;

                this.recordTrackingCallTime(args[0], callTime);
                return result;
            } catch (error) {
                // Let error handling service handle this
                throw error;
            }
        };
    }

    /**
     * Record tracking call performance
     */
    private recordTrackingCallTime(eventType: string, callTime: number): void {
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
    }

    /**
     * Monitor page performance impact of tracking scripts
     */
    private monitorPagePerformance(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

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
     * Record performance metric
     */
    recordMetric(metricType: MetricType, metricData: Record<string, any>): void {
        const metric: PerformanceMetric = {
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

        // Notify callbacks
        this.notifyPerformanceCallbacks(metric);

        // Store metrics periodically
        if (this.metricsQueue.length % 10 === 0) {
            this.storeMetrics();
        }
    }

    /**
     * Store metrics in local storage
     */
    private storeMetrics(): void {
        storageService.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, this.metricsQueue);
    }

    /**
     * Collect current performance metrics
     */
    collectPerformanceMetrics(): void {
        if (!storageService.getPageVisibility()) return;

        try {
            // Collect memory usage if available
            if ((performance as any).memory) {
                this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
                    metric: 'memory_usage',
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                    timestamp: Date.now()
                });
            }

            // Collect navigation timing
            if ((performance as any).navigation) {
                this.recordMetric(METRIC_TYPES.SCRIPT_LOAD_TIME, {
                    metric: 'navigation_timing',
                    type: (performance as any).navigation.type,
                    redirectCount: (performance as any).navigation.redirectCount,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn('Error collecting performance metrics:', error);
        }
    }

    /**
     * Clean up old metrics
     */
    cleanupOldMetrics(): void {
        const cutoff = Date.now() - PERFORMANCE_CONFIG.DATA_RETENTION_PERIOD;
        this.metricsQueue = this.metricsQueue.filter(metric => metric.timestamp > cutoff);
        this.storeMetrics();
    }

    /**
     * Load stored metrics on initialization
     */
    private loadStoredMetrics(): void {
        const storedMetrics = storageService.getItem<PerformanceMetric[]>(STORAGE_KEYS.PERFORMANCE_METRICS, []);
        if (storedMetrics) {
            this.metricsQueue = storedMetrics;
        }
    }

    /**
     * Register performance callback
     */
    onPerformanceMetric(callback: (metric: PerformanceMetric) => void): number {
        const callbackId = Date.now() + Math.random();
        this.performanceCallbacks.set(callbackId, callback);
        return callbackId;
    }

    /**
     * Unregister performance callback
     */
    offPerformanceMetric(callbackId: number): void {
        this.performanceCallbacks.delete(callbackId);
    }

    /**
     * Notify performance callbacks
     */
    private notifyPerformanceCallbacks(metric: PerformanceMetric): void {
        this.performanceCallbacks.forEach(callback => {
            try {
                callback(metric);
            } catch (callbackError) {
                console.error('Error in performance callback:', callbackError);
            }
        });
    }

    /**
     * Generate unique metric ID
     */
    private generateMetricId(): string {
        return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all metrics
     */
    getAllMetrics(): PerformanceMetric[] {
        return [...this.metricsQueue];
    }

    /**
     * Get script load times
     */
    getScriptLoadTimes(): ScriptLoadData[] {
        return Array.from(this.scriptLoadTimes.values());
    }

    /**
     * Get tracking call times
     */
    getTrackingCallTimes(): TrackingCallData[] {
        return Array.from(this.trackingCallTimes.values());
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metricsQueue = [];
        this.scriptLoadTimes.clear();
        this.trackingCallTimes.clear();
        storageService.removeItem(STORAGE_KEYS.PERFORMANCE_METRICS);
    }
}

export const metricsService = new MetricsService();