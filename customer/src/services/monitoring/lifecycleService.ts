/**
 * Lifecycle Service for Production Monitoring
 * Reuses lifecycle patterns from performance monitoring
 */

import { PRODUCTION_CONFIG } from './constants';
import { lifecycleService as performanceLifecycleService } from '../performance/lifecycleService';

export class MonitoringLifecycleService {
    private intervals: NodeJS.Timeout[] = [];
    private isInitialized: boolean = false;
    private cleanupCallbacks: (() => void)[] = [];

    /**
     * Initialize monitoring lifecycle
     */
    initialize(): boolean {
        // Only initialize in production environment
        if (process.env.NODE_ENV !== 'production' &&
            process.env.REACT_APP_ENVIRONMENT !== 'production') {
            console.log('Production monitoring disabled in non-production environment');
            return false;
        }

        if (this.isInitialized) {
            console.log('Monitoring lifecycle already initialized');
            return true;
        }

        this.isInitialized = true;
        console.log('Monitoring lifecycle initialized');
        return true;
    }

    /**
     * Start periodic health checks
     */
    startHealthChecks(
        healthCheckCallback: () => Promise<void>,
        deepHealthCheckCallback: () => Promise<void>
    ): void {
        if (!this.isInitialized) return;

        // Regular health checks
        const healthCheckInterval = setInterval(() => {
            if (performanceLifecycleService.isVisible()) {
                healthCheckCallback().catch(error => {
                    console.error('Health check callback failed:', error);
                });
            }
        }, PRODUCTION_CONFIG.HEALTH_CHECK_INTERVAL);

        this.intervals.push(healthCheckInterval);

        // Deep health checks
        const deepHealthCheckInterval = setInterval(() => {
            if (performanceLifecycleService.isVisible()) {
                deepHealthCheckCallback().catch(error => {
                    console.error('Deep health check callback failed:', error);
                });
            }
        }, PRODUCTION_CONFIG.DEEP_HEALTH_CHECK_INTERVAL);

        this.intervals.push(deepHealthCheckInterval);

        console.log('Health check intervals started');
    }

    /**
     * Setup monitoring integrations
     */
    setupMonitoringIntegrations(
        errorCallback: (error: any) => void,
        metricCallback: (metric: any) => void
    ): void {
        if (!this.isInitialized) return;

        // Import performance monitor dynamically to avoid circular dependencies
        import('../performance').then(({ default: performanceMonitor }) => {
            // Listen to performance monitor errors
            performanceMonitor.onError((error: any) => {
                errorCallback(error);
            });

            // Monitor performance metrics
            performanceMonitor.onPerformanceMetric((metric: any) => {
                metricCallback(metric);
            });

            console.log('Monitoring integrations setup completed');
        }).catch(error => {
            console.error('Failed to setup monitoring integrations:', error);
        });
    }

    /**
     * Register cleanup callback
     */
    onCleanup(callback: () => void): void {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Check if monitoring should be active
     */
    isActive(): boolean {
        return this.isInitialized && performanceLifecycleService.isVisible();
    }

    /**
     * Get current session data (reusing from performance lifecycle)
     */
    getCurrentSessionData() {
        return performanceLifecycleService.getCurrentSessionData();
    }

    /**
     * Stop monitoring
     */
    stop(): void {
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

        this.isInitialized = false;
        console.log('Production monitoring stopped');
    }

    /**
     * Cleanup on page unload
     */
    cleanup(): void {
        this.stop();
    }
}

export const monitoringLifecycleService = new MonitoringLifecycleService();