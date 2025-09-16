/**
 * Migration Service
 * Unified service for managing GTM migration with parallel tracking
 */

import migrationFeatureFlags from './migrationFeatureFlags';
import parallelTrackingValidator from './parallelTrackingValidator';
import migrationMonitor from './migrationMonitor';
import rollbackManager from './rollbackManager';

interface TrackingMethod {
    trackEvent: (eventName: string, eventData: Record<string, any>) => void;
    trackPurchase: (transactionData: TransactionData) => void;
    trackConversion: (conversionData: ConversionData) => void;
}

interface TransactionData {
    transaction_id: string;
    value: number;
    currency: string;
    items?: Array<{
        item_id: string;
        item_name: string;
        category?: string;
        quantity?: number;
        price?: number;
    }>;
}

interface ConversionData {
    conversion_label: string;
    value: number;
    currency: string;
    transaction_id: string;
}

interface TrackingMethods {
    legacy: TrackingMethod | null;
    gtm: TrackingMethod | null;
}

interface MigrationDashboard {
    migrationStatus: any;
    monitoringDashboard: any;
    validationReport: any;
    rollbackStatus: any;
    trackingMethods: {
        legacy: boolean;
        gtm: boolean;
    };
    initialized: boolean;
}

interface TestResult {
    success: boolean;
    error?: string;
    details?: any;
}

interface MigrationTestResults {
    timestamp: number;
    tests: {
        featureFlags?: TestResult;
        trackingMethods?: TestResult;
        parallelValidation?: TestResult;
        rollbackSystem?: TestResult;
    };
    overallSuccess: boolean;
    error?: string;
}

interface TrackingMethodTestResults {
    legacy: { available: boolean; tested: boolean };
    gtm: { available: boolean; tested: boolean };
}

interface MigrationExportData {
    timestamp: number;
    migrationEvents: any[];
    validationReport: any;
    monitoringDashboard: any;
    rollbackStatus: any;
    migrationStatus: any;
}

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

class MigrationService {
    private initialized: boolean = false;
    private trackingMethods: TrackingMethods = {
        legacy: null,
        gtm: null
    };

    constructor() {
        this.initialize();
    }

    /**
     * Initialize migration service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize tracking methods based on migration phase
            await this.initializeTrackingMethods();

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;

            migrationFeatureFlags.trackMigrationEvent('migration_service_initialized', {
                migrationPhase: migrationFeatureFlags.getMigrationStatus().phase,
                shouldUseGTM: migrationFeatureFlags.shouldUseGTM(),
                shouldUseParallelTracking: migrationFeatureFlags.shouldUseParallelTracking()
            });

        } catch (error) {
            console.error('[MigrationService] Initialization failed:', error);

            // Fallback to legacy tracking
            await this.fallbackToLegacy((error as Error).message);
        }
    }

    /**
     * Initialize tracking methods based on migration phase
     */
    private async initializeTrackingMethods(): Promise<void> {
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
    private async initializeLegacyTracking(): Promise<TrackingMethod> {
        return {
            trackEvent: (eventName: string, eventData: Record<string, any>) => {
                if (window.gtag) {
                    window.gtag('event', eventName, eventData);
                }
            },

            trackPurchase: (transactionData: TransactionData) => {
                if (window.gtag) {
                    window.gtag('event', 'purchase', {
                        transaction_id: transactionData.transaction_id,
                        value: transactionData.value,
                        currency: transactionData.currency,
                        items: transactionData.items
                    });
                }
            },

            trackConversion: (conversionData: ConversionData) => {
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
    private async initializeGTMTracking(): Promise<TrackingMethod> {
        // Import GTM service dynamically
        const { default: gtmService } = await import('./gtmService');

        return {
            trackEvent: (eventName: string, eventData: Record<string, any>) => {
                gtmService.pushEvent(eventName, eventData);
            },

            trackPurchase: (transactionData: TransactionData) => {
                gtmService.pushEvent('purchase', transactionData);
            },

            trackConversion: (conversionData: ConversionData) => {
                gtmService.pushEvent('conversion', conversionData);
            }
        };
    }

    /**
     * Set up event listeners for migration management
     */
    private setupEventListeners(): void {
        // Listen for rollback completion
        window.addEventListener('migration-rollback-complete', (event: Event) => {
            const customEvent = event as CustomEvent;
            this.handleRollbackComplete(customEvent.detail);
        });

        // Listen for feature flag changes
        window.addEventListener('storage', (event: StorageEvent) => {
            if (event.key && event.key.startsWith('migration_flag_')) {
                this.handleFeatureFlagChange(event);
            }
        });
    }

    /**
     * Handle rollback completion
     */
    private handleRollbackComplete(rollbackEvent: { success: boolean; id: string }): void {
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
    private async handleFeatureFlagChange(event: StorageEvent): Promise<void> {
        const flagName = event.key!.replace('migration_flag_', '');

        // Reinitialize if GTM flags changed
        if (flagName.includes('gtm') || flagName === 'emergencyRollbackEnabled') {
            await this.initializeTrackingMethods();
        }
    }

    /**
     * Track event with migration logic
     */
    async trackEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
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
                await this.fallbackToLegacy(`Event tracking failed: ${(error as Error).message}`);
            }
        }
    }

    /**
     * Track purchase with migration logic
     */
    async trackPurchase(transactionData: TransactionData): Promise<void> {
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
                rollbackManager.triggerEmergencyRollback(`Purchase tracking failed: ${(error as Error).message}`);
            }
        }
    }

    /**
     * Track conversion with migration logic
     */
    async trackConversion(conversionData: ConversionData): Promise<void> {
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
                rollbackManager.triggerEmergencyRollback(`Conversion tracking failed: ${(error as Error).message}`);
            }
        }
    }

    /**
     * Fallback to legacy tracking
     */
    private async fallbackToLegacy(reason: string): Promise<void> {
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
    getMigrationDashboard(): MigrationDashboard {
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
    async forceHealthCheck(): Promise<any> {
        return await migrationMonitor.forceHealthCheck();
    }

    /**
     * Test migration system
     */
    async testMigrationSystem(): Promise<MigrationTestResults> {
        const testResults: MigrationTestResults = {
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
            const rollbackTestResult = await rollbackManager.testRollbackSystem();
            testResults.tests.rollbackSystem = {
                success: rollbackTestResult.overallSuccess,
                error: rollbackTestResult.error,
                details: rollbackTestResult
            };

            testResults.overallSuccess = Object.values(testResults.tests).every(test => test.success !== false);

        } catch (error) {
            testResults.error = (error as Error).message;
        }

        return testResults;
    }

    /**
     * Test feature flags functionality
     */
    private testFeatureFlags(): TestResult {
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
                error: (error as Error).message
            };
        }
    }

    /**
     * Test tracking methods
     */
    private async testTrackingMethods(): Promise<TestResult> {
        const results: TrackingMethodTestResults = {
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
                error: (error as Error).message,
                details: results
            };
        }
    }

    /**
     * Test parallel validation
     */
    private testParallelValidation(): TestResult {
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
                error: (error as Error).message
            };
        }
    }

    /**
     * Clear all migration data
     */
    clearMigrationData(): void {
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
    exportMigrationData(): MigrationExportData {
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