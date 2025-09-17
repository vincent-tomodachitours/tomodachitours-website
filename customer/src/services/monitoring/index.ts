/**
 * Main Production Monitoring and Alerting Service
 * 
 * Handles production-specific monitoring, alerting, and health checks for Google Ads tracking
 * Requirements: 1.2, 4.1, 7.1, 6.2
 */

import type {
    HealthStatusResponse,
    DashboardData,
    PerformanceMetrics,
    Alert,
    AlertSeverity,
    HealthStatus
} from './types';
import { ALERT_SEVERITY, HEALTH_STATUS } from './types';
import { ERROR_TYPES } from '../performance/types';
import { healthCheckService } from './healthCheckService';
import { alertService } from './alertService';
import { validationService } from './validationService';
import { monitoringLifecycleService } from './lifecycleService';

export class ProductionMonitor {
    private initialized: boolean = false;
    private healthStatus: HealthStatus = HEALTH_STATUS.UNKNOWN;
    private lastHealthCheck: any = null;

    constructor() {
        // Bind methods
        this.performHealthCheck = this.performHealthCheck.bind(this);
        this.performDeepHealthCheck = this.performDeepHealthCheck.bind(this);
        this.handleAlert = this.handleAlert.bind(this);
    }

    /**
     * Initialize production monitoring
     */
    initialize(): void {
        if (this.initialized) return;

        // Initialize lifecycle service
        if (!monitoringLifecycleService.initialize()) {
            return; // Skip initialization in non-production
        }

        console.log('Initializing Production Monitor');

        // Set up health checks
        this.startHealthChecks();

        // Set up monitoring integrations
        this.setupMonitoringIntegrations();

        // Set up conversion tracking validation
        this.setupConversionValidation();

        // Validate initial configuration
        this.validateInitialSetup();

        // Perform initial health check
        this.performHealthCheck();

        // Register cleanup
        monitoringLifecycleService.onCleanup(() => {
            alertService.clearAllData();
        });

        this.initialized = true;
        console.log('Production Monitor initialized');
    }

    /**
     * Start periodic health checks
     */
    private startHealthChecks(): void {
        monitoringLifecycleService.startHealthChecks(
            () => this.performHealthCheck(),
            () => this.performDeepHealthCheck()
        );
    }

    /**
     * Setup monitoring integrations
     */
    private setupMonitoringIntegrations(): void {
        monitoringLifecycleService.setupMonitoringIntegrations(
            (error: any) => this.handleTrackingError(error),
            (metric: any) => alertService.handlePerformanceMetric(metric)
        );
    }

    /**
     * Setup conversion tracking validation
     */
    private setupConversionValidation(): void {
        validationService.setupConversionValidation();
    }

    /**
     * Validate initial setup
     */
    private validateInitialSetup(): void {
        validationService.validateTrackingConfiguration();
        validationService.validateRuntimeEnvironment();
    }

    /**
     * Perform basic health check
     */
    async performHealthCheck(): Promise<any> {
        const healthCheck = await healthCheckService.performHealthCheck();

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

        return healthCheck;
    }

    /**
     * Perform deep health check with detailed validation
     */
    async performDeepHealthCheck(): Promise<any> {
        const deepCheck = await healthCheckService.performDeepHealthCheck();

        // Send alerts for deep check issues
        if (deepCheck.status !== HEALTH_STATUS.HEALTHY) {
            this.handleAlert({
                type: 'deep_health_check_failed',
                severity: deepCheck.status === HEALTH_STATUS.CRITICAL ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
                message: `Deep health check failed: ${deepCheck.issues.join(', ')}`,
                data: deepCheck
            });
        }

        return deepCheck;
    }

    /**
     * Handle tracking errors
     */
    private handleTrackingError(error: any): void {
        let severity: AlertSeverity = ALERT_SEVERITY.MEDIUM;

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
     * Handle alerts (public method for external use)
     */
    handleAlert(alert: Alert): void {
        alertService.handleAlert(alert);
    }

    /**
     * Get current health status
     */
    getHealthStatus(): HealthStatusResponse {
        return {
            status: this.healthStatus,
            lastCheck: this.lastHealthCheck,
            activeAlerts: alertService.getActiveAlerts(),
            recentAlerts: alertService.getAlertHistory().slice(-10)
        };
    }

    /**
     * Get monitoring dashboard data
     */
    getDashboardData(): DashboardData {
        const healthStatus = this.getHealthStatus();
        const recentErrors = alertService.getRecentErrors(24 * 60 * 60 * 1000);
        const recentMetrics = alertService.getRecentMetrics(24 * 60 * 60 * 1000);

        // Get performance metrics from health check
        let performanceMetrics: PerformanceMetrics = {
            totalErrors: 0,
            recentErrors: 0,
            errorRate: 0,
            avgScriptLoadTime: 0,
            avgTrackingCallTime: 0,
            totalMetrics: 0,
            recentMetrics: 0
        };

        if (this.lastHealthCheck && 'performance' in this.lastHealthCheck) {
            performanceMetrics = this.lastHealthCheck.performance;
        }

        return {
            health: healthStatus,
            performance: performanceMetrics,
            alerts: {
                total: alertService.getAlertHistory().length,
                active: alertService.getActiveAlerts().length,
                recent: recentErrors.length
            },
            metrics: {
                total: alertService.getRecentMetrics(30 * 24 * 60 * 60 * 1000).length, // 30 days
                recent: recentMetrics.length
            }
        };
    }

    /**
     * Stop monitoring
     */
    stop(): void {
        monitoringLifecycleService.stop();
        this.initialized = false;
    }

    /**
     * Check if monitoring is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Create singleton instance
const productionMonitor = new ProductionMonitor();

export default productionMonitor;

// Re-export types and constants for convenience
export type {
    AlertSeverity,
    HealthStatus,
    Alert,
    PerformanceMetrics,
    DashboardData,
    HealthStatusResponse
} from './types';

export { ALERT_SEVERITY, HEALTH_STATUS } from './types';
export { PRODUCTION_CONFIG } from './constants';