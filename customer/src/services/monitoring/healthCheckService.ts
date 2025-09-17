/**
 * Health Check Service for Production Monitoring
 * Reuses performance monitoring and other existing services
 */

import type { HealthCheck, DeepHealthCheck, PerformanceMetrics } from './types';
import { HEALTH_STATUS } from './types';
import { PRODUCTION_CONFIG, REQUIRED_ENV_VARS, REQUIRED_CONVERSION_LABELS, REQUIRED_TOUR_LABELS, PLACEHOLDER_VALUES } from './constants';
import performanceMonitor from '../performance';
import privacyManager from '../privacyManager';

export class HealthCheckService {
    /**
     * Perform basic health check
     */
    async performHealthCheck(): Promise<HealthCheck> {
        const healthCheck: HealthCheck = {
            timestamp: Date.now(),
            status: HEALTH_STATUS.HEALTHY,
            checks: {},
            issues: []
        };

        try {
            // Check if gtag is available
            healthCheck.checks.gtag_available = typeof window.gtag === 'function';
            if (!healthCheck.checks.gtag_available) {
                healthCheck.issues.push('gtag function not available');
                healthCheck.status = HEALTH_STATUS.CRITICAL;
            }

            // Check Google Analytics configuration
            healthCheck.checks.ga4_configured = !!process.env.REACT_APP_GA_MEASUREMENT_ID;
            if (!healthCheck.checks.ga4_configured) {
                healthCheck.issues.push('GA4 measurement ID not configured');
                healthCheck.status = HEALTH_STATUS.WARNING;
            }

            // Check Google Ads configuration
            healthCheck.checks.google_ads_configured = !!process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
            if (!healthCheck.checks.google_ads_configured) {
                healthCheck.issues.push('Google Ads conversion ID not configured');
                healthCheck.status = HEALTH_STATUS.CRITICAL;
            }

            // Check privacy compliance
            healthCheck.checks.privacy_manager_available = privacyManager && typeof privacyManager.canTrackAnalytics === 'function';
            if (!healthCheck.checks.privacy_manager_available) {
                healthCheck.issues.push('Privacy manager not available');
                healthCheck.status = HEALTH_STATUS.WARNING;
            }

            // Check performance monitor
            try {
                const summary = performanceMonitor.getPerformanceSummary();
                healthCheck.checks.performance_monitor_available = !!summary;
            } catch (error) {
                healthCheck.checks.performance_monitor_available = false;
                healthCheck.issues.push('Performance monitor not initialized');
                healthCheck.status = HEALTH_STATUS.WARNING;
            }

            // Check recent error rate using performance monitor
            try {
                const summary = performanceMonitor.getPerformanceSummary();
                healthCheck.checks.error_rate = summary.errorRate;
                healthCheck.checks.error_rate_healthy = summary.errorRate < PRODUCTION_CONFIG.ERROR_RATE_THRESHOLD;

                if (!healthCheck.checks.error_rate_healthy) {
                    healthCheck.issues.push(`High error rate: ${(summary.errorRate * 100).toFixed(2)}%`);
                    healthCheck.status = HEALTH_STATUS.CRITICAL;
                }
            } catch (error) {
                healthCheck.checks.error_rate_healthy = false;
                healthCheck.issues.push('Unable to check error rate');
            }

            console.log(`Health check completed: ${healthCheck.status}`, healthCheck);

        } catch (error) {
            healthCheck.status = HEALTH_STATUS.CRITICAL;
            healthCheck.issues.push(`Health check error: ${(error as Error).message}`);
            console.error('Health check failed:', error);
        }

        return healthCheck;
    }

    /**
     * Perform deep health check with detailed validation
     */
    async performDeepHealthCheck(): Promise<DeepHealthCheck> {
        console.log('Performing deep health check');

        const deepCheck: DeepHealthCheck = {
            timestamp: Date.now(),
            status: HEALTH_STATUS.HEALTHY,
            checks: {},
            performance: {} as PerformanceMetrics,
            issues: []
        };

        try {
            // Validate tracking script loading
            deepCheck.checks.scripts_loaded = await this.validateScriptLoading();

            // Validate conversion tracking setup
            deepCheck.checks.conversion_tracking = await this.validateConversionTracking();

            // Validate remarketing setup
            deepCheck.checks.remarketing_setup = await this.validateRemarketingSetup();

            // Check performance metrics
            deepCheck.performance = this.getPerformanceMetrics();

            // Validate data layer
            deepCheck.checks.data_layer = this.validateDataLayer();

            // Check for configuration issues
            deepCheck.checks.configuration = this.validateConfiguration();

            // Determine overall status
            const failedChecks = Object.entries(deepCheck.checks).filter(([, value]) => !value);
            if (failedChecks.length > 0) {
                deepCheck.status = failedChecks.length > 2 ? HEALTH_STATUS.CRITICAL : HEALTH_STATUS.WARNING;
                deepCheck.issues = failedChecks.map(([key]) => `Failed check: ${key}`);
            }

            // Check performance thresholds
            if (deepCheck.performance.avgScriptLoadTime > PRODUCTION_CONFIG.SCRIPT_LOAD_TIME_THRESHOLD) {
                deepCheck.status = HEALTH_STATUS.WARNING;
                deepCheck.issues.push('Slow script loading detected');
            }

            if (deepCheck.performance.avgTrackingCallTime > PRODUCTION_CONFIG.TRACKING_CALL_TIME_THRESHOLD) {
                deepCheck.status = HEALTH_STATUS.WARNING;
                deepCheck.issues.push('Slow tracking calls detected');
            }

            console.log(`Deep health check completed: ${deepCheck.status}`, deepCheck);

        } catch (error) {
            deepCheck.status = HEALTH_STATUS.CRITICAL;
            deepCheck.issues.push(`Deep health check error: ${(error as Error).message}`);
            console.error('Deep health check failed:', error);
        }

        return deepCheck;
    }

