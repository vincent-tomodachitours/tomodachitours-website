/**
 * Migration Monitor
 * Monitors migration progress and ensures no conversion data loss
 */

import migrationFeatureFlags from './migrationFeatureFlags';
import parallelTrackingValidator from './parallelTrackingValidator';

class MigrationMonitor {
    constructor() {
        this.monitoringEnabled = migrationFeatureFlags.flags.migrationMonitoringEnabled;
        this.monitoringInterval = null;
        this.healthChecks = [];
        this.alerts = [];

        if (this.monitoringEnabled) {
            this.startMonitoring();
        }
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        // Run health checks every 5 minutes
        this.monitoringInterval = setInterval(() => {
            this.runHealthChecks();
        }, 300000);

        // Run initial health check
        setTimeout(() => {
            this.runHealthChecks();
        }, 10000); // Wait 10 seconds after initialization

        migrationFeatureFlags.trackMigrationEvent('monitoring_started', {
            timestamp: Date.now()
        });
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        migrationFeatureFlags.trackMigrationEvent('monitoring_stopped', {
            timestamp: Date.now()
        });
    }

    /**
     * Run comprehensive health checks
     */
    async runHealthChecks() {
        const healthCheck = {
            timestamp: Date.now(),
            checks: {},
            overallHealth: 'healthy',
            alerts: []
        };

        try {
            // Check GTM container loading
            healthCheck.checks.gtmContainer = await this.checkGTMContainer();

            // Check dataLayer functionality
            healthCheck.checks.dataLayer = this.checkDataLayer();

            // Check conversion tracking accuracy
            healthCheck.checks.conversionAccuracy = this.checkConversionAccuracy();

            // Check parallel tracking validation
            healthCheck.checks.parallelTracking = this.checkParallelTracking();

            // Check feature flag consistency
            healthCheck.checks.featureFlags = this.checkFeatureFlags();

            // Check error rates
            healthCheck.checks.errorRates = this.checkErrorRates();

            // Determine overall health
            healthCheck.overallHealth = this.calculateOverallHealth(healthCheck.checks);

            // Generate alerts if needed
            healthCheck.alerts = this.generateAlerts(healthCheck.checks);

        } catch (error) {
            console.error('[MigrationMonitor] Health check failed:', error);
            healthCheck.overallHealth = 'critical';
            healthCheck.alerts.push({
                type: 'health_check_failure',
                severity: 'critical',
                message: `Health check execution failed: ${error.message}`
            });
        }

        this.healthChecks.push(healthCheck);

        // Keep only last 24 health checks (2 hours of data)
        if (this.healthChecks.length > 24) {
            this.healthChecks = this.healthChecks.slice(-24);
        }

        // Process alerts
        this.processAlerts(healthCheck.alerts);

        // Track health check
        migrationFeatureFlags.trackMigrationEvent('health_check_completed', {
            overallHealth: healthCheck.overallHealth,
            alertCount: healthCheck.alerts.length,
            checksCompleted: Object.keys(healthCheck.checks).length
        });

        return healthCheck;
    }

    /**
     * Check GTM container loading status
     */
    async checkGTMContainer() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            // Check if GTM is supposed to be loaded
            if (!migrationFeatureFlags.shouldUseGTM()) {
                check.details.gtmEnabled = false;
                check.details.reason = 'GTM not enabled for this user';
                return check;
            }

            // Check if GTM script is loaded
            const gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
            check.details.gtmScriptLoaded = gtmScripts.length > 0;

            if (!check.details.gtmScriptLoaded) {
                check.status = 'warning';
                check.issues.push('GTM script not found in DOM');
            }

            // Check if dataLayer exists
            check.details.dataLayerExists = typeof window.dataLayer !== 'undefined';

            if (!check.details.dataLayerExists) {
                check.status = 'critical';
                check.issues.push('dataLayer not available');
            }

            // Check GTM container ID
            const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;
            check.details.containerIdConfigured = !!containerId;

            if (!containerId) {
                check.status = 'warning';
                check.issues.push('GTM container ID not configured');
            }

