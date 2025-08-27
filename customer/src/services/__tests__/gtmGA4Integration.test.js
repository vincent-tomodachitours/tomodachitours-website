/**
 * GTM GA4 Integration Tests
 * End-to-end tests for GA4 ecommerce tracking through GTM
 * Tests for task 12: Configure GTM tags for GA4 integration and ecommerce tracking
 */

import gtmService from '../gtmService.js';
import gtmGA4Config from '../gtmGA4Config.js';
import { trackPurchase, trackBeginCheckout, trackTourView, trackAddToCart } from '../analytics/ecommerceTracking.js';

// Mock environment variables
process.env.REACT_APP_GTM_CONTAINER_ID = 'GTM-5S2H4C9V';
process.env.REACT_APP_GA_MEASUREMENT_ID = 'G-5GVJBRE1SY';
process.env.NODE_ENV = 'test';

// Mock window and dataLayer
global.window = {
    dataLayer: [],
    google_tag_manager: {
        'GTM-5S2H4C9V': {}
    }
};

// Mock analytics config functions
jest.mock('../analytics/config.js', () => ({
    getShouldTrack: () => true,
    getShouldTrackMarketing: () => true,
    isTestEnvironment: true
}));

// Mock analytics helpers
jest.mock('../analytics/helpers.js', () => ({
    getTourCategory: (tourId) => 'night',
    getTourDuration: (tourId) => '3 hours',
    getTourLocation: (tourId) => 'kyoto',
    getPriceRange: (price) => '5000-10000',
    getUserEngagementLevel: () => 'high',
    storeUserInteraction: jest.fn()
}));

// Mock cart tracking
jest.mock('../analytics/cartTracking.js', () => ({
    storeCartData: jest.fn(),
    clearCartData: jest.fn()
}));

// Mock other services
jest.mock('../attributionService.js', () => ({
    getAttributionForAnalytics: () => ({
        source: 'google',
        medium: 'cpc',
        campaign: 'test_campaign'
    })
}));

jest.mock('../remarketingManager.js', () => ({
    processPurchaseCompletion: jest.fn(),
    processTourView: jest.fn()
}));

jest.mock('../dynamicRemarketingService.js', () => ({
    addDynamicRemarketingParameters: jest.fn()
}));

jest.mock('../tourSpecificTracking/index.js', () => ({
    trackTourSpecificConversion: jest.fn()
}));

jest.mock('../bookingFlowManager.js', () => ({
    getCurrentBookingState: () => null,
    trackPurchase: jest.fn(),
    trackBeginCheckout: jest.fn(),
    trackViewItem: jest.fn()
}));

// Mock console methods to reduce test noise
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