    /**
     * Validate tracking script loading
     */
    private async validateScriptLoading(): Promise<boolean> {
        try {
            // Check if Google Analytics script is loaded
            const gaScriptLoaded = document.querySelector('script[src*="googletagmanager.com/gtag/js"]') !== null;

            // Check if gtag function is available
            const gtagAvailable = typeof window.gtag === 'function';

            // Check if dataLayer is available
            const dataLayerAvailable = Array.isArray(window.dataLayer);

            return gaScriptLoaded && gtagAvailable && dataLayerAvailable;
        } catch (error) {
            console.error('Script loading validation failed:', error);
            return false;
        }
    }

    /**
     * Validate conversion tracking setup
     */
    private async validateConversionTracking(): Promise<boolean> {
        try {
            const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
            const conversionLabels = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;

            if (!conversionId || PLACEHOLDER_VALUES.some(placeholder => conversionId.includes(placeholder))) {
                return false;
            }

            if (!conversionLabels || PLACEHOLDER_VALUES.some(placeholder => conversionLabels.includes(placeholder))) {
                return false;
            }

            // Try to parse conversion labels
            try {
                const labels = JSON.parse(conversionLabels);
                return REQUIRED_CONVERSION_LABELS.every(label =>
                    labels[label] && !PLACEHOLDER_VALUES.some(placeholder => labels[label].includes(placeholder))
                );
            } catch (parseError) {
                return false;
            }
        } catch (error) {
            console.error('Conversion tracking validation failed:', error);
            return false;
        }
    }

    /**
     * Validate remarketing setup
     */
    private async validateRemarketingSetup(): Promise<boolean> {
        try {
            // Check if remarketing audiences are configured
            const tourSpecificLabels = process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS;

            if (!tourSpecificLabels || PLACEHOLDER_VALUES.some(placeholder => tourSpecificLabels.includes(placeholder))) {
                return false;
            }

            // Validate tour-specific labels
            try {
                const labels = JSON.parse(tourSpecificLabels);
                return REQUIRED_TOUR_LABELS.every(label =>
                    labels[label] && !PLACEHOLDER_VALUES.some(placeholder => labels[label].includes(placeholder))
                );
            } catch (parseError) {
                return false;
            }
        } catch (error) {
            console.error('Remarketing setup validation failed:', error);
            return false;
        }
    }

    /**
     * Validate data layer
     */
    private validateDataLayer(): boolean {
        try {
            if (!window.dataLayer || !Array.isArray(window.dataLayer)) {
                return false;
            }

            // Check if dataLayer has been initialized with gtag
            const hasGtagInit = window.dataLayer ? window.dataLayer.some(item =>
                Array.isArray(item) && item[0] === 'js'
            ) : false;

            return hasGtagInit;
        } catch (error) {
            console.error('Data layer validation failed:', error);
            return false;
        }
    }

    /**
     * Validate configuration
     */
    private validateConfiguration(): boolean {
        try {
            return REQUIRED_ENV_VARS.every(envVar => {
                const value = process.env[envVar];
                return value && !PLACEHOLDER_VALUES.some(placeholder => value.includes(placeholder));
            });
        } catch (error) {
            console.error('Configuration validation failed:', error);
            return false;
        }
    }

    /**
     * Get performance metrics summary (reusing performance monitor)
     */
    private getPerformanceMetrics(): PerformanceMetrics {
        try {
            const performanceSummary = performanceMonitor.getPerformanceSummary();

            return {
                totalErrors: performanceSummary.totalErrors,
                recentErrors: performanceSummary.recentErrors,
                errorRate: performanceSummary.errorRate,
                avgScriptLoadTime: this.calculateAverageLoadTime(performanceSummary.scriptLoadTimes),
                avgTrackingCallTime: this.calculateAverageCallTime(performanceSummary.trackingCallTimes),
                totalMetrics: performanceSummary.totalMetrics,
                recentMetrics: performanceSummary.recentMetrics
            };
        } catch (error) {
            console.error('Failed to get performance metrics:', error);
            return {
                totalErrors: 0,
                recentErrors: 0,
                errorRate: 0,
                avgScriptLoadTime: 0,
                avgTrackingCallTime: 0,
                totalMetrics: 0,
                recentMetrics: 0
            };
        }
    }

    /**
     * Calculate average script load time
     */
    private calculateAverageLoadTime(scriptLoadTimes: any[]): number {
        if (!scriptLoadTimes || scriptLoadTimes.length === 0) return 0;

        const totalTime = scriptLoadTimes.reduce((sum, script) => sum + script.loadTime, 0);
        return totalTime / scriptLoadTimes.length;
    }

    /**
     * Calculate average tracking call time
     */
    private calculateAverageCallTime(trackingCallTimes: any[]): number {
        if (!trackingCallTimes || trackingCallTimes.length === 0) return 0;

        const totalTime = trackingCallTimes.reduce((sum, call) => sum + call.callTime, 0);
        return totalTime / trackingCallTimes.length;
    }
}

export const healthCheckService = new HealthCheckService();