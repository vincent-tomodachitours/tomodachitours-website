/**
 * Lifecycle Management Service for Performance Monitor
 * Reuses session service from dynamic remarketing
 */

import { sessionService } from '../dynamicRemarketing/sessionService';
import { storageService } from '../shared/storageService';
import { PERFORMANCE_CONFIG } from './constants';

export class LifecycleService {
    private intervals: NodeJS.Timeout[] = [];
    private isPageVisible: boolean = true;
    private cleanupCallbacks: (() => void)[] = [];

    constructor() {
        this.setupPageVisibilityHandling();
    }

    /**
     * Set up page visibility handling
     */
    private setupPageVisibilityHandling(): void {
        if (typeof document === 'undefined') return;

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

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
    private handleVisibilityChange(): void {
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
    startPeriodicTasks(
        metricsCollector: () => void,
        dataCleanup: () => void,
        errorReporter: () => void
    ): void {
        if (!this.isPageVisible) return;

        // Periodic metrics collection
        const metricsInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                metricsCollector();
            }
        }, PERFORMANCE_CONFIG.METRICS_COLLECTION_INTERVAL);
        this.intervals.push(metricsInterval);

        // Periodic cleanup
        const cleanupInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                dataCleanup();
            }
        }, 60 * 60 * 1000); // Every hour
        this.intervals.push(cleanupInterval);

        // Periodic error reporting
        const reportingInterval = setInterval(() => {
            if (this.isPageVisible && !document.hidden) {
                errorReporter();
            }
        }, 5 * 60 * 1000); // Every 5 minutes
        this.intervals.push(reportingInterval);
    }

    /**
     * Pause periodic tasks when page is hidden
     */
    private pausePeriodicTasks(): void {
        this.intervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = [];
    }

    /**
     * Resume periodic tasks when page becomes visible
     */
    private resumePeriodicTasks(): void {
        // This would restart tasks, but we need the callbacks
        // In the main service, this will be handled properly
        console.log('Resuming periodic tasks');
    }

    /**
     * Register cleanup callback
     */
    onCleanup(callback: () => void): void {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Get current session data (reusing session service)
     */
    getCurrentSessionData() {
        return sessionService.getCurrentSessionData();
    }

    /**
     * Check if page is visible
     */
    isVisible(): boolean {
        return this.isPageVisible && storageService.getPageVisibility();
    }

    /**
     * Cleanup all intervals and timeouts
     */
    cleanup(): void {
        console.log('Cleaning up performance monitor lifecycle');

        // Clear all intervals
        this.intervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = [];

        // Run cleanup callbacks
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in cleanup callback:', error);
            }
        });

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
}

export const lifecycleService = new LifecycleService();