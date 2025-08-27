/**
 * Migration Integration Tests
 * Tests the complete migration system integration
 */

import migrationService from '../migrationService';
import migrationFeatureFlags from '../migrationFeatureFlags';
import parallelTrackingValidator from '../parallelTrackingValidator';
import migrationMonitor from '../migrationMonitor';
import rollbackManager from '../rollbackManager';

// Mock GTM service
jest.mock('../gtmService', () => ({
    pushEvent: jest.fn(),
    initialize: jest.fn(),
    shouldInitializeGTM: jest.fn(() => true)
}));

describe('Migration Integration', () => {
    beforeEach(() => {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        // Reset mocks
        jest.clearAllMocks();

        // Setup window objects
        global.window.gtag = jest.fn();
        global.window.dataLayer = [];

        // Reset environment
        delete process.env.REACT_APP_GTM_ENABLED;
        delete process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE;
    });

    afterEach(() => {
        delete global.window.gtag;
        delete global.window.dataLayer;
    });

    describe('End-to-End Migration Flow', () => {
        test('should handle complete migration lifecycle', async () => {
            // Phase 1: Legacy only (0% rollout)
            process.env.REACT_APP_GTM_ENABLED = 'false';
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '0';

            // Test legacy tracking
            await migrationService.trackEvent('test_event', { value: 100 });

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'test_event', { value: 100 });

            // Phase 2: Enable GTM with parallel tracking (50% rollout)
            migrationFeatureFlags.updateFlag('gtmEnabled', true);
            migrationFeatureFlags.updateFlag('gtmParallelTracking', true);
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '50';

            // Force user into GTM rollout
            sessionStorage.setItem('migration_session_id', 'test_session_gtm');

            // Test parallel tracking
            await migrationService.trackEvent('test_event_parallel', { value: 200 });

            // Should track with both systems
            expect(global.window.gtag).toHaveBeenCalledWith('event', 'test_event_parallel', { value: 200 });

            // Phase 3: Full GTM (100% rollout)
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '100';
            migrationFeatureFlags.updateFlag('gtmParallelTracking', false);

            await migrationService.trackEvent('test_event_gtm', { value: 300 });

            // Should still work (GTM service is mocked)
            expect(global.window.gtag).toHaveBeenCalled();
        });

        test('should handle emergency rollback scenario', async () => {
            // Setup GTM mode
            migrationFeatureFlags.updateFlag('gtmEnabled', true);
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '100';

            // Simulate critical error that triggers rollback
            const rollbackEvent = await rollbackManager.triggerEmergencyRollback('Test emergency');

            expect(rollbackEvent.success).toBe(true);
            expect(migrationFeatureFlags.flags.emergencyRollbackEnabled).toBe(true);
            expect(migrationFeatureFlags.flags.gtmEnabled).toBe(false);

            // Test that tracking still works after rollback
            await migrationService.trackEvent('post_rollback_event', { value: 400 });

            expect(global.window.gtag).toHaveBeenCalledWith('event', 'post_rollback_event', { value: 400 });
        });
    });

    describe('Parallel Tracking Validation', () => {
        test('should validate parallel tracking accuracy', async () => {
            // Enable parallel tracking
            migrationFeatureFlags.updateFlag('gtmEnabled', true);
            migrationFeatureFlags.updateFlag('gtmParallelTracking', true);
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '100';

            const conversionData = {
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD'
            };

            // Track purchase with both systems
            await migrationService.trackPurchase(conversionData);

            // Simulate GTM validation
            global.window.dataLayer.push({
                event: 'purchase',
                transaction_id: 'test_123'
            });

            // Wait for validation
            await new Promise(resolve => setTimeout(resolve, 2100));

            const validationSummary = parallelTrackingValidator.getValidationSummary();
            expect(validationSummary.totalComparisons).toBeGreaterThan(0);
        });

        test('should detect and handle discrepancies', () => {
            // Simulate discrepancy
            parallelTrackingValidator.trackLegacyConversion({
                event: 'purchase',
                transaction_id: 'test_456',
                value: 299.99
            });

            parallelTrackingValidator.trackGTMConversion({
                event: 'purchase',
                transaction_id: 'test_456',
                value: 199.99 // Different value
            });

            const trackingId = parallelTrackingValidator.generateTrackingId({
                event: 'purchase',
                transaction_id: 'test_456'
            });

            parallelTrackingValidator.compareTrackingData(trackingId);

            const comparison = parallelTrackingValidator.comparisonResults[0];
            expect(comparison.hasDiscrepancies).toBe(true);
            expect(comparison.discrepancies).toContainEqual(
                expect.objectContaining({
                    type: 'value_mismatch'
                })
            );
        });
    });

    describe('Health Monitoring', () => {
        test('should monitor system health', async () => {
            // Enable monitoring
            migrationFeatureFlags.updateFlag('migrationMonitoringEnabled', true);

            const healthCheck = await migrationMonitor.runHealthChecks();

            expect(healthCheck).toHaveProperty('timestamp');
            expect(healthCheck).toHaveProperty('checks');
            expect(healthCheck).toHaveProperty('overallHealth');
            expect(healthCheck.checks).toHaveProperty('gtmContainer');
            expect(healthCheck.checks).toHaveProperty('dataLayer');
            expect(healthCheck.checks).toHaveProperty('featureFlags');
        });

        test('should generate alerts on health issues', async () => {
            // Simulate unhealthy condition
            migrationFeatureFlags.updateFlag('gtmEnabled', true);
            delete global.window.dataLayer; // Remove dataLayer to trigger alert

            const healthCheck = await migrationMonitor.runHealthChecks();

            expect(healthCheck.overallHealth).toBe('critical');
            expect(healthCheck.alerts.length).toBeGreaterThan(0);
            expect(healthCheck.alerts.some(alert => alert.severity === 'critical')).toBe(true);
        });
    });

    describe('Feature Flag Management', () => {
        test('should manage rollout percentage correctly', () => {
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '25';

            // Test multiple users to verify percentage distribution
            const results = [];
            for (let i = 0; i < 100; i++) {
                sessionStorage.setItem('migration_session_id', `test_session_${i}`);
                results.push(migrationFeatureFlags.shouldUseGTM());
            }

            const gtmUsers = results.filter(Boolean).length;

            // Should be approximately 25% (allow some variance due to hashing)
            expect(gtmUsers).toBeGreaterThan(15);
            expect(gtmUsers).toBeLessThan(35);
        });

        test('should provide consistent user experience', () => {
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '50';
            migrationFeatureFlags.updateFlag('gtmEnabled', true);

            // Same session should always get same result
            sessionStorage.setItem('migration_session_id', 'consistent_session');

            const result1 = migrationFeatureFlags.shouldUseGTM();
            const result2 = migrationFeatureFlags.shouldUseGTM();
            const result3 = migrationFeatureFlags.shouldUseGTM();

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });
    });

    describe('Data Export and Analysis', () => {
        test('should export comprehensive migration data', () => {
            // Generate some test data
            migrationFeatureFlags.trackMigrationEvent('test_event', { data: 'test' });
            parallelTrackingValidator.trackLegacyConversion({ event: 'test', value: 100 });

            const exportData = migrationService.exportMigrationData();

            expect(exportData).toHaveProperty('timestamp');
            expect(exportData).toHaveProperty('migrationEvents');
            expect(exportData).toHaveProperty('validationReport');
            expect(exportData).toHaveProperty('monitoringDashboard');
            expect(exportData).toHaveProperty('rollbackStatus');
            expect(exportData).toHaveProperty('migrationStatus');

            expect(exportData.migrationEvents.length).toBeGreaterThan(0);
        });

        test('should clear migration data when requested', () => {
            // Add test data
            migrationFeatureFlags.trackMigrationEvent('test_event', {});
            parallelTrackingValidator.trackLegacyConversion({ event: 'test' });

            // Clear data
            migrationService.clearMigrationData();

            // Verify data is cleared
            expect(migrationFeatureFlags.getMigrationEvents()).toHaveLength(0);
            expect(parallelTrackingValidator.comparisonResults).toHaveLength(0);
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle GTM loading failures gracefully', async () => {
            // Simulate GTM loading failure
            migrationFeatureFlags.updateFlag('gtmEnabled', true);

            // Mock GTM service to fail
            const gtmService = require('../gtmService').default;
            gtmService.pushEvent.mockImplementation(() => {
                throw new Error('GTM loading failed');
            });

            // Should not throw error
            await expect(migrationService.trackEvent('test_event', {})).resolves.not.toThrow();

            // Should fallback to legacy tracking
            expect(global.window.gtag).toHaveBeenCalled();
        });

        test('should recover from temporary failures', async () => {
            let callCount = 0;

            // Mock intermittent failures
            global.window.gtag.mockImplementation(() => {
                callCount++;
                if (callCount <= 2) {
                    throw new Error('Temporary failure');
                }
            });

            // Should eventually succeed
            await migrationService.trackEvent('test_event', {});
            await migrationService.trackEvent('test_event', {});
            await migrationService.trackEvent('test_event', {});

            expect(callCount).toBe(3);
        });
    });

    describe('Performance Impact', () => {
        test('should not significantly impact performance', async () => {
            const startTime = Date.now();

            // Perform multiple tracking operations
            for (let i = 0; i < 10; i++) {
                await migrationService.trackEvent(`test_event_${i}`, { value: i * 100 });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (1 second for 10 operations)
            expect(duration).toBeLessThan(1000);
        });

        test('should handle high-frequency events', async () => {
            const events = [];

            // Generate many events quickly
            for (let i = 0; i < 50; i++) {
                events.push(migrationService.trackEvent(`rapid_event_${i}`, { value: i }));
            }

            // Should handle all events without errors
            await expect(Promise.all(events)).resolves.not.toThrow();
        });
    });
});