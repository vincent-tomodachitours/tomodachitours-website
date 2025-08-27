/**
 * Parallel Tracking Validator Tests
 * Tests for the parallel tracking validation functionality
 */

import parallelTrackingValidator from '../parallelTrackingValidator';
import migrationFeatureFlags from '../migrationFeatureFlags';

// Mock dependencies
jest.mock('../migrationFeatureFlags');

describe('ParallelTrackingValidator', () => {
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Reset mocks
        jest.clearAllMocks();

        // Setup default mock returns
        migrationFeatureFlags.flags = {
            conversionValidationEnabled: true
        };
        migrationFeatureFlags.trackMigrationEvent = jest.fn();

        // Mock window.dataLayer
        global.window.dataLayer = [];

        // Clear validator state
        parallelTrackingValidator.validationData.clear();
        parallelTrackingValidator.comparisonResults = [];
    });

    afterEach(() => {
        delete global.window.dataLayer;
    });

    describe('Initialization', () => {
        test('should initialize with validation enabled', () => {
            expect(parallelTrackingValidator.validationEnabled).toBe(true);
        });

        test('should load existing validation data from localStorage', () => {
            const testData = {
                comparisonResults: [
                    { trackingId: 'test_123', hasDiscrepancies: false }
                ]
            };

            localStorage.setItem('parallel_tracking_validation', JSON.stringify(testData));

            // Create new instance to test loading
            const validator = new (parallelTrackingValidator.constructor)();

            expect(validator.comparisonResults).toHaveLength(1);
            expect(validator.comparisonResults[0].trackingId).toBe('test_123');
        });
    });

    describe('Tracking ID Generation', () => {
        test('should generate consistent tracking ID for same data', () => {
            const conversionData = {
                transaction_id: 'test_123',
                event: 'purchase',
                timestamp: 1234567890
            };

            const id1 = parallelTrackingValidator.generateTrackingId(conversionData);
            const id2 = parallelTrackingValidator.generateTrackingId(conversionData);

            expect(id1).toBe(id2);
        });

        test('should generate different IDs for different data', () => {
            const data1 = { transaction_id: 'test_123', event: 'purchase' };
            const data2 = { transaction_id: 'test_456', event: 'purchase' };

            const id1 = parallelTrackingValidator.generateTrackingId(data1);
            const id2 = parallelTrackingValidator.generateTrackingId(data2);

            expect(id1).not.toBe(id2);
        });
    });

    describe('Legacy Conversion Tracking', () => {
        test('should track legacy conversion when validation enabled', () => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD'
            };

            parallelTrackingValidator.trackLegacyConversion(conversionData);

            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'legacy_conversion_tracked',
                expect.objectContaining({
                    conversionType: 'purchase',
                    value: 299.99
                })
            );
        });

        test('should not track when validation disabled', () => {
            parallelTrackingValidator.validationEnabled = false;

            parallelTrackingValidator.trackLegacyConversion({
                event: 'purchase',
                transaction_id: 'test_123'
            });

            expect(migrationFeatureFlags.trackMigrationEvent).not.toHaveBeenCalled();
        });
    });

    describe('GTM Conversion Tracking', () => {
        test('should track GTM conversion and validate firing', (done) => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD'
            };

            // Add event to dataLayer to simulate successful firing
            global.window.dataLayer.push({
                event: 'purchase',
                transaction_id: 'test_123'
            });

            parallelTrackingValidator.trackGTMConversion(conversionData);

            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'gtm_conversion_tracked',
                expect.objectContaining({
                    conversionType: 'purchase',
                    value: 299.99
                })
            );

            // Wait for validation timeout
            setTimeout(() => {
                const trackingId = parallelTrackingValidator.generateTrackingId(conversionData);
                const trackingEntry = parallelTrackingValidator.validationData.get(trackingId);

                expect(trackingEntry.gtm.success).toBe(true);
                expect(trackingEntry.gtm.validationReason).toBe('Event found in dataLayer');
                done();
            }, 2100);
        });

        test('should detect GTM firing failure', (done) => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'test_123'
            };

            // Don't add event to dataLayer to simulate failure

            parallelTrackingValidator.trackGTMConversion(conversionData);

            setTimeout(() => {
                const trackingId = parallelTrackingValidator.generateTrackingId(conversionData);
                const trackingEntry = parallelTrackingValidator.validationData.get(trackingId);

                expect(trackingEntry.gtm.success).toBe(false);
                expect(trackingEntry.gtm.validationReason).toBe('Event not found in dataLayer');
                done();
            }, 2100);
        });
    });

    describe('Comparison Logic', () => {
        test('should compare tracking data when both systems tracked', () => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD'
            };

            // Track with both systems
            parallelTrackingValidator.trackLegacyConversion(conversionData);
            parallelTrackingValidator.trackGTMConversion(conversionData);

            // Manually trigger comparison (normally happens after GTM validation)
            const trackingId = parallelTrackingValidator.generateTrackingId(conversionData);
            parallelTrackingValidator.compareTrackingData(trackingId);

            expect(parallelTrackingValidator.comparisonResults).toHaveLength(1);

            const comparison = parallelTrackingValidator.comparisonResults[0];
            expect(comparison.trackingId).toBe(trackingId);
            expect(comparison.legacy.success).toBe(true);
            expect(comparison.gtm.success).toBe(true);
        });

        test('should detect value discrepancies', () => {
            const legacyData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 299.99,
                currency: 'USD'
            };

            const gtmData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 199.99, // Different value
                currency: 'USD'
            };

            parallelTrackingValidator.trackLegacyConversion(legacyData);
            parallelTrackingValidator.trackGTMConversion(gtmData);

            const trackingId = parallelTrackingValidator.generateTrackingId(legacyData);
            parallelTrackingValidator.compareTrackingData(trackingId);

            const comparison = parallelTrackingValidator.comparisonResults[0];
            expect(comparison.hasDiscrepancies).toBe(true);
            expect(comparison.discrepancies).toContainEqual(
                expect.objectContaining({
                    type: 'value_mismatch',
                    legacy: 299.99,
                    gtm: 199.99,
                    severity: 'medium'
                })
            );
        });

        test('should detect success status discrepancies', () => {
            const conversionData = {
                event: 'purchase',
                transaction_id: 'test_123',
                value: 299.99
            };

            parallelTrackingValidator.trackLegacyConversion(conversionData);
            parallelTrackingValidator.trackGTMConversion(conversionData);

            const trackingId = parallelTrackingValidator.generateTrackingId(conversionData);

            // Manually set GTM as failed
            const trackingEntry = parallelTrackingValidator.validationData.get(trackingId);
            trackingEntry.gtm.success = false;

            parallelTrackingValidator.compareTrackingData(trackingId);

            const comparison = parallelTrackingValidator.comparisonResults[0];
            expect(comparison.hasDiscrepancies).toBe(true);
            expect(comparison.severity).toBe('high');
            expect(comparison.discrepancies).toContainEqual(
                expect.objectContaining({
                    type: 'success_mismatch',
                    severity: 'high'
                })
            );
        });
    });

    describe('Severity Calculation', () => {
        test('should return high severity for high severity discrepancies', () => {
            const discrepancies = [
                { severity: 'low' },
                { severity: 'high' },
                { severity: 'medium' }
            ];

            const severity = parallelTrackingValidator.calculateOverallSeverity(discrepancies);
            expect(severity).toBe('high');
        });

        test('should return medium severity when no high but has medium', () => {
            const discrepancies = [
                { severity: 'low' },
                { severity: 'medium' }
            ];

            const severity = parallelTrackingValidator.calculateOverallSeverity(discrepancies);
            expect(severity).toBe('medium');
        });

        test('should return none severity for no discrepancies', () => {
            const severity = parallelTrackingValidator.calculateOverallSeverity([]);
            expect(severity).toBe('none');
        });
    });

    describe('High Severity Alert Handling', () => {
        test('should trigger emergency rollback on multiple high severity issues', () => {
            migrationFeatureFlags.emergencyRollback = jest.fn();

            // Create multiple high severity comparisons
            for (let i = 0; i < 3; i++) {
                parallelTrackingValidator.comparisonResults.push({
                    timestamp: Date.now(),
                    severity: 'high',
                    trackingId: `test_${i}`
                });
            }

            const comparison = {
                trackingId: 'test_trigger',
                severity: 'high',
                discrepancies: [{ severity: 'high' }]
            };

            parallelTrackingValidator.alertHighSeverityDiscrepancy(comparison);

            expect(migrationFeatureFlags.emergencyRollback).toHaveBeenCalledWith(
                'Multiple high severity tracking discrepancies detected'
            );
        });
    });

    describe('Validation Summary', () => {
        test('should generate validation summary statistics', () => {
            // Add test comparison results
            const now = Date.now();
            parallelTrackingValidator.comparisonResults = [
                {
                    timestamp: now - 1000,
                    hasDiscrepancies: false,
                    severity: 'none',
                    discrepancies: []
                },
                {
                    timestamp: now - 2000,
                    hasDiscrepancies: true,
                    severity: 'medium',
                    discrepancies: [{ type: 'value_mismatch' }]
                },
                {
                    timestamp: now - 3000,
                    hasDiscrepancies: true,
                    severity: 'high',
                    discrepancies: [{ type: 'success_mismatch' }]
                }
            ];

            const summary = parallelTrackingValidator.getValidationSummary();

            expect(summary.totalComparisons).toBe(3);
            expect(summary.successfulComparisons).toBe(1);
            expect(summary.discrepancyRate).toBe('66.67');
            expect(summary.severityBreakdown.high).toBe(1);
            expect(summary.severityBreakdown.medium).toBe(1);
        });

        test('should filter by time range', () => {
            const now = Date.now();
            const oneHourAgo = now - 3600000;
            const twoHoursAgo = now - 7200000;

            parallelTrackingValidator.comparisonResults = [
                { timestamp: now, hasDiscrepancies: false },
                { timestamp: oneHourAgo - 1000, hasDiscrepancies: false }, // Just outside range
                { timestamp: twoHoursAgo, hasDiscrepancies: true }
            ];

            const summary = parallelTrackingValidator.getValidationSummary(3600000); // 1 hour

            expect(summary.totalComparisons).toBe(1); // Only the recent one
        });
    });

    describe('Data Persistence', () => {
        test('should save validation results to localStorage', () => {
            parallelTrackingValidator.comparisonResults = [
                { trackingId: 'test_123', hasDiscrepancies: false }
            ];

            parallelTrackingValidator.saveValidationResults();

            const stored = JSON.parse(localStorage.getItem('parallel_tracking_validation'));
            expect(stored.comparisonResults).toHaveLength(1);
            expect(stored.comparisonResults[0].trackingId).toBe('test_123');
        });

        test('should limit stored results to 50', () => {
            // Add 60 results
            for (let i = 0; i < 60; i++) {
                parallelTrackingValidator.comparisonResults.push({
                    trackingId: `test_${i}`,
                    hasDiscrepancies: false
                });
            }

            parallelTrackingValidator.saveValidationResults();

            const stored = JSON.parse(localStorage.getItem('parallel_tracking_validation'));
            expect(stored.comparisonResults).toHaveLength(50);
            expect(stored.comparisonResults[0].trackingId).toBe('test_10'); // First 10 removed
        });
    });

    describe('Data Clearing', () => {
        test('should clear all validation data', () => {
            parallelTrackingValidator.validationData.set('test', {});
            parallelTrackingValidator.comparisonResults = [{ test: 'data' }];
            localStorage.setItem('parallel_tracking_validation', 'test');

            parallelTrackingValidator.clearValidationData();

            expect(parallelTrackingValidator.validationData.size).toBe(0);
            expect(parallelTrackingValidator.comparisonResults).toHaveLength(0);
            expect(localStorage.getItem('parallel_tracking_validation')).toBeNull();
            expect(migrationFeatureFlags.trackMigrationEvent).toHaveBeenCalledWith(
                'validation_data_cleared',
                expect.any(Object)
            );
        });
    });

    describe('Common Discrepancies Analysis', () => {
        test('should identify common discrepancy types', () => {
            const results = [
                {
                    discrepancies: [
                        { type: 'value_mismatch' },
                        { type: 'timing_difference' }
                    ]
                },
                {
                    discrepancies: [
                        { type: 'value_mismatch' },
                        { type: 'currency_mismatch' }
                    ]
                },
                {
                    discrepancies: [
                        { type: 'value_mismatch' }
                    ]
                }
            ];

            const common = parallelTrackingValidator.getCommonDiscrepancies(results);

            expect(common[0]).toEqual({ type: 'value_mismatch', count: 3 });
            expect(common[1]).toEqual({ type: 'timing_difference', count: 1 });
            expect(common[2]).toEqual({ type: 'currency_mismatch', count: 1 });
        });
    });
});