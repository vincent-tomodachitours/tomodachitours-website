/**
 * Production Monitoring and Alerting Service
 * Handles production-specific monitoring, alerting, and health checks for Google Ads tracking
 * Requirements: 1.2, 4.1, 7.1, 6.2
 */

import performanceMonitor, { ERROR_TYPES, METRIC_TYPES } from './performanceMonitor.js';
import privacyManager from './privacyManager.js';

// Production monitoring configuration
const PRODUCTION_CONFIG = {
    // Health check intervals
    HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
    DEEP_HEALTH_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes

    // Alert thresholds
    ERROR_RATE_THRESHOLD: 0.05, // 5% error rate
    SCRIPT_LOAD_TIME_THRESHOLD: 10000, // 10 seconds
    TRACKING_CALL_TIME_THRESHOLD: 2000, // 2 seconds
    CONVERSION_RATE_DROP_THRESHOLD: 0.3, // 30% drop in conversion rate

    // Monitoring endpoints
    HEALTH_CHECK_ENDPOINT: '/api/health/tracking',
    METRICS_ENDPOINT: '/api/metrics/tracking',
    ALERTS_ENDPOINT: '/api/alerts/tracking',

    // Alert channels
    ALERT_CHANNELS: {
        EMAIL: 'email',
        SLACK: 'slack',
        WEBHOOK: 'webhook'
    },

    // Data retention
    METRICS_RETENTION_DAYS: 30,
    ALERTS_RETENTION_DAYS: 90
};

// Alert severity levels
const ALERT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Health check status
const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    UNKNOWN: 'unknown'
};

class ProductionMonitor {
    constructor() {
        this.initialized = false;
        this.healthStatus = HEALTH_STATUS.UNKNOWN;
        this.lastHealthCheck = null;
        this.alertHistory = [];
        this.metricsHistory = [];
        this.activeAlerts = new Map();
        this.healthCheckInterval = null;
        this.deepHealthCheckInterval = null;

        // Bind methods
        this.performHealthCheck = this.performHealthCheck.bind(this);
        this.performDeepHealthCheck = this.performDeepHealthCheck.bind(this);
        this.handleAlert = this.handleAlert.bind(this);
    }

