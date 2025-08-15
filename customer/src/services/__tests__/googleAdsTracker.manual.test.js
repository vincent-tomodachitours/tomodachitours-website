// Manual verification test for Google Ads Tracker
// This test verifies the basic functionality without complex environment mocking

describe('Google Ads Tracker - Manual Verification', () => {
    let googleAdsTracker;
    let mockGtag;

    beforeAll(() => {
        // Mock gtag function
        mockGtag = jest.fn();
        global.gtag = mockGtag;
        global.window = global.window || {};
        global.window.dataLayer = [];

        // Mock console functions
        global.console.log = jest.fn();
        global.console.warn = jest.fn();

        // Import the module
        googleAdsTracker = require('../googleAdsTracker.js');
    });

    beforeEach(() => {
        mockGtag.mockClear();
        console.log.mockClear();
        console.warn.mockClear();
    });

    test('should export all required functions', () => {
        expect(typeof googleAdsTracker.initializeGoogleAdsTracking).toBe('function');
        expect(typeof googleAdsTracker.trackGoogleAdsConversion).toBe('function');
        expect(typeof googleAdsTracker.trackGoogleAdsPurchase).toBe('function');
        expect(typeof googleAdsTracker.trackGoogleAdsBeginCheckout).toBe('function');
        expect(typeof googleAdsTracker.trackGoogleAdsViewItem).toBe('function');
        expect(typeof googleAdsTracker.trackGoogleAdsAddToCart).toBe('function');
        expect(typeof googleAdsTracker.enableConversionLinker).toBe('function');
        expect(typeof googleAdsTracker.trackOfflineConversion).toBe('function');
        expect(typeof googleAdsTracker.getGoogleAdsConfig).toBe('function');
    });

    test('should return configuration object', () => {
        const config = googleAdsTracker.getGoogleAdsConfig();

        expect(config).toHaveProperty('conversionId');
        expect(config).toHaveProperty('conversionLabels');
        expect(config).toHaveProperty('isEnabled');
        expect(typeof config.isEnabled).toBe('boolean');
    });

    test('should handle function calls without throwing errors', () => {
        // These should not throw errors even if tracking is disabled
        expect(() => {
            googleAdsTracker.initializeGoogleAdsTracking();
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.trackGoogleAdsPurchase({
                value: 5000,
                transactionId: 'test-123'
            });
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.trackGoogleAdsBeginCheckout({
                price: 6000,
                tourId: 'test-tour'
            });
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.trackGoogleAdsViewItem({
                price: 7000,
                tourId: 'test-tour'
            });
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.enableConversionLinker();
        }).not.toThrow();
    });

    test('should warn for unknown conversion actions', () => {
        googleAdsTracker.trackGoogleAdsConversion('unknown_action', {});

        // Should warn about unknown conversion action
        expect(console.warn).toHaveBeenCalled();
    });

    test('should not track offline conversion without gclid', () => {
        googleAdsTracker.trackOfflineConversion('', { value: 5000 });
        googleAdsTracker.trackOfflineConversion(null, { value: 5000 });
        googleAdsTracker.trackOfflineConversion(undefined, { value: 5000 });

        // Should not call gtag for empty gclid
        expect(mockGtag).not.toHaveBeenCalled();
    });

    test('should handle missing data gracefully', () => {
        expect(() => {
            googleAdsTracker.trackGoogleAdsPurchase({});
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.trackGoogleAdsBeginCheckout({});
        }).not.toThrow();

        expect(() => {
            googleAdsTracker.trackGoogleAdsViewItem({});
        }).not.toThrow();
    });
});

// Integration test with analytics.js
describe('Analytics Integration - Manual Verification', () => {
    let analytics;
    let mockGtag;

    beforeAll(() => {
        // Mock gtag function
        mockGtag = jest.fn();
        global.gtag = mockGtag;
        global.window = global.window || {};
        global.window.dataLayer = [];

        // Mock console functions
        global.console.log = jest.fn();
        global.console.warn = jest.fn();

        // Import analytics module
        analytics = require('../analytics.js');
    });

    beforeEach(() => {
        mockGtag.mockClear();
        console.log.mockClear();
        console.warn.mockClear();
    });

    test('should export all analytics functions', () => {
        expect(typeof analytics.trackPurchase).toBe('function');
        expect(typeof analytics.trackBeginCheckout).toBe('function');
        expect(typeof analytics.trackTourView).toBe('function');
        expect(typeof analytics.initializeAnalytics).toBe('function');
    });

    test('should handle function calls without throwing errors', () => {
        expect(() => {
            analytics.trackPurchase({
                transactionId: 'test-123',
                value: 8000,
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                quantity: 2,
                price: 4000
            });
        }).not.toThrow();

        expect(() => {
            analytics.trackBeginCheckout({
                price: 6000,
                tourId: 'morning-tour',
                tourName: 'Morning Arashiyama Tour'
            });
        }).not.toThrow();

        expect(() => {
            analytics.trackTourView({
                price: 7000,
                tourId: 'night-tour',
                tourName: 'Night Fushimi Inari Tour'
            });
        }).not.toThrow();

        expect(() => {
            analytics.initializeAnalytics();
        }).not.toThrow();
    });

    test('should handle missing data gracefully', () => {
        expect(() => {
            analytics.trackPurchase({});
        }).not.toThrow();

        expect(() => {
            analytics.trackBeginCheckout({});
        }).not.toThrow();

        expect(() => {
            analytics.trackTourView({});
        }).not.toThrow();
    });

    test('should handle null/undefined data gracefully', () => {
        expect(() => {
            analytics.trackPurchase(null);
        }).not.toThrow();

        expect(() => {
            analytics.trackBeginCheckout(undefined);
        }).not.toThrow();

        expect(() => {
            analytics.trackTourView(null);
        }).not.toThrow();
    });
});