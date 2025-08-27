/**
 * Migration Service Tests
 * Tests for the unified migration service functionality
 */

import migrationService from '../migrationService';
import migrationFeatureFlags from '../migrationFeatureFlags';
import parallelTrackingValidator from '../parallelTrackingValidator';
import migrationMonitor from '../migrationMonitor';
import rollbackManager from '../rollbackManager';

// Mock dependencies
jest.mock('../migrationFeatureFlags');
jest.mock('../parallelTrackingValidator');
jest.mock('../migrationMonitor');
jest.mock('../rollbackManager');
jest.mock('../gtmService', () => ({
    pushEvent: jest.fn(),
    initialize: jest.fn()
}));

describe('MigrationService', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup default mock returns
        migrationFeatureFlags.getMigrationStatus.mockReturnValue({
            phase: 'parallel',
            shouldUseGTM: true,
            shouldUseParallelTracking: true,
            flags: {
                gtmEnabled: true,
                gtmParallelTracking: true
            }
        });

        migrationFeatureFlags.trackMigrationEvent = jest.fn();
        parallelTrackingValidator.trackLegacyConversion = jest.fn();
        parallelTrackingValidator.trackGTMConversion = jest.fn();
        parallelTrackingValidator.getValidationReport = jest.fn().mockReturnValue({
            summary: { totalComparisons: 10, discrepancyRate: '5.0' },
            recentComparisons: []
        });

        migrationMonitor.getMonitoringDashboard = jest.fn().mockReturnValue({
            currentHealth: 'healthy',
            recentAlerts: 0,
            criticalAlerts: 0
        });

        rollbackManager.getRollbackStatus = jest.fn().mockReturnValue({
            isActive: false,
            inProgress: false
        });

        // Mock window.gtag
        global.window.gtag = jest.fn();
        global.window.dataLayer = [];
    });

    afterEach(() => {
        delete global.window.gtag;
        delete global.window.dataLayer;
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            expect(migrationService.initialized).toBe(true);
            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'migration_service_initialized',
                expect.any(Object)
            );
        });

        test('should initialize tracking methods based on migration phase', () => {
            expect(migrationService.trackingMethods.legacy).toBeDefined();
            expect(migrationService.trackingMethods.gtm).toBeDefined();
        });
    });

    describe('Event Tracking', () => {
        test('should track events with both legacy and GTM when parallel tracking enabled', async () => {
            const eventData = {
                event_category: 'test',
                event_label: 'test_event',
                value: 100
            };

            await migrationService.trackEvent('test_event', eventData);

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'test_event', eventData);
            expect(parallelTrackingValidator.trackLegacyConversion).toHaveBeenCalledWith({
                event: 'test_event',
                ...eventData
            });
            expect(parallelTrackingValidator.trackGTMConversion).toHaveBeenCalledWith({
                event: 'test_event',
                ...eventData
            });
        });

        test('should track events with legacy only when GTM disabled', async () => {
            migrationFeatureFlags.getMigrationStatus.mockReturnValue({
                phase: 'legacy',
                shouldUseGTM: false,
                shouldUseParallelTracking: false
            });

            const eventData = {
                event_category: 'test',
                event_label: 'test_event'
            };

            await migrationService.trackEvent('test_event', eventData);

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'test_event', eventData);
            expect(parallelTrackingValidator.trackLegacyConversion).not.toHaveBeenCalled();
            expect(parallelTrackingValidator.trackGTMConversion).not.toHaveBeenCalled();
        });

        test('should handle tracking errors gracefully', async () => {
            // Mock gtag to throw error
            global.window.gtag.mockImplementation(() => {
                throw new Error('Tracking failed');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await migrationService.trackEvent('test_event', {});

            expect(consoleSpy).toHaveBeenCalledWith(
                '[MigrationService] Event tracking failed:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Purchase Tracking', () => {
        test('should track purchases with both systems during parallel tracking', async () => {
            const transactionData = {
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD',
                items: [{ item_id: 'tour_1', item_name: 'Test Tour', price: 299.99 }]
            };

            await migrationService.trackPurchase(transactionData);

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'purchase', transactionData);
            expect(parallelTrackingValidator.trackLegacyConversion).toHaveBeenCalledWith({
                event: 'purchase',
                ...transactionData
            });
            expect(parallelTrackingValidator.trackGTMConversion).toHaveBeenCalledWith({
                event: 'purchase',
                ...transactionData
            });
        });

        test('should trigger rollback on purchase tracking failure', async () => {
            global.window.gtag.mockImplementation(() => {
                throw new Error('Purchase tracking failed');
            });

            rollbackManager.triggerEmergencyRollback = jest.fn();

            await migrationService.trackPurchase({
                transaction_id: 'test_123',
                value: 299.99
            });

            expect(rollbackManager.triggerEmergencyRollback).toHaveBeenCalledWith(
                'Purchase tracking failed: Purchase tracking failed'
            );
        });
    });

    describe('Conversion Tracking', () => {
        test('should track conversions with both systems during parallel tracking', async () => {
            const conversionData = {
                conversion_label: 'AW-123456789/AbCdEfGhIjKlMnOp',
                value: 299.99,
                currency: 'USD',
                transaction_id: 'test_123'
            };

            await migrationService.trackConversion(conversionData);

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: conversionData.conversion_label,
                value: conversionData.value,
                currency: conversionData.currency,
                transaction_id: conversionData.transaction_id
            });
        });

        test('should trigger rollback on conversion tracking failure', async () => {
            global.window.gtag.mockImplementation(() => {
                throw new Error('Conversion tracking failed');
            });

            rollbackManager.triggerEmergencyRollback = jest.fn();

            await migrationService.trackConversion({
                conversion_label: 'test_label',
                value: 100
            });

            expect(rollbackManager.triggerEmergencyRollback).toHaveBeenCalledWith(
                'Conversion tracking failed: Conversion tracking failed'
            );
        });
    });

    describe('Dashboard Data', () => {
        test('should return comprehensive dashboard data', () => {
            const dashboardData = migrationService.getMigrationDashboard();

            expect(dashboardData).toHaveProperty('migrationStatus');
            expect(dashboardData).toHaveProperty('monitoringDashboard');
            expect(dashboardData).toHaveProperty('validationReport');
            expect(dashboardData).toHaveProperty('rollbackStatus');
            expect(dashboardData).toHaveProperty('trackingMethods');
            expect(dashboardData).toHaveProperty('initialized');

            expect(dashboardData.initialized).toBe(true);
            expect(dashboardData.trackingMethods.legacy).toBe(true);
            expect(dashboardData.trackingMethods.gtm).toBe(true);
        });
    });

    describe('System Testing', () => {
        test('should run comprehensive system tests', async () => {
            rollbackManager.testRollbackSystem = jest.fn().mockResolvedValue({
                overallSuccess: true,
                tests: {}
            });

            const testResults = await migrationService.testMigrationSystem();

            expect(testResults).toHaveProperty('timestamp');
            expect(testResults).toHaveProperty('tests');
            expect(testResults).toHaveProperty('overallSuccess');
            expect(testResults.tests).toHaveProperty('featureFlags');
            expect(testResults.tests).toHaveProperty('trackingMethods');
            expect(testResults.tests).toHaveProperty('parallelValidation');
            expect(testResults.tests).toHaveProperty('rollbackSystem');
        });

        test('should handle test failures gracefully', async () => {
            rollbackManager.testRollbackSystem = jest.fn().mockRejectedValue(
                new Error('Test failed')
            );

            const testResults = await migrationService.testMigrationSystem();

            expect(testResults.overallSuccess).toBe(false);
            expect(testResults).toHaveProperty('error');
        });
    });

    describe('Data Management', () => {
        test('should clear all migration data', () => {
            migrationFeatureFlags.clearMigrationEvents = jest.fn();
            parallelTrackingValidator.clearValidationData = jest.fn();
            migrationMonitor.clearMonitoringData = jest.fn();
            rollbackManager.clearRollbackHistory = jest.fn();

            migrationService.clearMigrationData();

            expect(migrationFeatureFlags.clearMigrationEvents).toHaveBeenCalled();
            expect(parallelTrackingValidator.clearValidationData).toHaveBeenCalled();
            expect(migrationMonitor.clearMonitoringData).toHaveBeenCalled();
            expect(rollbackManager.clearRollbackHistory).toHaveBeenCalled();
            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'migration_data_cleared',
                expect.any(Object)
            );
        });

        test('should export migration data', () => {
            migrationFeatureFlags.getMigrationEvents = jest.fn().mockReturnValue([]);

            const exportData = migrationService.exportMigrationData();

            expect(exportData).toHaveProperty('timestamp');
            expect(exportData).toHaveProperty('migrationEvents');
            expect(exportData).toHaveProperty('validationReport');
            expect(exportData).toHaveProperty('monitoringDashboard');
            expect(exportData).toHaveProperty('rollbackStatus');
            expect(exportData).toHaveProperty('migrationStatus');
        });
    });

    describe('Fallback Behavior', () => {
        test('should fallback to legacy when GTM fails', async () => {
            migrationFeatureFlags.updateFlag = jest.fn();

            await migrationService.fallbackToLegacy('GTM initialization failed');

            expect(migrationFeatureFlags.updateFlag).toHaveBeenCalledWith('gtmEnabled', false);
            expect(migrationFeatureFlags.updateFlag).toHaveBeenCalledWith('legacyTrackingFallback', true);
            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'fallback_to_legacy',
                expect.objectContaining({
                    reason: 'GTM initialization failed'
                })
            );
        });
    });

    describe('Event Listeners', () => {
        test('should handle rollback completion events', () => {
            const rollbackEvent = {
                success: true,
                id: 'test_rollback_123'
            };

            // Simulate rollback completion event
            const event = new CustomEvent('migration-rollback-complete', {
                detail: rollbackEvent
            });

            window.dispatchEvent(event);

            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'migration_service_rollback_handled',
                { rollbackId: rollbackEvent.id }
            );
        });

        test('should handle feature flag changes', async () => {
            const storageEvent = new StorageEvent('storage', {
                key: 'migration_flag_gtmEnabled',
                newValue: 'false'
            });

            // Mock the initialization method
            const initSpy = jest.spyOn(migrationService, 'initializeTrackingMethods');

            window.dispatchEvent(storageEvent);

            // Wait for async handling
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(initSpy).toHaveBeenCalled();
        });
    });
});