    /**
     * Initialize production monitoring
     */
    initialize() {
        if (this.initialized) return;

        // Only initialize in production environment
        if (process.env.NODE_ENV !== 'production' &&
            process.env.REACT_APP_ENVIRONMENT !== 'production') {
            console.log('Production monitoring disabled in non-production environment');
            return;
        }

        console.log('Initializing Production Monitor');

        // Set up health checks
        this.startHealthChecks();

        // Set up error monitoring
        this.setupErrorMonitoring();

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        // Set up conversion tracking validation
        this.setupConversionValidation();

        // Set up alerting
        this.setupAlerting();

        // Perform initial health check
        this.performHealthCheck();

        this.initialized = true;
        console.log('Production Monitor initialized');
    }

    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        // Regular health checks
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, PRODUCTION_CONFIG.HEALTH_CHECK_INTERVAL);

        // Deep health checks
        this.deepHealthCheckInterval = setInterval(() => {
            this.performDeepHealthCheck();
        }, PRODUCTION_CONFIG.DEEP_HEALTH_CHECK_INTERVAL);

        console.log('Health check intervals started');
    }

    /**
     * Perform basic health check
     */
    async performHealthCheck() {
        const healthCheck = {
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
            healthCheck.checks.performance_monitor_available = performanceMonitor && performanceMonitor.initialized;
            if (!healthCheck.checks.performance_monitor_available) {
                healthCheck.issues.push('Performance monitor not initialized');
                healthCheck.status = HEALTH_STATUS.WARNING;
            }

            // Check recent error rate
            const recentErrors = this.getRecentErrors(5 * 60 * 1000); // Last 5 minutes
            const recentMetrics = this.getRecentMetrics(5 * 60 * 1000);
            const errorRate = recentMetrics.length > 0 ? recentErrors.length / recentMetrics.length : 0;

            healthCheck.checks.error_rate = errorRate;
            healthCheck.checks.error_rate_healthy = errorRate < PRODUCTION_CONFIG.ERROR_RATE_THRESHOLD;

            if (!healthCheck.checks.error_rate_healthy) {
                healthCheck.issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
                healthCheck.status = HEALTH_STATUS.CRITICAL;
            }

            // Update health status
            this.healthStatus = healthCheck.status;
            this.lastHealthCheck = healthCheck;

            // Send alerts if status is not healthy
            if (healthCheck.status !== HEALTH_STATUS.HEALTHY) {
                this.handleAlert({
                    type: 'health_check_failed',
                    severity: healthCheck.status === HEALTH_STATUS.CRITICAL ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.MEDIUM,
                    message: `Health check failed: ${healthCheck.issues.join(', ')}`,
                    data: healthCheck
                });
            }

            console.log(`Health check completed: ${healthCheck.status}`, healthCheck);

        } catch (error) {
            healthCheck.status = HEALTH_STATUS.CRITICAL;
            healthCheck.issues.push(`Health check error: ${error.message}`);

            this.handleAlert({
                type: 'health_check_error',
                severity: ALERT_SEVERITY.CRITICAL,
                message: `Health check failed with error: ${error.message}`,
                data: { error: error.stack }
            });

            console.error('Health check failed:', error);
        }

        return healthCheck;
    }

    /**
     * Perform deep health check with detailed validation
     */
    async performDeepHealthCheck() {
        console.log('Performing deep health check');

        const deepCheck = {
            timestamp: Date.now(),
            status: HEALTH_STATUS.HEALTHY,
            checks: {},
            performance: {},
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
            const failedChecks = Object.entries(deepCheck.checks).filter(([key, value]) => !value);
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

            // Send alerts for deep check issues
            if (deepCheck.status !== HEALTH_STATUS.HEALTHY) {
                this.handleAlert({
                    type: 'deep_health_check_failed',
                    severity: deepCheck.status === HEALTH_STATUS.CRITICAL ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
                    message: `Deep health check failed: ${deepCheck.issues.join(', ')}`,
                    data: deepCheck
                });
            }

            console.log(`Deep health check completed: ${deepCheck.status}`, deepCheck);

        } catch (error) {
            deepCheck.status = HEALTH_STATUS.CRITICAL;
            deepCheck.issues.push(`Deep health check error: ${error.message}`);

            this.handleAlert({
                type: 'deep_health_check_error',
                severity: ALERT_SEVERITY.CRITICAL,
                message: `Deep health check failed with error: ${error.message}`,
                data: { error: error.stack }
            });

            console.error('Deep health check failed:', error);
        }

        return deepCheck;
    }

    /**
     * Validate tracking script loading
     */
    async validateScriptLoading() {
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
    async validateConversionTracking() {
        try {
            const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
            const conversionLabels = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;

            if (!conversionId || conversionId.includes('XXXXXXXXXX')) {
                return false;
            }

            if (!conversionLabels || conversionLabels.includes('XXXXXXXXX')) {
                return false;
            }

            // Try to parse conversion labels
            try {
                const labels = JSON.parse(conversionLabels);
                const requiredLabels = ['purchase', 'begin_checkout', 'view_item', 'add_to_cart'];
                return requiredLabels.every(label => labels[label] && !labels[label].includes('XXXXXXXXX'));
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
    async validateRemarketingSetup() {
        try {
            // Check if remarketing audiences are configured
            const tourSpecificLabels = process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS;

            if (!tourSpecificLabels || tourSpecificLabels.includes('XXXXXXXXX')) {
                return false;
            }

            // Validate tour-specific labels
            try {
                const labels = JSON.parse(tourSpecificLabels);
                const requiredTourLabels = [
                    'gion_purchase', 'morning_purchase', 'night_purchase', 'uji_purchase'
                ];
                return requiredTourLabels.every(label => labels[label] && !labels[label].includes('XXXXXXXXX'));
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
    validateDataLayer() {
        try {
            if (!window.dataLayer || !Array.isArray(window.dataLayer)) {
                return false;
            }

            // Check if dataLayer has been initialized with gtag
            const hasGtagInit = window.dataLayer.some(item =>
                Array.isArray(item) && item[0] === 'js'
            );

            return hasGtagInit;
        } catch (error) {
            console.error('Data layer validation failed:', error);
            return false;
        }
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        try {
            const requiredEnvVars = [
                'REACT_APP_GA_MEASUREMENT_ID',
                'REACT_APP_GOOGLE_ADS_CONVERSION_ID',
                'REACT_APP_GOOGLE_ADS_CONVERSION_LABELS'
            ];

            return requiredEnvVars.every(envVar => {
                const value = process.env[envVar];
                return value && !value.includes('XXXXXXXXXX') && !value.includes('XXXXXXXXX');
            });
        } catch (error) {
            console.error('Configuration validation failed:', error);
            return false;
        }
    }

    /**
     * Get performance metrics summary
     */
    getPerformanceMetrics() {
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
    calculateAverageLoadTime(scriptLoadTimes) {
        if (!scriptLoadTimes || scriptLoadTimes.length === 0) return 0;

        const totalTime = scriptLoadTimes.reduce((sum, script) => sum + script.loadTime, 0);
        return totalTime / scriptLoadTimes.length;
    }

    /**
     * Calculate average tracking call time
     */
    calculateAverageCallTime(trackingCallTimes) {
        if (!trackingCallTimes || trackingCallTimes.length === 0) return 0;

        const totalTime = trackingCallTimes.reduce((sum, call) => sum + call.callTime, 0);
        return totalTime / trackingCallTimes.length;
    }

    /**
     * Setup error monitoring
     */
    setupErrorMonitoring() {
        // Listen to performance monitor errors
        performanceMonitor.onError((error) => {
            this.handleTrackingError(error);
        });

        console.log('Error monitoring setup completed');
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor performance metrics
        performanceMonitor.onPerformanceMetric((metric) => {
            this.handlePerformanceMetric(metric);
        });

        console.log('Performance monitoring setup completed');
    }

    /**
     * Setup conversion tracking validation
     */
    setupConversionValidation() {
        // Validate conversion events
        if (window.gtag) {
            const originalGtag = window.gtag;
            window.gtag = (...args) => {
                try {
                    // Validate conversion events
                    if (args[0] === 'event' && args[1] === 'conversion') {
                        this.validateConversionEvent(args[2]);
                    }

                    return originalGtag.apply(this, args);
                } catch (error) {
                    this.handleAlert({
                        type: 'conversion_validation_error',
                        severity: ALERT_SEVERITY.HIGH,
                        message: `Conversion validation failed: ${error.message}`,
                        data: { args, error: error.stack }
                    });

                    throw error;
                }
            };
        }

        console.log('Conversion validation setup completed');
    }

    /**
     * Validate conversion event
     */
    validateConversionEvent(conversionData) {
        const issues = [];

        // Check required fields
        if (!conversionData.send_to) {
            issues.push('Missing send_to parameter');
        }

        if (!conversionData.value && conversionData.value !== 0) {
            issues.push('Missing value parameter');
        }

        if (!conversionData.currency) {
            issues.push('Missing currency parameter');
        }

        // Check for placeholder values
        if (conversionData.send_to && conversionData.send_to.includes('XXXXXXXXX')) {
            issues.push('Placeholder conversion label detected');
        }

        if (issues.length > 0) {
            this.handleAlert({
                type: 'conversion_validation_failed',
                severity: ALERT_SEVERITY.HIGH,
                message: `Conversion event validation failed: ${issues.join(', ')}`,
                data: { conversionData, issues }
            });
        }
    }

    /**
     * Setup alerting system
     */
    setupAlerting() {
        // Set up alert channels based on configuration
        console.log('Alerting system setup completed');
    }

    /**
     * Handle tracking errors
     */
    handleTrackingError(error) {
        let severity = ALERT_SEVERITY.MEDIUM;

        // Determine severity based on error type
        switch (error.type) {
            case ERROR_TYPES.SCRIPT_LOAD_FAILURE:
            case ERROR_TYPES.CONFIGURATION_ERROR:
                severity = ALERT_SEVERITY.CRITICAL;
                break;
            case ERROR_TYPES.TRACKING_FAILURE:
            case ERROR_TYPES.NETWORK_ERROR:
                severity = ALERT_SEVERITY.HIGH;
                break;
            case ERROR_TYPES.VALIDATION_ERROR:
            case ERROR_TYPES.PRIVACY_ERROR:
                severity = ALERT_SEVERITY.MEDIUM;
                break;
            default:
                severity = ALERT_SEVERITY.LOW;
        }

        this.handleAlert({
            type: 'tracking_error',
            severity: severity,
            message: `Tracking error: ${error.data.message || 'Unknown error'}`,
            data: error
        });
    }

    /**
     * Handle performance metrics
     */
    handlePerformanceMetric(metric) {
        // Store metric
        this.metricsHistory.push({
            timestamp: Date.now(),
            metric: metric
        });

        // Check for performance issues
        if (metric.type === METRIC_TYPES.SCRIPT_LOAD_TIME &&
            metric.data.loadTime > PRODUCTION_CONFIG.SCRIPT_LOAD_TIME_THRESHOLD) {

            this.handleAlert({
                type: 'slow_script_loading',
                severity: ALERT_SEVERITY.MEDIUM,
                message: `Slow script loading detected: ${metric.data.loadTime}ms`,
                data: metric
            });
        }

        if (metric.type === METRIC_TYPES.TRACKING_CALL_TIME &&
            metric.data.callTime > PRODUCTION_CONFIG.TRACKING_CALL_TIME_THRESHOLD) {

            this.handleAlert({
                type: 'slow_tracking_call',
                severity: ALERT_SEVERITY.MEDIUM,
                message: `Slow tracking call detected: ${metric.data.callTime}ms`,
                data: metric
            });
        }
    }

    /**
     * Handle alerts
     */
    handleAlert(alert) {
        const alertId = this.generateAlertId();
        const fullAlert = {
            id: alertId,
            timestamp: Date.now(),
            ...alert
        };

        // Store alert
        this.alertHistory.push(fullAlert);
        this.activeAlerts.set(alertId, fullAlert);

        // Log alert
        console.error(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`, alert.data);

        // Send alert to configured channels
        this.sendAlert(fullAlert);

        // Clean up old alerts
        this.cleanupOldAlerts();
    }

    /**
     * Send alert to configured channels
     */
    async sendAlert(alert) {
        try {
            // In a real implementation, this would send to actual alert channels
            // For now, we'll log and potentially send to a webhook

            if (process.env.REACT_APP_ALERT_WEBHOOK_URL) {
                await this.sendWebhookAlert(alert);
            }

            // Could also send email alerts, Slack notifications, etc.
            console.log(`Alert sent: ${alert.type} - ${alert.message}`);

        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    }

    /**
     * Send webhook alert
     */
    async sendWebhookAlert(alert) {
        try {
            const webhookUrl = process.env.REACT_APP_ALERT_WEBHOOK_URL;
            if (!webhookUrl) return;

            const payload = {
                alert_type: alert.type,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp,
                environment: 'production',
                service: 'google-ads-tracking',
                data: alert.data
            };

            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

        } catch (error) {
            console.error('Failed to send webhook alert:', error);
        }
    }

    /**
     * Get recent errors
     */
    getRecentErrors(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.alertHistory.filter(alert =>
            alert.timestamp > cutoff && alert.type.includes('error')
        );
    }

    /**
     * Get recent metrics
     */
    getRecentMetrics(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.metricsHistory.filter(metric => metric.timestamp > cutoff);
    }

    /**
     * Clean up old alerts
     */
    cleanupOldAlerts() {
        const cutoff = Date.now() - (PRODUCTION_CONFIG.ALERTS_RETENTION_DAYS * 24 * 60 * 60 * 1000);

        // Clean up alert history
        this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff);

        // Clean up active alerts (resolve old ones)
        for (const [alertId, alert] of this.activeAlerts.entries()) {
            if (alert.timestamp < cutoff) {
                this.activeAlerts.delete(alertId);
            }
        }
    }

    /**
     * Generate unique alert ID
     */
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current health status
     */
    getHealthStatus() {
        return {
            status: this.healthStatus,
            lastCheck: this.lastHealthCheck,
            activeAlerts: Array.from(this.activeAlerts.values()),
            recentAlerts: this.alertHistory.slice(-10)
        };
    }

    /**
     * Get monitoring dashboard data
     */
    getDashboardData() {
        const performanceMetrics = this.getPerformanceMetrics();

        return {
            health: this.getHealthStatus(),
            performance: performanceMetrics,
            alerts: {
                total: this.alertHistory.length,
                active: this.activeAlerts.size,
                recent: this.getRecentErrors(24 * 60 * 60 * 1000).length
            },
            metrics: {
                total: this.metricsHistory.length,
                recent: this.getRecentMetrics(24 * 60 * 60 * 1000).length
            }
        };
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        if (this.deepHealthCheckInterval) {
            clearInterval(this.deepHealthCheckInterval);
            this.deepHealthCheckInterval = null;
        }

        this.initialized = false;
        console.log('Production monitoring stopped');
    }
}

// Create singleton instance
const productionMonitor = new ProductionMonitor();

export default productionMonitor;
export { ALERT_SEVERITY, HEALTH_STATUS, PRODUCTION_CONFIG };