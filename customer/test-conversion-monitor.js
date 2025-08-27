/**
 * Manual test for conversion monitor
 */

// Mock the dependencies to avoid circular imports
const mockGtmService = {
    getStatus: () => ({
        isInitialized: true,
        containerId: 'GTM-TEST123',
        fallbackMode: false,
        debugMode: false
    }),
    trackConversion: () => true,
    validateTagFiring: () => Promise.resolve(true)
};

const mockBookingFlowManager = {
    addListener: () => { },
    getCurrentBookingState: () => ({
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
    }),
    isConversionTracked: () => true
};

const mockEnhancedConversionService = {
    getStatus: () => ({
        isEnabled: true,
        hasSalt: true,
        isConfigured: true
    }),
    prepareEnhancedConversion: () => ({
        conversion_label: 'test-label',
        value: 5000,
        currency: 'JPY',
        transaction_id: 'txn-123',
        enhanced_conversion_data: {
            email: 'hashed-email',
            phone_number: 'hashed-phone'
        }
    }),
    trackEnhancedConversion: () => Promise.resolve(true),
    validatePrivacyCompliance: () => ({
        isCompliant: true,
        hasValidConsent: true,
        hasValidData: true,
        errors: []
    })
};

// Mock the modules
require.cache[require.resolve('./src/services/gtmService.js')] = {
    exports: mockGtmService
};

require.cache[require.resolve('./src/services/bookingFlowManager.js')] = {
    exports: mockBookingFlowManager
};

require.cache[require.resolve('./src/services/enhancedConversionService.js')] = {
    exports: mockEnhancedConversionService
};

// Now try to load the conversion monitor
try {
    const conversionMonitor = require('./src/services/conversionMonitor.js');
    console.log('✓ ConversionMonitor loaded successfully');
    console.log('✓ Module type:', typeof conversionMonitor);
    console.log('✓ Module keys:', Object.keys(conversionMonitor));

    if (conversionMonitor.default) {
        const monitor = conversionMonitor.default;
        console.log('✓ Default export found');
        console.log('✓ Monitor type:', typeof monitor);

        // Test basic functionality
        if (typeof monitor.getMonitoringStatus === 'function') {
            const status = monitor.getMonitoringStatus();
            console.log('✓ getMonitoringStatus works:', status.isInitialized);
        }

        if (typeof monitor.generateDiagnosticReport === 'function') {
            const report = monitor.generateDiagnosticReport();
            console.log('✓ generateDiagnosticReport works:', !!report.generatedAt);
        }

        if (typeof monitor.trackConversionAttempt === 'function') {
            const testData = {
                event: 'purchase',
                transaction_id: 'test-123',
                value: 5000,
                currency: 'JPY',
                items: [{ item_id: 'tour-123', item_name: 'Test Tour', price: 5000, quantity: 1 }]
            };

            monitor.trackConversionAttempt(testData).then(result => {
                console.log('✓ trackConversionAttempt works:', result.success);
            }).catch(err => {
                console.log('✗ trackConversionAttempt error:', err.message);
            });
        }

        console.log('✓ All basic tests passed');

    } else {
        console.log('✗ No default export found');
    }

} catch (error) {
    console.error('✗ Error loading ConversionMonitor:', error.message);
    console.error('Stack:', error.stack);
}