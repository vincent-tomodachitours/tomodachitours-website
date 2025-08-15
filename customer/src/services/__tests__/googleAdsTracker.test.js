// Mock environment variables before importing
const originalEnv = process.env;

// Mock gtag function
const mockGtag = jest.fn();
global.gtag = mockGtag;
global.window = global.window || {};
global.window.dataLayer = [];

// Mock privacy manager
jest.mock('../privacyManager.js', () => ({
    canTrackMarketing: jest.fn(() => true)
}));

describe('Google Ads Tracker', () => {
    let googleAdsTracker;

    beforeEach(() => {
        jest.resetModules();
        process.env = {
            ...originalEnv,
            NODE_ENV: 'production',
            REACT_APP_ENABLE_ANALYTICS: 'true',
            REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-123456789',
            REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: JSON.stringify({
                purchase: 'abc123/def456',
                begin_checkout: 'ghi789/jkl012',
                view_item: 'mno345/pqr678',
                add_to_cart: 'stu901/vwx234'
            }),
            REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS: JSON.stringify({
                gion_purchase: 'gion123/purchase456',
                gion_checkout: 'gion123/checkout456',
                gion_view: 'gion123/view456',
                gion_cart: 'gion123/cart456',
                morning_purchase: 'morning123/purchase456',
                morning_checkout: 'morning123/checkout456',
                morning_view: 'morning123/view456',
                morning_cart: 'morning123/cart456',
                night_purchase: 'night123/purchase456',
                night_checkout: 'night123/checkout456',
                night_view: 'night123/view456',
                night_cart: 'night123/cart456',
                uji_purchase: 'uji123/purchase456',
                uji_checkout: 'uji123/checkout456',
                uji_view: 'uji123/view456',
                uji_cart: 'uji123/cart456',
                tour_performance: 'performance123/metric456',
                segment_purchase: 'segment123/purchase456'
            })
        };
        mockGtag.mockClear();
        console.log = jest.fn();
        console.warn = jest.fn();

        // Import the module after setting up environment
        googleAdsTracker = require('../googleAdsTracker.js');
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('initializeGoogleAdsTracking', () => {
        it('should initialize Google Ads tracking when properly configured', () => {
            googleAdsTracker.initializeGoogleAdsTracking();

            expect(mockGtag).toHaveBeenCalledWith('config', 'AW-123456789');
            expect(console.log).toHaveBeenCalledWith('Google Ads conversion tracking initialized');
        });

        it('should not initialize when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.initializeGoogleAdsTracking();

            expect(mockGtag).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Google Ads tracking disabled or not configured');
        });

        it('should not initialize when conversion ID is missing', () => {
            delete process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.initializeGoogleAdsTracking();

            expect(mockGtag).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Google Ads tracking disabled or not configured');
        });
    });

    describe('trackGoogleAdsConversion', () => {
        it('should track conversion with correct parameters', () => {
            const conversionData = {
                value: 5000,
                currency: 'JPY',
                transaction_id: 'test-123'
            };

            googleAdsTracker.trackGoogleAdsConversion('purchase', conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                value: 5000,
                currency: 'JPY',
                transaction_id: 'test-123'
            });
        });

        it('should warn when conversion label is not found', () => {
            googleAdsTracker.trackGoogleAdsConversion('unknown_action', {});

            expect(console.warn).toHaveBeenCalledWith('No Google Ads conversion label found for action: unknown_action');
            expect(mockGtag).not.toHaveBeenCalled();
        });

        it('should not track when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.trackGoogleAdsConversion('purchase', {});

            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('trackGoogleAdsPurchase', () => {
        it('should track purchase conversion with transaction data', () => {
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

        it('should handle missing quantity in transaction data', () => {
            const transactionData = {
                value: 5000,
                transactionId: 'txn-789',
                tourId: 'morning-tour',
                tourName: 'Morning Tour'
            };

            googleAdsTracker.trackGoogleAdsPurchase(transactionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                value: 5000,
                currency: 'JPY',
                transaction_id: 'txn-789',
                tour_id: 'morning-tour',
                tour_name: 'Morning Tour',
                quantity: 1
            });
        });
    });

    describe('trackGoogleAdsBeginCheckout', () => {
        it('should track begin checkout conversion', () => {
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
    });

    describe('trackGoogleAdsViewItem', () => {
        it('should track view item conversion for remarketing', () => {
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
    });

    describe('trackGoogleAdsAddToCart', () => {
        it('should track add to cart conversion', () => {
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
    });

    describe('trackCustomGoogleAdsConversion', () => {
        it('should track custom conversion with provided data', () => {
            const customData = {
                value: 1000,
                custom_parameter: 'test_value'
            };

            googleAdsTracker.trackCustomGoogleAdsConversion('purchase', customData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                value: 1000,
                custom_parameter: 'test_value'
            });
        });

        it('should track tour-specific conversion when tour-specific label exists', () => {
            const customData = {
                value: 8000,
                tour_id: 'gion-tour',
                customer_segment: 'high_engagement'
            };

            googleAdsTracker.trackCustomGoogleAdsConversion('gion_purchase', customData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/gion123/purchase456',
                value: 8000,
                tour_id: 'gion-tour',
                customer_segment: 'high_engagement'
            });
            expect(console.log).toHaveBeenCalledWith('Tour-specific Google Ads conversion tracked: gion_purchase', expect.any(Object));
        });

        it('should fall back to regular conversion when tour-specific label does not exist', () => {
            const customData = {
                value: 5000,
                custom_parameter: 'test_value'
            };

            googleAdsTracker.trackCustomGoogleAdsConversion('unknown_tour_action', customData);

            expect(console.warn).toHaveBeenCalledWith('No Google Ads conversion label found for action: unknown_tour_action');
            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('trackTourSpecificGoogleAdsConversion', () => {
        it('should track Gion tour specific conversion', () => {
            const conversionData = {
                value: 8000,
                currency: 'JPY',
                customer_segment: 'cultural_enthusiast'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('gion-tour', 'purchase', conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/gion123/purchase456',
                value: 8000,
                currency: 'JPY',
                customer_segment: 'cultural_enthusiast'
            });
            expect(console.log).toHaveBeenCalledWith('Tour-specific Google Ads conversion tracked: gion_purchase', expect.any(Object));
        });

        it('should track Morning tour specific conversion', () => {
            const conversionData = {
                value: 10000,
                currency: 'JPY',
                customer_segment: 'nature_lover'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('morning-tour', 'checkout', conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/morning123/checkout456',
                value: 10000,
                currency: 'JPY',
                customer_segment: 'nature_lover'
            });
            expect(console.log).toHaveBeenCalledWith('Tour-specific Google Ads conversion tracked: morning_checkout', expect.any(Object));
        });

        it('should track Night tour specific conversion', () => {
            const conversionData = {
                value: 6000,
                currency: 'JPY',
                customer_segment: 'cultural_enthusiast'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('night-tour', 'view', conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/night123/view456',
                value: 6000,
                currency: 'JPY',
                customer_segment: 'cultural_enthusiast'
            });
            expect(console.log).toHaveBeenCalledWith('Tour-specific Google Ads conversion tracked: night_view', expect.any(Object));
        });

        it('should track Uji tour specific conversion', () => {
            const conversionData = {
                value: 12000,
                currency: 'JPY',
                customer_segment: 'premium_seeker'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('uji-tour', 'cart', conversionData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/uji123/cart456',
                value: 12000,
                currency: 'JPY',
                customer_segment: 'premium_seeker'
            });
            expect(console.log).toHaveBeenCalledWith('Tour-specific Google Ads conversion tracked: uji_cart', expect.any(Object));
        });

        it('should warn and fall back for unknown tour ID', () => {
            const conversionData = {
                value: 5000,
                currency: 'JPY'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('unknown-tour', 'purchase', conversionData);

            expect(console.warn).toHaveBeenCalledWith('Unknown tour ID for conversion tracking: unknown-tour');
            expect(mockGtag).not.toHaveBeenCalled();
        });

        it('should warn and fall back when tour-specific label is missing', () => {
            // Remove a specific label to test fallback
            process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS = JSON.stringify({
                gion_purchase: 'gion123/purchase456'
                // Missing morning_purchase label
            });
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            const conversionData = {
                value: 10000,
                currency: 'JPY'
            };

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('morning-tour', 'purchase', conversionData);

            expect(console.warn).toHaveBeenCalledWith('No tour-specific conversion label found for: morning_purchase');
            expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
                send_to: 'AW-123456789/abc123/def456',
                value: 10000,
                currency: 'JPY'
            });
        });

        it('should not track when tour ID is missing', () => {
            googleAdsTracker.trackTourSpecificGoogleAdsConversion('', 'purchase', { value: 5000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });

        it('should not track when conversion action is missing', () => {
            googleAdsTracker.trackTourSpecificGoogleAdsConversion('gion-tour', '', { value: 5000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });

        it('should not track when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.trackTourSpecificGoogleAdsConversion('gion-tour', 'purchase', { value: 8000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('enableConversionLinker', () => {
        it('should enable conversion linker for cross-domain tracking', () => {
            googleAdsTracker.enableConversionLinker();

            expect(mockGtag).toHaveBeenCalledWith('config', 'AW-123456789', {
                conversion_linker: true
            });
        });

        it('should not enable when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.enableConversionLinker();

            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('trackOfflineConversion', () => {
        it('should track offline conversion with gclid', () => {
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

        it('should not track when gclid is missing', () => {
            googleAdsTracker.trackOfflineConversion('', { value: 5000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });

        it('should not track when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.trackOfflineConversion('test-gclid', { value: 5000 });

            expect(mockGtag).not.toHaveBeenCalled();
        });
    });

    describe('getGoogleAdsConfig', () => {
        it('should return current configuration', () => {
            const config = googleAdsTracker.getGoogleAdsConfig();

            expect(config).toEqual({
                conversionId: 'AW-123456789',
                conversionLabels: {
                    purchase: 'abc123/def456',
                    begin_checkout: 'ghi789/jkl012',
                    view_item: 'mno345/pqr678',
                    add_to_cart: 'stu901/vwx234'
                },
                isEnabled: true
            });
        });

        it('should return disabled config when tracking is off', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            const config = googleAdsTracker.getGoogleAdsConfig();

            expect(config.isEnabled).toBe(false);
        });

        it('should handle missing conversion labels gracefully', () => {
            delete process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            const config = googleAdsTracker.getGoogleAdsConfig();

            expect(config.conversionLabels).toEqual({});
        });
    });

    describe('Environment edge cases', () => {
        it('should handle malformed conversion labels JSON', () => {
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = 'invalid-json';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            // This should not throw an error
            expect(() => {
                googleAdsTracker.trackGoogleAdsConversion('purchase', {});
            }).not.toThrow();
        });

        it('should work in development when analytics is explicitly enabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'true';
            // Re-import after changing env
            googleAdsTracker = require('../googleAdsTracker.js');

            googleAdsTracker.trackGoogleAdsPurchase({
                value: 5000,
                transactionId: 'dev-test'
            });

            expect(mockGtag).toHaveBeenCalled();
        });
    });
});