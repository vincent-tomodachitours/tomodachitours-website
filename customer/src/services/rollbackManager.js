/**
 * Rollback Manager
 * Handles emergency reversion to legacy tracking system
 */

import migrationFeatureFlags from './migrationFeatureFlags';

class RollbackManager {
    constructor() {
        this.rollbackHistory = [];
        this.rollbackInProgress = false;
        this.legacyTrackingBackup = null;

        // Initialize rollback system
        this.initializeRollbackSystem();
    }

    /**
     * Initialize rollback system and backup mechanisms
     */
    initializeRollbackSystem() {
        // Create backup of legacy tracking functions
        this.createLegacyTrackingBackup();

        // Set up emergency rollback listeners
        this.setupEmergencyListeners();

        // Load rollback history
        this.loadRollbackHistory();
    }

    /**
     * Create backup of legacy tracking functions
     */
    createLegacyTrackingBackup() {
        this.legacyTrackingBackup = {
            gtag: window.gtag ? window.gtag.toString() : null,
            dataLayer: window.dataLayer ? [...window.dataLayer] : null,
            gtagConfig: this.extractGtagConfig(),
            timestamp: Date.now()
        };

        migrationFeatureFlags.trackMigrationEvent('legacy_backup_created', {
            hasGtag: !!window.gtag,
            hasDataLayer: !!window.dataLayer,
            gtagConfigFound: !!this.legacyTrackingBackup.gtagConfig
        });
    }

    /**
     * Extract existing gtag configuration
     */
    extractGtagConfig() {
        try {
            // Try to extract gtag configuration from existing setup
            const scripts = document.querySelectorAll('script');
            let gtagConfig = null;

            scripts.forEach(script => {
                if (script.textContent && script.textContent.includes('gtag(')) {
                    const configMatch = script.textContent.match(/gtag\('config',\s*'([^']+)'(?:,\s*({[^}]+}))?\)/);
                    if (configMatch) {
                        gtagConfig = {
                            trackingId: configMatch[1],
                            config: configMatch[2] ? JSON.parse(configMatch[2]) : {}
                        };
                    }
                }
            });

            return gtagConfig;
        } catch (error) {
            console.warn('[RollbackManager] Failed to extract gtag config:', error);
            return null;
        }
    }