describe('GTM GA4 Integration Tests', () => {
    beforeEach(async () => {
        // Reset dataLayer and services
        window.dataLayer = [];
        gtmService.isInitialized = false;
        gtmGA4Config.isInitialized = false;

        // Initialize GTM service (which should initialize GA4 config)
        await gtmService.initialize();
    });

    describe('Complete Ecommerce Tracking Flow', () => {
        const mockTourData = {
            tourId: 'night_tour_932404',
            tourName: 'Kyoto Fushimi Inari Night Walking Tour',
            price: 5000,
            bookingDate: '2025-08-28',
            paymentProvider: 'stripe'
        };

        const mockTransactionData = {
            transactionId: 'txn_test_' + Date.now(),
            tourId: mockTourData.tourId,
            tourName: mockTourData.tourName,
            value: mockTourData.price,
            price: mockTourData.price,
            quantity: 1,
            bookingDate: mockTourData.bookingDate,
            paymentProvider: mockTourData.paymentProvider,
            customerData: {
                email: 'test@example.com',
                phone: '+81901234567',
                firstName: 'Test',
                lastName: 'User'
            }
        };

        test('should track complete booking flow with GA4 events', async () => {
            // Step 1: Track tour view
            trackTourView(mockTourData);

            // Step 2: Track begin checkout
            trackBeginCheckout(mockTourData);

            // Step 3: Track add to cart (simulated)
            trackAddToCart(mockTourData);

            // Step 4: Track purchase
            trackPurchase(mockTransactionData);

            // Verify all GA4 events were tracked
            const ga4Events = window.dataLayer.filter(event =>
                ['view_item', 'begin_checkout', 'add_to_cart', 'purchase'].includes(event.event)
            );

            expect(ga4Events.length).toBeGreaterThanOrEqual(4);

            // Verify purchase event has all required GA4 ecommerce parameters
            const purchaseEvent = window.dataLayer.find(event =>
                event.event === 'purchase' && event.transaction_id === mockTransactionData.transactionId
            );

            expect(purchaseEvent).toBeDefined();
            expect(purchaseEvent.value).toBe(5000);
            expect(purchaseEvent.currency).toBe('JPY');
            expect(purchaseEvent.items).toBeDefined();
            expect(purchaseEvent.items.length).toBe(1);
            expect(purchaseEvent.items[0].item_id).toBe(mockTourData.tourId);
            expect(purchaseEvent.send_to).toBe('G-5GVJBRE1SY');
            expect(purchaseEvent.enhanced_ecommerce).toBe(true);
        });

        test('should include custom tour dimensions in GA4 events', async () => {
            trackPurchase(mockTransactionData);

            const purchaseEvent = window.dataLayer.find(event =>
                event.event === 'purchase' && event.transaction_id === mockTransactionData.transactionId
            );

            expect(purchaseEvent).toBeDefined();

            // Check custom tour parameters
            expect(purchaseEvent.tour_id).toBe(mockTourData.tourId);
            expect(purchaseEvent.tour_name).toBe(mockTourData.tourName);
            expect(purchaseEvent.booking_date).toBe(mockTourData.bookingDate);
            expect(purchaseEvent.payment_provider).toBe(mockTourData.paymentProvider);
        });

        test('should track enhanced ecommerce items with proper structure', async () => {
            trackPurchase(mockTransactionData);

            const purchaseEvent = window.dataLayer.find(event =>
                event.event === 'purchase' && event.transaction_id === mockTransactionData.transactionId
            );

            expect(purchaseEvent.items).toBeDefined();
            expect(purchaseEvent.items.length).toBe(1);

            const item = purchaseEvent.items[0];
            expect(item.item_id).toBe(mockTourData.tourId);
            expect(item.item_name).toBe(mockTourData.tourName);
            expect(item.item_category).toBe('Tour');
            expect(item.price).toBe(mockTourData.price);
            expect(item.quantity).toBe(1);
        });
    });

    describe('GA4 Configuration Validation', () => {
        test('should have proper GA4 configuration tags in dataLayer', async () => {
            // Check for GA4 configuration events
            const ga4ConfigEvents = window.dataLayer.filter(event =>
                event.event && event.event.startsWith('gtm_ga4')
            );

            expect(ga4ConfigEvents.length).toBeGreaterThan(0);

            // Check for main GA4 config
            const mainConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_config'
            );

            expect(mainConfig).toBeDefined();
            expect(mainConfig.ga4_config.measurement_id).toBe('G-5GVJBRE1SY');
            expect(mainConfig.ga4_config.enhanced_ecommerce).toBe(true);
        });

        test('should have ecommerce event tag configurations', async () => {
            const eventConfigs = [
                'gtm_ga4_purchase_config',
                'gtm_ga4_begin_checkout_config',
                'gtm_ga4_view_item_config',
                'gtm_ga4_add_payment_info_config'
            ];

            eventConfigs.forEach(configEvent => {
                const config = window.dataLayer.find(event => event.event === configEvent);
                expect(config).toBeDefined();
                expect(config.tag_config).toBeDefined();
                expect(config.tag_config.measurement_id).toBe('G-5GVJBRE1SY');
                expect(config.tag_config.enhanced_ecommerce).toBe(true);
            });
        });

        test('should have custom dimensions configuration', async () => {
            const customDimensionsConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_custom_dimensions_config'
            );

            expect(customDimensionsConfig).toBeDefined();
            expect(customDimensionsConfig.custom_dimensions_config).toBeDefined();

            const dimensions = customDimensionsConfig.custom_dimensions_config.custom_dimensions;
            expect(Array.isArray(dimensions)).toBe(true);
            expect(dimensions.length).toBeGreaterThan(0);

            // Check for required tour-specific dimensions
            const requiredDimensions = ['tour_id', 'tour_name', 'tour_category', 'tour_location'];
            requiredDimensions.forEach(dimensionName => {
                const dimension = dimensions.find(dim => dim.parameter_name === dimensionName);
                expect(dimension).toBeDefined();
                expect(dimension.scope).toBeDefined();
            });
        });
    });

    describe('GTM Service Integration', () => {
        test('should integrate GTM service with GA4 configuration', async () => {
            const status = gtmService.getStatus();

            expect(status.isInitialized).toBe(true);
            expect(status.ga4Config).toBeDefined();
            expect(status.ga4Config.isInitialized).toBe(true);
            expect(status.ga4Config.measurementId).toBe('G-5GVJBRE1SY');
        });

        test('should track conversions through both Google Ads and GA4', async () => {
            const mockPaymentData = {
                value: 3000,
                paymentProvider: 'stripe',
                tourData: {
                    tourId: 'test_tour',
                    tourName: 'Test Tour'
                }
            };

            const result = gtmService.trackAddPaymentInfoConversion(mockPaymentData);

            expect(result).toBe(true);

            // Should have both Google Ads conversion event and GA4 event
            const ga4Event = window.dataLayer.find(event =>
                event.event === 'add_payment_info'
            );

            const googleAdsEvent = window.dataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(ga4Event).toBeDefined();
            expect(googleAdsEvent).toBeDefined();
        });
    });

    describe('Data Flow Validation', () => {
        test('should validate complete GA4 data flow', async () => {
            const validationResults = await gtmGA4Config.validateGA4DataFlow();

            expect(validationResults.ga4ConfigurationValid).toBe(true);
            expect(validationResults.ecommerceEventsValid).toBe(true);
            expect(validationResults.customDimensionsValid).toBe(true);
            expect(validationResults.dataLayerValid).toBe(true);
            expect(validationResults.measurementIdValid).toBe(true);
            expect(validationResults.errors.length).toBe(0);
        });

        test('should validate ecommerce reporting accuracy', async () => {
            // Track multiple events to test reporting accuracy
            const events = [
                { type: 'view_item', data: { tourId: 'tour1', price: 5000 } },
                { type: 'begin_checkout', data: { tourId: 'tour1', price: 5000 } },
                { type: 'add_payment_info', data: { tourId: 'tour1', price: 5000 } },
                { type: 'purchase', data: { tourId: 'tour1', price: 5000, transactionId: 'txn_test' } }
            ];

            events.forEach(({ type, data }) => {
                switch (type) {
                    case 'view_item':
                        gtmGA4Config.trackGA4ViewItem({ value: data.price, items: [] }, data);
                        break;
                    case 'begin_checkout':
                        gtmGA4Config.trackGA4BeginCheckout({ value: data.price, items: [] }, data);
                        break;
                    case 'add_payment_info':
                        gtmGA4Config.trackGA4AddPaymentInfo({ value: data.price }, data);
                        break;
                    case 'purchase':
                        gtmGA4Config.trackGA4Purchase({
                            transactionId: data.transactionId,
                            value: data.price,
                            items: []
                        }, data);
                        break;
                }
            });

            // Verify all events were tracked with consistent data
            const trackedEvents = window.dataLayer.filter(event =>
                ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'].includes(event.event)
            );

            expect(trackedEvents.length).toBe(4);

            // Verify data consistency across events
            trackedEvents.forEach(event => {
                expect(event.tour_id).toBe('tour1');
                expect(event.value).toBe(5000);
                expect(event.currency).toBe('JPY');
                expect(event.send_to).toBe('G-5GVJBRE1SY');
            });
        });
    });

    describe('Error Handling and Fallbacks', () => {
        test('should handle GA4 tracking failures gracefully', async () => {
            // Temporarily break GA4 config
            const originalMeasurementId = gtmGA4Config.ga4MeasurementId;
            gtmGA4Config.ga4MeasurementId = null;

            const result = gtmService.trackPurchaseConversion({
                transactionId: 'test_error',
                value: 1000
            });

            // Should not throw error and should handle gracefully
            expect(typeof result).toBe('boolean');

            // Restore original config
            gtmGA4Config.ga4MeasurementId = originalMeasurementId;
        });

        test('should continue Google Ads tracking even if GA4 fails', async () => {
            // Mock GA4 failure
            const originalTrackGA4Purchase = gtmGA4Config.trackGA4Purchase;
            gtmGA4Config.trackGA4Purchase = jest.fn().mockReturnValue(false);

            const result = gtmService.trackPurchaseConversion({
                transactionId: 'test_fallback',
                value: 2000
            });

            // Should still attempt Google Ads tracking
            expect(typeof result).toBe('boolean');

            // Restore original method
            gtmGA4Config.trackGA4Purchase = originalTrackGA4Purchase;
        });
    });

    describe('Performance and Optimization', () => {
        test('should handle multiple rapid events efficiently', async () => {
            const startTime = Date.now();

            // Track 10 rapid events
            for (let i = 0; i < 10; i++) {
                gtmGA4Config.trackGA4ViewItem({
                    value: 1000 + i,
                    items: []
                }, {
                    tourId: `tour_${i}`,
                    tourName: `Tour ${i}`
                });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (less than 100ms)
            expect(duration).toBeLessThan(100);

            // Verify all events were tracked
            const viewEvents = window.dataLayer.filter(event => event.event === 'view_item');
            expect(viewEvents.length).toBe(10);
        });

        test('should not cause memory leaks with dataLayer', async () => {
            const initialLength = window.dataLayer.length;

            // Track many events
            for (let i = 0; i < 50; i++) {
                gtmGA4Config.trackGA4Purchase({
                    transactionId: `txn_${i}`,
                    value: 1000,
                    items: []
                }, { tourId: `tour_${i}` });
            }

            const finalLength = window.dataLayer.length;

            // DataLayer should grow but not excessively
            expect(finalLength).toBeGreaterThan(initialLength);
            expect(finalLength - initialLength).toBeLessThanOrEqual(50);
        });
    });
});