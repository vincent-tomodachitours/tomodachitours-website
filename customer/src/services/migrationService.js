/**
 * Migration Service
 * Unified service for managing GTM migration with parallel tracking
 */

import migrationFeatureFlags from './migrationFeatureFlags';
import parallelTrackingValidator from './parallelTrackingValidator';
import migrationMonitor from './migrationMonitor';
import rollbackManager from './rollbackManager';

class MigrationService {
    constructor() {
        this.initialized = false;
        this.trackingMethods = {
            legacy: null,
            gtm: null
        };

        this.initialize();
    }

    /**
     * Initialize migration service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize tracking methods based on migration phase
            await this.initializeTrackingMethods();

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;

            migrationFeatureFlags.trackMigrationEvent('migration_service_initialized', {
                migrationPhase: migrationFeatureFlags.migrationPhase,
                shouldUseGTM: migrationFeatureFlags.shouldUseGTM(),
                shouldUseParallelTracking: migrationFeatureFlags.shouldUseParallelTracking()
            });

        } catch (error) {
            console.error('[MigrationService] Initialization failed:', error);

            // Fallback to legacy tracking
            await this.fallbackToLegacy(error.message);
        }
    }

    /**
     * Initialize tracking methods based on migration phase
     */
    async initializeTrackingMethods() {
        const migrationStatus = migrationFeatureFlags.getMigrationStatus();

        // Always initialize legacy tracking as fallback
        this.trackingMethods.legacy = await this.initializeLegacyTracking();

        // Initialize GTM if enabled
        if (migrationStatus.shouldUseGTM) {
            try {
                this.trackingMethods.gtm = await this.initializeGTMTracking();
            } catch (error) {
                console.warn('[MigrationService] GTM initialization failed, using legacy only:', error);
                migrationFeatureFlags.updateFlag('gtmEnabled', false);
            }
        }
    }

    /**
     * Initialize legacy tracking
     */
    async initializeLegacyTracking() {
        return {
            trackEvent: (eventName, eventData) => {
                if (window.gtag) {
                    window.gtag('event', eventName, eventData);
                }
            },

            trackPurchase: (transactionData) => {
                if (window.gtag) {
                    window.gtag('event', 'purchase', {
                        transaction_id: transactionData.transaction_id,
                        value: transactionData.value,
                        currency: transactionData.currency,
                        items: transactionData.items
                    });
                }
            },

            trackConversion: (conversionData) => {
                if (window.gtag) {
                    window.gtag('event', 'conversion', {
                        send_to: conversionData.conversion_label,
                        value: conversionData.value,
                        currency: conversionData.currency,
                        transaction_id: conversionData.transaction_id
                    });
                }
            }
        };
    }

    /**
     * Initialize GTM tracking
     */
    async initializeGTMTracking() {
        // Import GTM service dynamically
        const { default: gtmService } = await import('./gtmService');

        return {
            trackEvent: (eventName, eventData) => {
                gtmService.pushEvent(eventName, eventData);
            },

            trackPurchase: (transactionData) => {
                gtmService.pushEvent('purchase', transactionData);
            },

            trackConversion: (conversionData) => {
                gtmService.pushEvent('conversion', conversionData);
            }
        };
    }

