import { trackPurchase, trackBeginCheckout, trackTourView, initializeAnalytics } from '../analytics.js';

// Mock the Google Ads tracker functions
jest.mock('../googleAdsTracker.js', () => ({
    trackGoogleAdsPurchase: jest.fn(),
    trackGoogleAdsBeginCheckout: jest.fn(),
    trackGoogleAdsViewItem: jest.fn(),
    initializeGoogleAdsTracking: jest.fn()
}));

import {
    trackGoogleAdsPurchase,
    trackGoogleAdsBeginCheckout,
    trackGoogleAdsViewItem,
    initializeGoogleAdsTracking
} from '../googleAdsTracker.js';

// Mock gtag function
const mockGtag = jest.fn();
global.gtag = mockGtag;
global.window = global.window || {};
global.window.dataLayer = [];

// Mock environment variables
const originalEnv = process.env;

describe('Analytics Integration with Google Ads', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env = {
            ...originalEnv,
            NODE_ENV: 'production',
            REACT_APP_ENABLE_ANALYTICS: 'true',
            REACT_APP_GA_MEASUREMENT_ID: 'G-TEST123456'
        };
        mockGtag.mockClear();
        trackGoogleAdsPurchase.mockClear();
        trackGoogleAdsBeginCheckout.mockClear();
        trackGoogleAdsViewItem.mockClear();
        initializeGoogleAdsTracking.mockClear();
        console.log = jest.fn();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('trackPurchase integration', () => {
        it('should track both GA4 and Google Ads purchase events', () => {
            const transactionData = {
                transactionId: 'txn-123',
                value: 8000,
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                quantity: 2,
                price: 4000
            };

            trackPurchase(transactionData);

            // Verify GA4 tracking
            expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
                transaction_id: 'txn-123',
                value: 8000,
                currency: 'JPY',
                items: [{
                    item_id: 'gion-tour',
                    item_name: 'Gion District Tour',
                    category: 'Tour',
                    quantity: 2,
                    price: 4000
                }]
            });

            // Verify Google Ads tracking
            expect(trackGoogleAdsPurchase).toHaveBeenCalledWith(transactionData);
        });

        it('should not track when analytics is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';

            const transactionData = {
                transactionId: 'txn-456',
                value: 5000
            };

            trackPurchase(transactionData);

            expect(mockGtag).not.toHaveBeenCalled();
            expect(trackGoogleAdsPurchase).not.toHaveBeenCalled();
        });
    });

    describe('trackBeginCheckout integration', () => {
        it('should track both GA4 and Google Ads begin checkout events', () => {
            const tourData = {
                price: 6000,
                tourId: 'morning-tour',
                tourName: 'Morning Arashiyama Tour'
            };

            trackBeginCheckout(tourData);

            // Verify GA4 tracking
            expect(mockGtag).toHaveBeenCalledWith('event', 'begin_checkout', {
                currency: 'JPY',
                value: 6000,
                items: [{
                    item_id: 'morning-tour',
                    item_name: 'Morning Arashiyama Tour',
                    category: 'Tour',
                    quantity: 1,
                    price: 6000
                }]
            });

            // Verify Google Ads tracking
            expect(trackGoogleAdsBeginCheckout).toHaveBeenCalledWith(tourData);
        });
    });

    describe('trackTourView integration', () => {
        it('should track both GA4 and Google Ads view item events', () => {
            const tourData = {
                price: 7000,
                tourId: 'night-tour',
                tourName: 'Night Fushimi Inari Tour'
            };

            trackTourView(tourData);

            // Verify GA4 tracking
            expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', {
                currency: 'JPY',
                value: 7000,
                items: [{
                    item_id: 'night-tour',
                    item_name: 'Night Fushimi Inari Tour',
                    category: 'Tour',
                    price: 7000
                }]
            });

            // Verify Google Ads tracking
            expect(trackGoogleAdsViewItem).toHaveBeenCalledWith(tourData);
        });
    });

    describe('initializeAnalytics integration', () => {
        let mockDocumentAddEventListener;

        beforeEach(() => {
            // Mock DOM elements and event listeners
            global.window.addEventListener = jest.fn();
            mockDocumentAddEventListener = jest.fn();
            global.document = {
                addEventListener: mockDocumentAddEventListener,
                hidden: false
            };
            global.Date.now = jest.fn(() => 1234567890);
        });

        it('should initialize both GA4 and Google Ads tracking', () => {
            initializeAnalytics();

            // Verify Google Ads initialization is called
            expect(initializeGoogleAdsTracking).toHaveBeenCalled();

            // Verify console log includes both services
            expect(console.log).toHaveBeenCalledWith('Google Analytics 4 and Google Ads tracking initialized');
        });

        it('should set up event listeners for automatic tracking', () => {
            initializeAnalytics();

            // Verify scroll and beforeunload event listeners are set up
            expect(global.window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(global.window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
            expect(mockDocumentAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        });

        it('should not initialize when tracking is disabled', () => {
            process.env.NODE_ENV = 'development';
            process.env.REACT_APP_ENABLE_ANALYTICS = 'false';

            initializeAnalytics();

            expect(initializeGoogleAdsTracking).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Analytics tracking disabled in development');
        });
    });

    describe('Data consistency', () => {
        it('should pass consistent data between GA4 and Google Ads tracking', () => {
            const transactionData = {
                transactionId: 'consistency-test-123',
                value: 12000,
                tourId: 'uji-tour',
                tourName: 'Uji Matcha Experience',
                quantity: 3,
                price: 4000
            };

            trackPurchase(transactionData);

            // Verify the same data is passed to both tracking systems
            const ga4Call = mockGtag.mock.calls.find(call => call[0] === 'event' && call[1] === 'purchase');
            const googleAdsCall = trackGoogleAdsPurchase.mock.calls[0];

            expect(ga4Call[2].transaction_id).toBe(transactionData.transactionId);
            expect(ga4Call[2].value).toBe(transactionData.value);
            expect(googleAdsCall[0]).toBe(transactionData);
        });

        it('should handle missing optional fields consistently', () => {
            const minimalTourData = {
                price: 5000,
                tourId: 'minimal-tour',
                tourName: 'Minimal Tour Data'
                // quantity is missing
            };

            trackBeginCheckout(minimalTourData);

            // Both systems should handle missing quantity gracefully
            const ga4Call = mockGtag.mock.calls.find(call => call[0] === 'event' && call[1] === 'begin_checkout');
            expect(ga4Call[2].items[0].quantity).toBe(1); // Default quantity

            expect(trackGoogleAdsBeginCheckout).toHaveBeenCalledWith(minimalTourData);
        });
    });

    describe('Error handling', () => {
        it('should continue GA4 tracking even if Google Ads tracking fails', () => {
            trackGoogleAdsPurchase.mockImplementation(() => {
                throw new Error('Google Ads tracking failed');
            });

            const transactionData = {
                transactionId: 'error-test-123',
                value: 5000
            };

            // This should not throw an error
            expect(() => trackPurchase(transactionData)).not.toThrow();

            // GA4 tracking should still work
            expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', expect.any(Object));
        });

        it('should handle undefined tour data gracefully', () => {
            expect(() => trackTourView(undefined)).not.toThrow();
            expect(() => trackBeginCheckout(null)).not.toThrow();
        });
    });
});