            // Try to detect GTM loading
            if (window.google_tag_manager) {
                check.details.gtmLoaded = true;
                check.details.containerIds = Object.keys(window.google_tag_manager);
            } else {
                check.details.gtmLoaded = false;
                if (check.details.gtmScriptLoaded) {
                    check.status = 'warning';
                    check.issues.push('GTM script loaded but container not initialized');
                }
            }

        } catch (error) {
            check.status = 'critical';
            check.issues.push(`GTM check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Check dataLayer functionality
     */
    checkDataLayer() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            if (!window.dataLayer) {
                check.status = 'critical';
                check.issues.push('dataLayer not available');
                return check;
            }

            check.details.dataLayerLength = window.dataLayer.length;
            check.details.recentEvents = window.dataLayer
                .slice(-10)
                .filter(item => item.event)
                .map(item => item.event);

            // Check for recent conversion events
            const recentConversions = window.dataLayer
                .filter(item => ['purchase', 'begin_checkout', 'add_payment_info'].includes(item.event))
                .slice(-5);

            check.details.recentConversions = recentConversions.length;

            // Check dataLayer push functionality
            const testEvent = { event: 'migration_monitor_test', timestamp: Date.now() };
            window.dataLayer.push(testEvent);

            const testEventFound = window.dataLayer.some(item =>
                item.event === 'migration_monitor_test' && item.timestamp === testEvent.timestamp
            );

            check.details.dataLayerPushWorking = testEventFound;

            if (!testEventFound) {
                check.status = 'warning';
                check.issues.push('dataLayer.push() not working correctly');
            }

        } catch (error) {
            check.status = 'critical';
            check.issues.push(`dataLayer check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Check conversion tracking accuracy
     */
    checkConversionAccuracy() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            const validationSummary = parallelTrackingValidator.getValidationSummary();

            check.details.totalComparisons = validationSummary.totalComparisons;
            check.details.discrepancyRate = parseFloat(validationSummary.discrepancyRate);
            check.details.severityBreakdown = validationSummary.severityBreakdown;

            // Check discrepancy rate thresholds
            if (check.details.discrepancyRate > 20) {
                check.status = 'critical';
                check.issues.push(`High discrepancy rate: ${check.details.discrepancyRate}%`);
            } else if (check.details.discrepancyRate > 10) {
                check.status = 'warning';
                check.issues.push(`Elevated discrepancy rate: ${check.details.discrepancyRate}%`);
            }

            // Check for high severity issues
            if (validationSummary.severityBreakdown.high > 0) {
                check.status = 'critical';
                check.issues.push(`${validationSummary.severityBreakdown.high} high severity discrepancies`);
            }

            // Check if we have enough data
            if (check.details.totalComparisons < 5) {
                check.status = 'warning';
                check.issues.push('Insufficient conversion data for accurate assessment');
            }

        } catch (error) {
            check.status = 'warning';
            check.issues.push(`Conversion accuracy check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Check parallel tracking validation status
     */
    checkParallelTracking() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            const shouldUseParallel = migrationFeatureFlags.shouldUseParallelTracking();
            check.details.parallelTrackingEnabled = shouldUseParallel;

            if (!shouldUseParallel) {
                check.details.reason = 'Parallel tracking not enabled';
                return check;
            }

            // Check validation data freshness
            const validationReport = parallelTrackingValidator.getValidationReport();
            const lastComparison = validationReport.recentComparisons[0];

            if (lastComparison) {
                const timeSinceLastComparison = Date.now() - lastComparison.timestamp;
                check.details.timeSinceLastComparison = timeSinceLastComparison;

                // Alert if no comparisons in last 30 minutes during active hours
                if (timeSinceLastComparison > 1800000) {
                    check.status = 'warning';
                    check.issues.push('No recent parallel tracking comparisons');
                }
            } else {
                check.status = 'warning';
                check.issues.push('No parallel tracking data available');
            }

        } catch (error) {
            check.status = 'warning';
            check.issues.push(`Parallel tracking check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Check feature flag consistency
     */
    checkFeatureFlags() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            const migrationStatus = migrationFeatureFlags.getMigrationStatus();
            check.details.migrationPhase = migrationStatus.phase;
            check.details.rolloutPercentage = migrationStatus.rolloutPercentage;

            // Check for emergency rollback
            if (migrationStatus.phase === 'rollback') {
                check.status = 'critical';
                check.issues.push('Emergency rollback is active');
            }

            // Check flag consistency
            if (migrationStatus.shouldUseGTM && !migrationStatus.flags.gtmEnabled) {
                check.status = 'warning';
                check.issues.push('GTM usage flag inconsistency detected');
            }

            // Check rollout percentage sanity
            if (migrationStatus.rolloutPercentage > 100 || migrationStatus.rolloutPercentage < 0) {
                check.status = 'warning';
                check.issues.push(`Invalid rollout percentage: ${migrationStatus.rolloutPercentage}%`);
            }

        } catch (error) {
            check.status = 'warning';
            check.issues.push(`Feature flag check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Check error rates from migration events
     */
    checkErrorRates() {
        const check = {
            status: 'healthy',
            details: {},
            issues: []
        };

        try {
            const migrationEvents = migrationFeatureFlags.getMigrationEvents();
            const recentEvents = migrationEvents.filter(e => e.timestamp > new Date(Date.now() - 3600000).toISOString());

            check.details.totalRecentEvents = recentEvents.length;

            // Count error events
            const errorEvents = recentEvents.filter(e =>
                e.event.includes('error') ||
                e.event.includes('failed') ||
                e.event.includes('rollback')
            );

            check.details.errorEvents = errorEvents.length;
            check.details.errorRate = recentEvents.length > 0 ?
                (errorEvents.length / recentEvents.length * 100).toFixed(2) : 0;

            // Check error rate thresholds
            if (check.details.errorRate > 10) {
                check.status = 'critical';
                check.issues.push(`High error rate: ${check.details.errorRate}%`);
            } else if (check.details.errorRate > 5) {
                check.status = 'warning';
                check.issues.push(`Elevated error rate: ${check.details.errorRate}%`);
            }

        } catch (error) {
            check.status = 'warning';
            check.issues.push(`Error rate check failed: ${error.message}`);
        }

        return check;
    }

    /**
     * Calculate overall health from individual checks
     */
    calculateOverallHealth(checks) {
        const statuses = Object.values(checks).map(check => check.status);

        if (statuses.includes('critical')) {
            return 'critical';
        }

        if (statuses.includes('warning')) {
            return 'warning';
        }

        return 'healthy';
    }

    /**
     * Generate alerts based on health checks
     */
    generateAlerts(checks) {
        const alerts = [];

        Object.entries(checks).forEach(([checkName, check]) => {
            if (check.status === 'critical') {
                alerts.push({
                    type: 'critical_health_issue',
                    severity: 'critical',
                    checkName,
                    message: `Critical issue in ${checkName}: ${check.issues.join(', ')}`,
                    timestamp: Date.now()
                });
            } else if (check.status === 'warning') {
                alerts.push({
                    type: 'health_warning',
                    severity: 'warning',
                    checkName,
                    message: `Warning in ${checkName}: ${check.issues.join(', ')}`,
                    timestamp: Date.now()
                });
            }
        });

        return alerts;
    }

    /**
     * Process and handle alerts
     */
    processAlerts(alerts) {
        alerts.forEach(alert => {
            this.alerts.push(alert);

            // Log alerts
            if (alert.severity === 'critical') {
                console.error('[MigrationMonitor] CRITICAL ALERT:', alert.message);
            } else {
                console.warn('[MigrationMonitor] WARNING:', alert.message);
            }

            // Track alert
            migrationFeatureFlags.trackMigrationEvent('migration_alert', {
                alertType: alert.type,
                severity: alert.severity,
                checkName: alert.checkName,
                message: alert.message
            });

            // Send to analytics if available
            if (window.gtag) {
                window.gtag('event', 'migration_alert', {
                    event_category: 'migration',
                    event_label: alert.type,
                    value: alert.severity === 'critical' ? 2 : 1
                });
            }
        });

        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        // Check for emergency rollback conditions
        this.checkEmergencyRollbackConditions(alerts);
    }

    /**
     * Check if emergency rollback should be triggered
     */
    checkEmergencyRollbackConditions(alerts) {
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');

        // Trigger rollback if multiple critical alerts
        if (criticalAlerts.length >= 2) {
            const alertMessages = criticalAlerts.map(a => a.message).join('; ');
            migrationFeatureFlags.emergencyRollback(`Multiple critical alerts: ${alertMessages}`);
        }

        // Check for specific critical conditions
        const gtmFailure = alerts.some(a => a.checkName === 'gtmContainer' && a.severity === 'critical');
        const highDiscrepancy = alerts.some(a => a.checkName === 'conversionAccuracy' && a.message.includes('High discrepancy rate'));

        if (gtmFailure && highDiscrepancy) {
            migrationFeatureFlags.emergencyRollback('GTM failure combined with high conversion discrepancy rate');
        }
    }

    /**
     * Get monitoring dashboard data
     */
    getMonitoringDashboard() {
        const latestHealthCheck = this.healthChecks[this.healthChecks.length - 1];
        const recentAlerts = this.alerts.filter(a => a.timestamp > Date.now() - 3600000); // Last hour

        return {
            currentHealth: latestHealthCheck?.overallHealth || 'unknown',
            lastHealthCheck: latestHealthCheck?.timestamp,
            recentAlerts: recentAlerts.length,
            criticalAlerts: recentAlerts.filter(a => a.severity === 'critical').length,
            migrationStatus: migrationFeatureFlags.getMigrationStatus(),
            validationSummary: parallelTrackingValidator.getValidationSummary(),
            healthHistory: this.healthChecks.slice(-12), // Last 12 checks (1 hour)
            alertHistory: this.alerts.slice(-10)
        };
    }

    /**
     * Force immediate health check
     */
    async forceHealthCheck() {
        return await this.runHealthChecks();
    }

    /**
     * Clear monitoring data
     */
    clearMonitoringData() {
        this.healthChecks = [];
        this.alerts = [];

        migrationFeatureFlags.trackMigrationEvent('monitoring_data_cleared', {
            timestamp: Date.now()
        });
    }
}

// Create singleton instance
const migrationMonitor = new MigrationMonitor();

export default migrationMonitor;