    /**
     * Set up event listeners for migration management
     */
    setupEventListeners() {
        // Listen for rollback completion
        window.addEventListener('migration-rollback-complete', (event) => {
            this.handleRollbackComplete(event.detail);
        });

        // Listen for feature flag changes
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('migration_flag_')) {
                this.handleFeatureFlagChange(event);
            }
        });
    }

    /**
     * Handle rollback completion
     */
    handleRollbackComplete(rollbackEvent) {
        if (rollbackEvent.success) {
            // Reinitialize with legacy tracking only
            this.trackingMethods.gtm = null;
            migrationFeatureFlags.trackMigrationEvent('migration_service_rollback_handled', {
                rollbackId: rollbackEvent.id
            });
        }
    }

    /**
     * Handle feature flag changes
     */
    async handleFeatureFlagChange(event) {
        const flagName = event.key.replace('migration_flag_', '');
        const newValue = event.newValue === 'true';

        // Reinitialize if GTM flags changed
        if (flagName.includes('gtm') || flagName === 'emergencyRollbackEnabled') {
            await this.initializeTrackingMethods();
        }
    }

    /**
     * Track event with migration logic
     */
    async trackEvent(eventName, eventData) {
        const migrationStatus = migrationFeatureFlags.getMigrationStatus();

        try {
            // Track with legacy system
            if (this.trackingMethods.legacy) {
                this.trackingMethods.legacy.trackEvent(eventName, eventData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackLegacyConversion({
                        event: eventName,
                        ...eventData
                    });
                }
            }

            // Track with GTM if enabled
            if (migrationStatus.shouldUseGTM && this.trackingMethods.gtm) {
                this.trackingMethods.gtm.trackEvent(eventName, eventData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackGTMConversion({
                        event: eventName,
                        ...eventData
                    });
                }
            }

        } catch (error) {
            console.error('[MigrationService] Event tracking failed:', error);

            // Fallback to legacy if GTM fails
            if (migrationStatus.shouldUseGTM && !this.trackingMethods.legacy) {
                await this.fallbackToLegacy(`Event tracking failed: ${error.message}`);
            }
        }
    }

    /**
     * Track purchase with migration logic
     */
    async trackPurchase(transactionData) {
        const migrationStatus = migrationFeatureFlags.getMigrationStatus();

        try {
            // Track with legacy system
            if (this.trackingMethods.legacy) {
                this.trackingMethods.legacy.trackPurchase(transactionData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackLegacyConversion({
                        event: 'purchase',
                        ...transactionData
                    });
                }
            }

            // Track with GTM if enabled
            if (migrationStatus.shouldUseGTM && this.trackingMethods.gtm) {
                this.trackingMethods.gtm.trackPurchase(transactionData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackGTMConversion({
                        event: 'purchase',
                        ...transactionData
                    });
                }
            }

        } catch (error) {
            console.error('[MigrationService] Purchase tracking failed:', error);

            // This is critical - trigger rollback if purchase tracking fails
            if (migrationStatus.shouldUseGTM) {
                rollbackManager.triggerEmergencyRollback(`Purchase tracking failed: ${error.message}`);
            }
        }
    }

    /**
     * Track conversion with migration logic
     */
    async trackConversion(conversionData) {
        const migrationStatus = migrationFeatureFlags.getMigrationStatus();

        try {
            // Track with legacy system
            if (this.trackingMethods.legacy) {
                this.trackingMethods.legacy.trackConversion(conversionData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackLegacyConversion({
                        event: 'conversion',
                        ...conversionData
                    });
                }
            }

            // Track with GTM if enabled
            if (migrationStatus.shouldUseGTM && this.trackingMethods.gtm) {
                this.trackingMethods.gtm.trackConversion(conversionData);

                if (migrationStatus.shouldUseParallelTracking) {
                    parallelTrackingValidator.trackGTMConversion({
                        event: 'conversion',
                        ...conversionData
                    });
                }
            }

        } catch (error) {
            console.error('[MigrationService] Conversion tracking failed:', error);

            // This is critical - trigger rollback if conversion tracking fails
            if (migrationStatus.shouldUseGTM) {
                rollbackManager.triggerEmergencyRollback(`Conversion tracking failed: ${error.message}`);
            }
        }
    }

    /**
     * Fallback to legacy tracking
     */
    async fallbackToLegacy(reason) {
        migrationFeatureFlags.updateFlag('gtmEnabled', false);
        migrationFeatureFlags.updateFlag('legacyTrackingFallback', true);

        // Ensure legacy tracking is available
        if (!this.trackingMethods.legacy) {
            this.trackingMethods.legacy = await this.initializeLegacyTracking();
        }

        migrationFeatureFlags.trackMigrationEvent('fallback_to_legacy', {
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Get migration dashboard data
     */
    getMigrationDashboard() {
        return {
            migrationStatus: migrationFeatureFlags.getMigrationStatus(),
            monitoringDashboard: migrationMonitor.getMonitoringDashboard(),
            validationReport: parallelTrackingValidator.getValidationReport(),
            rollbackStatus: rollbackManager.getRollbackStatus(),
            trackingMethods: {
                legacy: !!this.trackingMethods.legacy,
                gtm: !!this.trackingMethods.gtm
            },
            initialized: this.initialized
        };
    }

    /**
     * Force health check
     */
    async forceHealthCheck() {
        return await migrationMonitor.forceHealthCheck();
    }

    /**
     * Test migration system
     */
    async testMigrationSystem() {
        const testResults = {
            timestamp: Date.now(),
            tests: {},
            overallSuccess: false
        };

        try {
            // Test feature flags
            testResults.tests.featureFlags = this.testFeatureFlags();

            // Test tracking methods
            testResults.tests.trackingMethods = await this.testTrackingMethods();

            // Test parallel validation
            testResults.tests.parallelValidation = this.testParallelValidation();

            // Test rollback system
            testResults.tests.rollbackSystem = await rollbackManager.testRollbackSystem();

            testResults.overallSuccess = Object.values(testResults.tests).every(test => test.overallSuccess !== false);

        } catch (error) {
            testResults.error = error.message;
        }

        return testResults;
    }

    /**
     * Test feature flags functionality
     */
    testFeatureFlags() {
        try {
            const status = migrationFeatureFlags.getMigrationStatus();
            return {
                success: true,
                details: {
                    phase: status.phase,
                    rolloutPercentage: status.rolloutPercentage,
                    flagsLoaded: Object.keys(status.flags).length > 0
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test tracking methods
     */
    async testTrackingMethods() {
        const results = {
            legacy: { available: false, tested: false },
            gtm: { available: false, tested: false }
        };

        try {
            // Test legacy tracking
            if (this.trackingMethods.legacy) {
                results.legacy.available = true;

                // Test legacy event tracking
                this.trackingMethods.legacy.trackEvent('migration_test', {
                    event_category: 'test',
                    event_label: 'legacy_test'
                });

                results.legacy.tested = true;
            }

            // Test GTM tracking
            if (this.trackingMethods.gtm) {
                results.gtm.available = true;

                // Test GTM event tracking
                this.trackingMethods.gtm.trackEvent('migration_test', {
                    event_category: 'test',
                    event_label: 'gtm_test'
                });

                results.gtm.tested = true;
            }

            return {
                success: results.legacy.available || results.gtm.available,
                details: results
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: results
            };
        }
    }

    /**
     * Test parallel validation
     */
    testParallelValidation() {
        try {
            const summary = parallelTrackingValidator.getValidationSummary();
            return {
                success: true,
                details: {
                    totalComparisons: summary.totalComparisons,
                    discrepancyRate: summary.discrepancyRate,
                    validationEnabled: parallelTrackingValidator.validationEnabled
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear all migration data
     */
    clearMigrationData() {
        migrationFeatureFlags.clearMigrationEvents();
        parallelTrackingValidator.clearValidationData();
        migrationMonitor.clearMonitoringData();
        rollbackManager.clearRollbackHistory();

        migrationFeatureFlags.trackMigrationEvent('migration_data_cleared', {
            timestamp: Date.now()
        });
    }

    /**
     * Export migration data for analysis
     */
    exportMigrationData() {
        return {
            timestamp: Date.now(),
            migrationEvents: migrationFeatureFlags.getMigrationEvents(),
            validationReport: parallelTrackingValidator.getValidationReport(),
            monitoringDashboard: migrationMonitor.getMonitoringDashboard(),
            rollbackStatus: rollbackManager.getRollbackStatus(),
            migrationStatus: migrationFeatureFlags.getMigrationStatus()
        };
    }
}

// Create singleton instance
const migrationService = new MigrationService();

export default migrationService;