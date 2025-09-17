/**
 * Main Performance Monitor Service
 * 
 * Handles performance monitoring, error tracking, and alerting for Google Ads analytics integration
 * Requirements: 1.1, 2.2, 4.3
 */

import type { PerformanceSummary, PerformanceError, PerformanceMetric } from './types';
import { STORAGE_KEYS } from './constants';
import { errorHandlingService } from './errorHandlingService';
import { metricsService } from './metricsService';
import { reportingService } from './reportingService';
import { lifecycleService } from './lifecycleService';
import { storageService } from '../shared/storageService';

export class PerformanceMonitor {
    private initialized: boolean = false;

    constructor() {
        // Bind methods to preserve context
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Initialize performance monitoring
     */
    initialize(): void {
        if (this.initialized) return;

        console.log('Initializing Performance Monitor');

        // Start periodic tasks
        this.startPeriodicTasks();

        // Register cleanup
        lifecycleService.onCleanup(() => {
            errorHandlingService.cleanup();
            reportingService.cleanup();
        });

        this.initialized = true;
        console.log('Performance Monitor initialized');
    }

    /**
     * Start periodic tasks
     */
    private startPeriodicTasks(): void {
        lifecycleService.startPeriodicTasks(
            () => metricsService.collectPerformanceMetrics(),
            () => this.cleanupOldData(),
            () => this.reportErrors()
        );

        // Start periodic error reporting
        reportingService.startPeriodicReporting();
    }

    /**
     * Handle tracking errors (public method for external use)
     */
    handleError(errorType: any, errorData: Record<string, any>): void {
        errorHandlingService.handleError(errorType, errorData);
    }

    /**
     * Record performance metric (public method for external use)
     */
    recordMetric(metricType: any, metricData: Record<string, any>): void {
        metricsService.recordMetric(metricType, metricData);
    }

    /**
     * Clean up old data
     */
    private cleanupOldData(): void {
        errorHandlingService.getRecentErrors(0); // This will trigger cleanup internally
        metricsService.cleanupOldMetrics();
        console.log('Performance data cleanup completed');
    }

    /**
     * Report errors to external service
     */
    private reportErrors(): void {
        if (!lifecycleService.isVisible()) return;

        const unreportedErrors = errorHandlingService.getAllErrors().filter(error => !error.reported);
        if (unreportedErrors.length > 0) {
            reportingService.processErrorBatch(unreportedErrors);
        }
    }

    /**
     * Register error callback
     */
    onError(callback: (error: PerformanceError) => void): number {
        return errorHandlingService.onError(callback);
    }

    /**
     * Unregister error callback
     */
    offError(callbackId: number): void {
        errorHandlingService.offError(callbackId);
    }

    /**
     * Register performance callback
     */
    onPerformanceMetric(callback: (metric: PerformanceMetric) => void): number {
        return metricsService.onPerformanceMetric(callback);
    }

    /**
     * Unregister performance callback
     */
    offPerformanceMetric(callbackId: number): void {
        metricsService.offPerformanceMetric(callbackId);
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): PerformanceSummary {
        const allMetrics = metricsService.getAllMetrics();
        const allErrors = errorHandlingService.getAllErrors();

        const recentMetrics = allMetrics.filter(
            metric => metric.timestamp > Date.now() - (24 * 60 * 60 * 1000)
        );

        const recentErrors = errorHandlingService.getRecentErrors(24 * 60 * 60 * 1000);

        return {
            totalMetrics: allMetrics.length,
            recentMetrics: recentMetrics.length,
            totalErrors: allErrors.length,
            recentErrors: recentErrors.length,
            errorRate: recentErrors.length / Math.max(recentMetrics.length, 1),
            scriptLoadTimes: metricsService.getScriptLoadTimes(),
            trackingCallTimes: metricsService.getTrackingCallTimes()
        };
    }

    /**
     * Get current session data
     */
    getCurrentSessionData() {
        return lifecycleService.getCurrentSessionData();
    }

    /**
     * Clear all performance data
     */
    clearAllData(): void {
        errorHandlingService.clearErrors();
        metricsService.clearMetrics();

        // Clear additional storage
        storageService.removeItems(Object.values(STORAGE_KEYS));

        console.log('All performance data cleared');
    }

    /**
     * Cleanup (called on page unload)
     */
    cleanup(): void {
        lifecycleService.cleanup();
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Re-export types and constants for convenience
export type {
    PerformanceError,
    PerformanceMetric,
    PerformanceSummary,
    ScriptLoadData,
    TrackingCallData,
    ErrorType,
    MetricType
} from './types';

export { ERROR_TYPES, METRIC_TYPES } from './types';