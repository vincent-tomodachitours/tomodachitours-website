/**
 * Simple Conversion Monitor Test
 * 
 * Basic test to verify the service can be loaded and has the expected structure
 */

// Mock the dependencies first
jest.mock('../gtmService.js', () => ({
    getStatus: jest.fn(() => ({
        isInitialized: true,
        containerId: 'GTM-TEST123',
        fallbackMode: false,
        debugMode: false
    })),
    trackConversion: jest.fn(() => true),
    validateTagFiring: jest.fn(() => Promise.resolve(true))
}));

jest.mock('../bookingFlowManager.js', () => ({
    addListener: jest.fn(),
    getCurrentBookingState: jest.fn(() => ({
        bookingId: 'test-booking-123',
        currentStep: 'purchase',
        conversionTracking: {
            viewItemTracked: true,
            beginCheckoutTracked: true,
            addPaymentInfoTracked: true,
            purchaseTracked: true
        },
        createdAt: new Date().toISOString(),
        transactionId: 'txn-123',
        paymentData: { amount: 5000 },
        tourData: { tourId: 'tour-123' }
    })),
    isConversionTracked: jest.fn(() => true)
}));

jest.mock('../enhancedConversionService.js', () => ({
    getStatus: jest.fn(() => ({
        isEnabled: true,
        hasSalt: true,
        isConfigured: true
    })),
    prepareEnhancedConversion: jest.fn(() => ({
        conversion_label: 'test-label',
        value: 5000,
        currency: 'JPY',
        transaction_id: 'txn-123',
        enhanced_conversion_data: {
            email: 'hashed-email',
            phone_number: 'hashed-phone'
        }
    })),
    trackEnhancedConversion: jest.fn(() => Promise.resolve(true)),
    validatePrivacyCompliance: jest.fn(() => ({
        isCompliant: true,
        hasValidConsent: true,
        hasValidData: true,
        errors: []
    }))
}));

describe('ConversionMonitor Simple Tests', () => {
    let conversionMonitor;

    beforeAll(() => {
        // Import after mocking
        conversionMonitor = require('../conversionMonitor.js').default;
    });

    test('should be defined', () => {
        expect(conversionMonitor).toBeDefined();
    });

    test('should have public methods', () => {
        expect(typeof conversionMonitor.trackConversionAttempt).toBe('function');
        expect(typeof conversionMonitor.validateConversionFiring).toBe('function');
        expect(typeof conversionMonitor.compareActualVsTracked).toBe('function');
        expect(typeof conversionMonitor.generateDiagnosticReport).toBe('function');
        expect(typeof conversionMonitor.getMonitoringStatus).toBe('function');
        expect(typeof conversionMonitor.addAlertCallback).toBe('function');
        expect(typeof conversionMonitor.removeAlertCallback).toBe('function');
    });

    test('should return monitoring status', () => {
        const status = conversionMonitor.getMonitoringStatus();

        expect(status).toBeDefined();
        expect(typeof status.isInitialized).toBe('boolean');
        expect(typeof status.monitoringEnabled).toBe('boolean');
        expect(status.accuracyMetrics).toBeDefined();
        expect(status.systemStatus).toBeDefined();
    });

    test('should generate diagnostic report', () => {
        const report = conversionMonitor.generateDiagnosticReport();

        expect(report).toBeDefined();
        expect(report.generatedAt).toBeDefined();
        expect(report.summary).toBeDefined();
        expect(report.systemStatus).toBeDefined();
        expect(Array.isArray(report.recommendations)).toBe(true);
        expect(Array.isArray(report.detailedIssues)).toBe(true);
    });

    test('should handle alert callbacks', () => {
        const callback = jest.fn();

        expect(() => {
            conversionMonitor.addAlertCallback(callback);
        }).not.toThrow();

        expect(() => {
            conversionMonitor.removeAlertCallback(callback);
        }).not.toThrow();
    });

    test('should track conversion attempts', async () => {
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

        const result = await conversionMonitor.trackConversionAttempt(validData);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');

        if (result.success) {
            expect(result.attemptId).toBeDefined();
        } else {
            expect(Array.isArray(result.errors)).toBe(true);
        }
    });

    test('should validate conversion firing', async () => {
        // First track a conversion
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

        const trackResult = await conversionMonitor.trackConversionAttempt(validData);

        if (trackResult.success) {
            const validationResult = await conversionMonitor.validateConversionFiring(trackResult.attemptId);
            expect(validationResult).toBeDefined();
            expect(typeof validationResult.isValid).toBe('boolean');
        }
    });

    test('should compare actual vs tracked conversions', async () => {
        const result = await conversionMonitor.compareActualVsTracked();

        expect(result).toBeDefined();
        expect(typeof result.accuracy).toBe('number');
        expect(Array.isArray(result.matchedConversions)).toBe(true);
        expect(Array.isArray(result.missingConversions)).toBe(true);
        expect(Array.isArray(result.extraConversions)).toBe(true);
        expect(result.analysis).toBeDefined();
    });
});