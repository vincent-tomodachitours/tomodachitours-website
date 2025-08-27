/**
 * Conversion Monitor Integration Tests
 * 
 * Integration tests for conversion monitoring functionality
 */

describe('ConversionMonitor Integration', () => {
    test('should be able to import conversion monitor service', () => {
        const conversionMonitor = require('../conversionMonitor.js');
        expect(conversionMonitor).toBeDefined();
        expect(conversionMonitor.default).toBeDefined();
    });

    test('should have required methods', () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        expect(typeof conversionMonitor.trackConversionAttempt).toBe('function');
        expect(typeof conversionMonitor.validateConversionFiring).toBe('function');
        expect(typeof conversionMonitor.compareActualVsTracked).toBe('function');
        expect(typeof conversionMonitor.generateDiagnosticReport).toBe('function');
        expect(typeof conversionMonitor.getMonitoringStatus).toBe('function');
        expect(typeof conversionMonitor.addAlertCallback).toBe('function');
        expect(typeof conversionMonitor.removeAlertCallback).toBe('function');
    });

    test('should return monitoring status', () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const status = conversionMonitor.getMonitoringStatus();

        expect(status).toBeDefined();
        expect(typeof status.isInitialized).toBe('boolean');
        expect(typeof status.monitoringEnabled).toBe('boolean');
        expect(status.accuracyMetrics).toBeDefined();
        expect(status.systemStatus).toBeDefined();
    });

    test('should generate diagnostic report', () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const report = conversionMonitor.generateDiagnosticReport();

        expect(report).toBeDefined();
        expect(report.generatedAt).toBeDefined();
        expect(report.summary).toBeDefined();
        expect(report.systemStatus).toBeDefined();
        expect(Array.isArray(report.recommendations)).toBe(true);
        expect(Array.isArray(report.detailedIssues)).toBe(true);
    });

    test('should handle alert callbacks', () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const callback = jest.fn();

        // Should not throw when adding callback
        expect(() => {
            conversionMonitor.addAlertCallback(callback);
        }).not.toThrow();

        // Should not throw when removing callback
        expect(() => {
            conversionMonitor.removeAlertCallback(callback);
        }).not.toThrow();
    });

    test('should validate conversion data', async () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const validData = {
            event: 'purchase',
            transaction_id: 'test-txn-123',
            value: 5000,
            currency: 'JPY',
            items: [{
                item_id: 'tour-123',
                item_name: 'Test Tour',
                price: 5000,
                quantity: 1
            }]
        };

        // Should not throw for valid data
        await expect(conversionMonitor.trackConversionAttempt(validData))
            .resolves.toBeDefined();
    });

    test('should reject invalid conversion data', async () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const invalidData = {
            event: 'purchase'
            // Missing required fields
        };

        const result = await conversionMonitor.trackConversionAttempt(invalidData);
        expect(result.success).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle missing conversion ID in validation', async () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        await expect(conversionMonitor.validateConversionFiring())
            .rejects.toThrow('Conversion ID is required for validation');
    });

    test('should handle non-existent conversion ID', async () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const result = await conversionMonitor.validateConversionFiring('non-existent-id');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Conversion attempt not found');
    });

    test('should compare actual vs tracked conversions', async () => {
        const conversionMonitor = require('../conversionMonitor.js').default;

        const result = await conversionMonitor.compareActualVsTracked();

        expect(result).toBeDefined();
        expect(typeof result.accuracy).toBe('number');
        expect(Array.isArray(result.matchedConversions)).toBe(true);
        expect(Array.isArray(result.missingConversions)).toBe(true);
        expect(Array.isArray(result.extraConversions)).toBe(true);
        expect(result.analysis).toBeDefined();
    });
});