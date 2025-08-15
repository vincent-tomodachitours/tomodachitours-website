// Simple functional tests for Google Ads Tracker
// These tests focus on the core functionality without complex environment mocking

// Mock gtag function
const mockGtag = jest.fn();
global.gtag = mockGtag;
global.window = global.window || {};
global.window.dataLayer = [];

// Mock console functions
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
global.console.log = mockConsoleLog;
global.console.warn = mockConsoleWarn;

describe('Google Ads Tracker - Functional Tests', () => {
    let googleAdsTracker;

    beforeAll(() => {
        // Set up environment for testing
        process.env.NODE_ENV = 'production';
        process.env.REACT_APP_ENABLE_ANALYTICS = 'true';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = 'AW-123456789';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = JSON.stringify({
            purchase: 'abc123/def456',
            begin_checkout: 'ghi789/jkl012',
            view_item: 'mno345/pqr678',
            add_to_cart: 'stu901/vwx234'
        });

        // Import the module
        googleAdsTracker = require('../googleAdsTracker.js');
    });

    beforeEach(() => {
        mockGtag.mockClear();
        mockConsoleLog.mockClear();
        mockConsoleWarn.mockClear();
    });

    describe('Core Functionality', () => {
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

        test('should initialize Google Ads tracking', () => {
            googleAdsTracker.initializeGoogleAdsTracking();

            expect(mockGtag).toHaveBeenCalledWith('config', 'AW-123456789');
        });

        test('should track purchase conversion', () => {
            const transactionData = {
                value: 8000,
                transactionId: 'txn-456',
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                quantity: 2
            };

            googleAdsTracker.trackGoogleAdsPurchase(transactionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                value: 8000,
                currency: 'JPY',
                transaction_id: 'txn-456',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Tour',
                quantity: 2
            });
        });

        test('should track begin checkout conversion', () => {
            const tourData = {
                price: 6000,
                tourId: 'night-tour',
                tourName: 'Night Tour'
            };

            googleAdsTracker.trackGoogleAdsBeginCheckout(tourData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/ghi789/jkl012',
                value: 6000,
                currency: 'JPY',
                tour_id: 'night-tour',
                tour_name: 'Night Tour'
            });
        });

        test('should track view item conversion', () => {
            const tourData = {
                price: 7000,
                tourId: 'uji-tour',
                tourName: 'Uji Tour'
            };

            googleAdsTracker.trackGoogleAdsViewItem(tourData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/mno345/pqr678',
                value: 7000,
                currency: 'JPY',
                tour_id: 'uji-tour',
                tour_name: 'Uji Tour',
                tour_category: 'Tour'
            });
        });

        test('should track add to cart conversion', () => {
            const tourData = {
                price: 5500,
                tourId: 'gion-tour',
                tourName: 'Gion District Tour'
            };

            googleAdsTracker.trackGoogleAdsAddToCart(tourData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/stu901/vwx234',
                value: 5500,
                currency: 'JPY',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Tour',
                quantity: 1
            });
        });

        test('should enable conversion linker', () => {
            googleAdsTracker.enableConversionLinker();

            expect(mockGtag).toHaveBeenCalledWith('config', 'AW-123456789', {
                conversion_linker: true
            });
        });

        test('should track offline conversion with gclid', () => {
            const gclid = 'test-gclid-123';
            const conversionData = {
                value: 9000,
                currency: 'JPY',
                transaction_id: 'offline-txn-456'
            };

            googleAdsTracker.trackOfflineConversion(gclid, conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                gclid: 'test-gclid-123',
                value: 9000,
                currency: 'JPY',
                transaction_id: 'offline-txn-456'
            });
        });

        test('should return configuration', () => {
            const config = googleAdsTracker.getGoogleAdsConfig();

            expect(config).toHaveProperty('conversionId');
            expect(config).toHaveProperty('conversionLabels');
            expect(config).toHaveProperty('isEnabled');
            expect(config.isEnabled).toBe(true);
        });

        test('should warn when conversion label is not found', () => {
            googleAdsTracker.trackGoogleAdsConversion('unknown_action', {});

            expect(mockConsoleWarn).toHaveBeenCalledWith('No Google Ads conversion label found for action: unknown_action');
            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should not track offline conversion when gclid is missing', () => {
            googleAdsTracker.trackOfflineConversion('', { value: 5000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });

        test('should handle missing quantity in purchase data', () => {
            const transactionData = {
                value: 5000,
                transactionId: 'txn-789',
                tourId: 'morning-tour',
                tourName: 'Morning Tour'
                // quantity is missing
            };

            googleAdsTracker.trackGoogleAdsPurchase(transactionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion',
                expect.objectContaining({
                    quantity: 1 // Should default to 1
                })
            );
        });
    });

    describe('Integration with existing analytics', () => {
        test('should work with gtag function', () => {
            // Test that gtag is properly called
            googleAdsTracker.trackGoogleAdsConversion('purchase', {
                value: 1000,
                transaction_id: 'test-123'
            });

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.any(Object));
        });

        test('should use JPY currency consistently', () => {
            const tourData = { price: 5000, tourId: 'test', tourName: 'Test Tour' };

            googleAdsTracker.trackGoogleAdsBeginCheckout(tourData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion',
                expect.objectContaining({
                    currency: 'JPY'
                })
            );
        });
    });
});