    /**
     * Set up emergency rollback event listeners
     */
    setupEmergencyListeners() {
        // Listen for keyboard shortcut (Ctrl+Shift+R)
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.triggerEmergencyRollback('Manual keyboard shortcut');
            }
        });

        // Listen for custom rollback events
        window.addEventListener('migration-emergency-rollback', (event) => {
            this.triggerEmergencyRollback(event.detail?.reason || 'Custom event triggered');
        });

        // Monitor for critical JavaScript errors
        window.addEventListener('error', (event) => {
            if (this.isCriticalTrackingError(event.error)) {
                this.triggerEmergencyRollback(`Critical tracking error: ${event.error.message}`);
            }
        });
    }

    /**
     * Check if error is critical for tracking
     */
    isCriticalTrackingError(error) {
        if (!error || !error.message) return false;

        const criticalPatterns = [
            /gtag.*not.*defined/i,
            /dataLayer.*not.*defined/i,
            /google.*tag.*manager.*error/i,
            /conversion.*tracking.*failed/i
        ];

        return criticalPatterns.some(pattern => pattern.test(error.message));
    }

    /**
     * Load rollback history from storage
     */
    loadRollbackHistory() {
        try {
            const stored = localStorage.getItem('rollback_history');
            if (stored) {
                this.rollbackHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('[RollbackManager] Failed to load rollback history:', error);
            this.rollbackHistory = [];
        }
    }

    /**
     * Save rollback history to storage
     */
    saveRollbackHistory() {
        try {
            localStorage.setItem('rollback_history', JSON.stringify(this.rollbackHistory.slice(-10)));
        } catch (error) {
            console.warn('[RollbackManager] Failed to save rollback history:', error);
        }
    }

    /**
     * Trigger emergency rollback
     */
    async triggerEmergencyRollback(reason) {
        if (this.rollbackInProgress) {
            console.warn('[RollbackManager] Rollback already in progress');
            return;
        }

        this.rollbackInProgress = true;

        const rollbackEvent = {
            id: this.generateRollbackId(),
            timestamp: Date.now(),
            reason,
            steps: [],
            success: false,
            duration: 0
        };

        const startTime = Date.now();

        try {
            console.warn('[RollbackManager] Emergency rollback initiated:', reason);

            // Step 1: Disable GTM features
            await this.disableGTMFeatures(rollbackEvent);

            // Step 2: Restore legacy tracking
            await this.restoreLegacyTracking(rollbackEvent);

            // Step 3: Validate rollback
            await this.validateRollback(rollbackEvent);

            // Step 4: Update feature flags
            await this.updateFeatureFlagsForRollback(rollbackEvent);

            rollbackEvent.success = true;
            rollbackEvent.duration = Date.now() - startTime;

            console.log('[RollbackManager] Emergency rollback completed successfully');

        } catch (error) {
            console.error('[RollbackManager] Emergency rollback failed:', error);
            rollbackEvent.error = error.message;
            rollbackEvent.duration = Date.now() - startTime;

            // Try basic fallback
            await this.basicFallbackRollback(rollbackEvent);
        }

        this.rollbackHistory.push(rollbackEvent);
        this.saveRollbackHistory();
        this.rollbackInProgress = false;

        // Notify systems of rollback
        this.notifyRollbackComplete(rollbackEvent);

        return rollbackEvent;
    }

    /**
     * Generate unique rollback ID
     */
    generateRollbackId() {
        return `rollback_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * Disable GTM features
     */
    async disableGTMFeatures(rollbackEvent) {
        const step = { name: 'disable_gtm_features', timestamp: Date.now(), success: false };

        try {
            // Disable GTM in feature flags
            migrationFeatureFlags.updateFlag('gtmEnabled', false);
            migrationFeatureFlags.updateFlag('emergencyRollbackEnabled', true);

            // Stop GTM container if possible
            if (window.google_tag_manager) {
                Object.keys(window.google_tag_manager).forEach(containerId => {
                    try {
                        // Attempt to pause GTM container
                        if (window.google_tag_manager[containerId].dataLayer) {
                            window.google_tag_manager[containerId].dataLayer.push({
                                event: 'gtm.pause'
                            });
                        }
                    } catch (error) {
                        console.warn(`[RollbackManager] Failed to pause GTM container ${containerId}:`, error);
                    }
                });
            }

            // Clear dataLayer of GTM events
            if (window.dataLayer) {
                const originalLength = window.dataLayer.length;
                window.dataLayer.length = 0;
                step.details = { originalDataLayerLength: originalLength };
            }

            step.success = true;
            step.duration = Date.now() - step.timestamp;

        } catch (error) {
            step.error = error.message;
            step.duration = Date.now() - step.timestamp;
            throw error;
        }

        rollbackEvent.steps.push(step);
    }

    /**
     * Restore legacy tracking
     */
    async restoreLegacyTracking(rollbackEvent) {
        const step = { name: 'restore_legacy_tracking', timestamp: Date.now(), success: false };

        try {
            // Restore gtag if we have a backup
            if (this.legacyTrackingBackup?.gtagConfig) {
                await this.restoreGtagTracking(this.legacyTrackingBackup.gtagConfig);
            } else {
                // Create basic gtag setup
                await this.createBasicGtagSetup();
            }

            // Initialize legacy analytics
            await this.initializeLegacyAnalytics();

            step.success = true;
            step.duration = Date.now() - step.timestamp;

        } catch (error) {
            step.error = error.message;
            step.duration = Date.now() - step.timestamp;
            throw error;
        }

        rollbackEvent.steps.push(step);
    }

    /**
     * Restore gtag tracking from backup
     */
    async restoreGtagTracking(gtagConfig) {
        return new Promise((resolve, reject) => {
            try {
                // Load gtag script if not present
                if (!window.gtag) {
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagConfig.trackingId}`;

                    script.onload = () => {
                        // Initialize gtag
                        window.dataLayer = window.dataLayer || [];
                        window.gtag = function () { window.dataLayer.push(arguments); };
                        window.gtag('js', new Date());
                        window.gtag('config', gtagConfig.trackingId, gtagConfig.config);
                        resolve();
                    };

                    script.onerror = () => {
                        reject(new Error('Failed to load gtag script'));
                    };

                    document.head.appendChild(script);
                } else {
                    // gtag already exists, just reconfigure
                    window.gtag('config', gtagConfig.trackingId, gtagConfig.config);
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create basic gtag setup as fallback
     */
    async createBasicGtagSetup() {
        const trackingId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

        return new Promise((resolve, reject) => {
            try {
                if (!window.gtag) {
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;

                    script.onload = () => {
                        window.dataLayer = window.dataLayer || [];
                        window.gtag = function () { window.dataLayer.push(arguments); };
                        window.gtag('js', new Date());
                        window.gtag('config', trackingId);
                        resolve();
                    };

                    script.onerror = () => {
                        reject(new Error('Failed to load basic gtag script'));
                    };

                    document.head.appendChild(script);
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Initialize legacy analytics functions
     */
    async initializeLegacyAnalytics() {
        // Restore basic tracking functions
        window.trackEvent = window.trackEvent || function (action, category, label, value) {
            if (window.gtag) {
                window.gtag('event', action, {
                    event_category: category,
                    event_label: label,
                    value: value
                });
            }
        };

        window.trackPurchase = window.trackPurchase || function (transactionData) {
            if (window.gtag) {
                window.gtag('event', 'purchase', {
                    transaction_id: transactionData.transaction_id,
                    value: transactionData.value,
                    currency: transactionData.currency,
                    items: transactionData.items
                });
            }
        };

        // Add other legacy tracking functions as needed
    }

    /**
     * Validate rollback success
     */
    async validateRollback(rollbackEvent) {
        const step = { name: 'validate_rollback', timestamp: Date.now(), success: false };

        try {
            const validation = {
                gtagAvailable: typeof window.gtag === 'function',
                dataLayerAvailable: Array.isArray(window.dataLayer),
                trackingFunctionsAvailable: typeof window.trackEvent === 'function',
                gtmDisabled: !migrationFeatureFlags.shouldUseGTM()
            };

            step.validation = validation;

            // Check if all validations pass
            const allValid = Object.values(validation).every(v => v === true);

            if (!allValid) {
                throw new Error(`Rollback validation failed: ${JSON.stringify(validation)}`);
            }

            // Test basic tracking
            if (window.gtag) {
                window.gtag('event', 'rollback_validation_test', {
                    event_category: 'rollback',
                    event_label: 'validation_success'
                });
            }

            step.success = true;
            step.duration = Date.now() - step.timestamp;

        } catch (error) {
            step.error = error.message;
            step.duration = Date.now() - step.timestamp;
            throw error;
        }

        rollbackEvent.steps.push(step);
    }

    /**
     * Update feature flags for rollback state
     */
    async updateFeatureFlagsForRollback(rollbackEvent) {
        const step = { name: 'update_feature_flags', timestamp: Date.now(), success: false };

        try {
            // Set all GTM-related flags to false
            migrationFeatureFlags.updateFlag('gtmEnabled', false);
            migrationFeatureFlags.updateFlag('gtmParallelTracking', false);
            migrationFeatureFlags.updateFlag('gtmCheckoutTracking', false);
            migrationFeatureFlags.updateFlag('gtmPaymentTracking', false);
            migrationFeatureFlags.updateFlag('gtmThankyouTracking', false);
            migrationFeatureFlags.updateFlag('enhancedConversionsEnabled', false);
            migrationFeatureFlags.updateFlag('serverSideBackupEnabled', false);

            // Enable rollback and legacy fallback
            migrationFeatureFlags.updateFlag('emergencyRollbackEnabled', true);
            migrationFeatureFlags.updateFlag('legacyTrackingFallback', true);

            step.success = true;
            step.duration = Date.now() - step.timestamp;

        } catch (error) {
            step.error = error.message;
            step.duration = Date.now() - step.timestamp;
            throw error;
        }

        rollbackEvent.steps.push(step);
    }

    /**
     * Basic fallback rollback for critical failures
     */
    async basicFallbackRollback(rollbackEvent) {
        const step = { name: 'basic_fallback', timestamp: Date.now(), success: false };

        try {
            // Minimal rollback - just disable GTM and enable legacy fallback
            localStorage.setItem('migration_flag_gtmEnabled', 'false');
            localStorage.setItem('migration_flag_emergencyRollbackEnabled', 'true');
            localStorage.setItem('migration_flag_legacyTrackingFallback', 'true');

            // Force page reload to apply changes
            step.details = { pageReloadRequired: true };

            setTimeout(() => {
                window.location.reload();
            }, 1000);

            step.success = true;
            step.duration = Date.now() - step.timestamp;

        } catch (error) {
            step.error = error.message;
            step.duration = Date.now() - step.timestamp;
        }

        rollbackEvent.steps.push(step);
    }

    /**
     * Notify systems of rollback completion
     */
    notifyRollbackComplete(rollbackEvent) {
        // Track rollback event
        migrationFeatureFlags.trackMigrationEvent('emergency_rollback_completed', {
            rollbackId: rollbackEvent.id,
            success: rollbackEvent.success,
            duration: rollbackEvent.duration,
            reason: rollbackEvent.reason,
            stepsCompleted: rollbackEvent.steps.length
        });

        // Send custom event
        window.dispatchEvent(new CustomEvent('migration-rollback-complete', {
            detail: rollbackEvent
        }));

        // Alert user if in development
        if (process.env.NODE_ENV === 'development') {
            console.warn('[RollbackManager] Emergency rollback completed:', rollbackEvent);
        }

        // Show user notification
        this.showRollbackNotification(rollbackEvent);
    }

    /**
     * Show rollback notification to user
     */
    showRollbackNotification(rollbackEvent) {
        // Create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${rollbackEvent.success ? '#f44336' : '#ff9800'};
      color: white;
      padding: 16px;
      border-radius: 4px;
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;

        notification.innerHTML = `
      <strong>Tracking System ${rollbackEvent.success ? 'Rollback' : 'Issue'}</strong><br>
      ${rollbackEvent.success ?
                'Switched to legacy tracking due to: ' + rollbackEvent.reason :
                'Rollback failed. Please refresh the page.'
            }
    `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }

    /**
     * Manual rollback trigger (for testing/admin use)
     */
    async manualRollback(reason = 'Manual rollback requested') {
        return await this.triggerEmergencyRollback(reason);
    }

    /**
     * Check if rollback is currently active
     */
    isRollbackActive() {
        return migrationFeatureFlags.flags.emergencyRollbackEnabled;
    }

    /**
     * Get rollback status and history
     */
    getRollbackStatus() {
        return {
            isActive: this.isRollbackActive(),
            inProgress: this.rollbackInProgress,
            history: this.rollbackHistory.slice(-5), // Last 5 rollbacks
            lastRollback: this.rollbackHistory[this.rollbackHistory.length - 1],
            legacyBackupAvailable: !!this.legacyTrackingBackup
        };
    }

    /**
     * Clear rollback history
     */
    clearRollbackHistory() {
        this.rollbackHistory = [];
        localStorage.removeItem('rollback_history');

        migrationFeatureFlags.trackMigrationEvent('rollback_history_cleared', {
            timestamp: Date.now()
        });
    }

    /**
     * Test rollback system (for validation)
     */
    async testRollbackSystem() {
        const testResult = {
            timestamp: Date.now(),
            tests: {},
            overallSuccess: false
        };

        try {
            // Test 1: Feature flag updates
            testResult.tests.featureFlagUpdate = await this.testFeatureFlagUpdate();

            // Test 2: Legacy backup availability
            testResult.tests.legacyBackup = this.testLegacyBackup();

            // Test 3: Emergency listeners
            testResult.tests.emergencyListeners = this.testEmergencyListeners();

            testResult.overallSuccess = Object.values(testResult.tests).every(test => test.success);

        } catch (error) {
            testResult.error = error.message;
        }

        return testResult;
    }

    /**
     * Test feature flag update functionality
     */
    async testFeatureFlagUpdate() {
        try {
            const originalValue = migrationFeatureFlags.flags.gtmEnabled;

            // Test flag update
            migrationFeatureFlags.updateFlag('gtmEnabled', !originalValue);
            const updatedValue = migrationFeatureFlags.flags.gtmEnabled;

            // Restore original value
            migrationFeatureFlags.updateFlag('gtmEnabled', originalValue);

            return {
                success: updatedValue === !originalValue,
                details: { originalValue, updatedValue }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test legacy backup availability
     */
    testLegacyBackup() {
        return {
            success: !!this.legacyTrackingBackup,
            details: {
                hasGtag: !!this.legacyTrackingBackup?.gtag,
                hasDataLayer: !!this.legacyTrackingBackup?.dataLayer,
                hasGtagConfig: !!this.legacyTrackingBackup?.gtagConfig,
                backupAge: this.legacyTrackingBackup ? Date.now() - this.legacyTrackingBackup.timestamp : null
            }
        };
    }

    /**
     * Test emergency listeners
     */
    testEmergencyListeners() {
        try {
            // Test custom event listener
            let eventReceived = false;

            const testHandler = () => {
                eventReceived = true;
            };

            window.addEventListener('migration-emergency-rollback', testHandler, { once: true });

            // Dispatch test event
            window.dispatchEvent(new CustomEvent('migration-emergency-rollback', {
                detail: { reason: 'Test event', test: true }
            }));

            // Clean up
            window.removeEventListener('migration-emergency-rollback', testHandler);

            return {
                success: eventReceived,
                details: { eventReceived }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const rollbackManager = new RollbackManager();

export default rollbackManager;