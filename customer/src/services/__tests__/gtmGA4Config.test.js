/**
 * GTM GA4 Configuration Service Tests
 * Tests for task 12: Configure GTM tags for GA4 integration and ecommerce tracking
 */

import gtmGA4Config from '../gtmGA4Config.js';

// Mock environment variables
process.env.REACT_APP_GA_MEASUREMENT_ID = 'G-5GVJBRE1SY';
process.env.NODE_ENV = 'test';

// Mock window.dataLayer
global.window = {
    dataLayer: []
};

describe('GTM GA4 Configuration Service', () => {
    beforeEach(() => {
        // Reset dataLayer before each test
        window.dataLayer = [];
        gtmGA4Config.isInitialized = false;
        gtmGA4Config.debugMode = false;
    });

    describe('Initialization', () => {
        test('should initialize GA4 configuration successfully', async () => {
            const result = await gtmGA4Config.initialize();

            expect(result).toBe(true);
            expect(gtmGA4Config.isInitialized).toBe(true);
            expect(window.dataLayer.length).toBeGreaterThan(0);
        });

        test('should handle multiple initialization calls', async () => {
            await gtmGA4Config.initialize();
            const result = await gtmGA4Config.initialize();

            expect(result).toBe(true);
            expect(gtmGA4Config.isInitialized).toBe(true);
        });

        test('should configure GA4 tags during initialization', async () => {
            await gtmGA4Config.initialize();

            // Check if configuration events were pushed to dataLayer
            const configEvents = window.dataLayer.filter(event =>
                event.event && event.event.startsWith('gtm_ga4')
            );

            expect(configEvents.length).toBeGreaterThan(0);
        });
    });

    describe('GA4 Configuration Tags', () => {
        beforeEach(async () => {
            await gtmGA4Config.initialize();
        });

        test('should create GA4 configuration tag with enhanced ecommerce', () => {
            const configEvent = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_config'
            );

            expect(configEvent).toBeDefined();
            expect(configEvent.ga4_config.measurement_id).toBe('G-5GVJBRE1SY');
            expect(configEvent.ga4_config.enhanced_ecommerce).toBe(true);
            expect(configEvent.ga4_config.custom_map).toBeDefined();
        });

        test('should create purchase event tag configuration', () => {
            const purchaseConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_purchase_config'
            );

            expect(purchaseConfig).toBeDefined();
            expect(purchaseConfig.tag_config.event_name).toBe('purchase');
            expect(purchaseConfig.tag_config.enhanced_ecommerce).toBe(true);
            expect(purchaseConfig.tag_config.parameters.transaction_id).toBeDefined();
        });

        test('should create begin checkout event tag configuration', () => {
            const checkoutConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_begin_checkout_config'
            );

            expect(checkoutConfig).toBeDefined();
            expect(checkoutConfig.tag_config.event_name).toBe('begin_checkout');
            expect(checkoutConfig.tag_config.parameters.checkout_step).toBe(1);
        });

        test('should create view item event tag configuration', () => {
            const viewItemConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_view_item_config'
            );

            expect(viewItemConfig).toBeDefined();
            expect(viewItemConfig.tag_config.event_name).toBe('view_item');
            expect(viewItemConfig.tag_config.parameters.item_category).toBe('tour');
        });

        test('should create add payment info event tag configuration', () => {
            const paymentConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_add_payment_info_config'
            );

            expect(paymentConfig).toBeDefined();
            expect(paymentConfig.tag_config.event_name).toBe('add_payment_info');
            expect(paymentConfig.tag_config.parameters.checkout_step).toBe(2);
        });
    });

    describe('Custom Dimensions Configuration', () => {
        beforeEach(async () => {
            await gtmGA4Config.initialize();
        });

        test('should configure custom dimensions for tour-specific data', () => {
            const customDimensionsConfig = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_custom_dimensions_config'
            );

            expect(customDimensionsConfig).toBeDefined();
            expect(customDimensionsConfig.custom_dimensions_config.custom_dimensions).toBeDefined();

            const dimensions = customDimensionsConfig.custom_dimensions_config.custom_dimensions;
            const tourIdDimension = dimensions.find(dim => dim.parameter_name === 'tour_id');

            expect(tourIdDimension).toBeDefined();
            expect(tourIdDimension.display_name).toBe('Tour ID');
            expect(tourIdDimension.scope).toBe('EVENT');
        });

        test('should include all required tour-specific custom dimensions', () => {
            const requiredDimensions = [
                'tour_id', 'tour_name', 'tour_category', 'tour_location',
                'tour_duration', 'booking_date', 'payment_provider'
            ];

            requiredDimensions.forEach(dimension => {
                expect(gtmGA4Config.customDimensions[dimension]).toBeDefined();
            });
        });
    });

    describe('GA4 Ecommerce Event Tracking', () => {
        beforeEach(async () => {
            await gtmGA4Config.initialize();
            window.dataLayer = []; // Clear initialization events
        });

        test('should track GA4 purchase event with tour data', () => {
            const transactionData = {
                transactionId: 'test_123',
                value: 5000,
                items: [{
                    item_id: 'night_tour',
                    item_name: 'Night Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            };

            const tourData = {
                tourId: 'night_tour',
                tourName: 'Night Tour',
                tourCategory: 'evening',
                tourLocation: 'kyoto'
            };

            const result = gtmGA4Config.trackGA4Purchase(transactionData, tourData);

            expect(result).toBe(true);

            const purchaseEvent = window.dataLayer.find(event => event.event === 'purchase');
            expect(purchaseEvent).toBeDefined();
            expect(purchaseEvent.transaction_id).toBe('test_123');
            expect(purchaseEvent.value).toBe(5000);
            expect(purchaseEvent.tour_id).toBe('night_tour');
            expect(purchaseEvent.tour_category).toBe('evening');
        });

        test('should track GA4 begin checkout event with tour data', () => {
            const checkoutData = {
                value: 5000,
                items: [{
                    item_id: 'morning_tour',
                    item_name: 'Morning Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            };

            const tourData = {
                tourId: 'morning_tour',
                tourName: 'Morning Tour',
                tourCategory: 'morning'
            };

            const result = gtmGA4Config.trackGA4BeginCheckout(checkoutData, tourData);

            expect(result).toBe(true);

            const checkoutEvent = window.dataLayer.find(event => event.event === 'begin_checkout');
            expect(checkoutEvent).toBeDefined();
            expect(checkoutEvent.value).toBe(5000);
            expect(checkoutEvent.checkout_step).toBe(1);
            expect(checkoutEvent.tour_id).toBe('morning_tour');
        });

        test('should track GA4 view item event with tour data', () => {
            const itemData = {
                value: 5000,
                items: [{
                    item_id: 'gion_tour',
                    item_name: 'Gion Tour',
                    item_category: 'Tour',
                    price: 5000
                }]
            };

            const tourData = {
                tourId: 'gion_tour',
                tourName: 'Gion Tour',
                tourLocation: 'gion'
            };

            const result = gtmGA4Config.trackGA4ViewItem(itemData, tourData);

            expect(result).toBe(true);

            const viewEvent = window.dataLayer.find(event => event.event === 'view_item');
            expect(viewEvent).toBeDefined();
            expect(viewEvent.value).toBe(5000);
            expect(viewEvent.item_category).toBe('tour');
            expect(viewEvent.tour_id).toBe('gion_tour');
        });

        test('should track GA4 add payment info event with tour data', () => {
            const paymentData = {
                value: 5000,
                paymentProvider: 'stripe'
            };

            const tourData = {
                tourId: 'uji_tour',
                tourName: 'Uji Tour'
            };

            const result = gtmGA4Config.trackGA4AddPaymentInfo(paymentData, tourData);

            expect(result).toBe(true);

            const paymentEvent = window.dataLayer.find(event => event.event === 'add_payment_info');
            expect(paymentEvent).toBeDefined();
            expect(paymentEvent.value).toBe(5000);
            expect(paymentEvent.payment_type).toBe('stripe');
            expect(paymentEvent.checkout_step).toBe(2);
            expect(paymentEvent.tour_id).toBe('uji_tour');
        });
    });

    describe('GA4 Data Flow Validation', () => {
        beforeEach(async () => {
            await gtmGA4Config.initialize();
        });

        test('should validate GA4 data flow successfully', async () => {
            const validationResults = await gtmGA4Config.validateGA4DataFlow();

            expect(validationResults.dataLayerValid).toBe(true);
            expect(validationResults.measurementIdValid).toBe(true);
            expect(validationResults.customDimensionsValid).toBe(true);
            expect(validationResults.errors.length).toBe(0);
        });

        test('should validate ecommerce events functionality', async () => {
            const validationResults = await gtmGA4Config.validateGA4DataFlow();

            expect(validationResults.ecommerceEventsValid).toBe(true);

            // Check that test events were created
            const testEvents = window.dataLayer.filter(event =>
                ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'].includes(event.event)
            );

            expect(testEvents.length).toBe(4);
        });

        test('should handle validation errors gracefully', async () => {
            // Temporarily break the measurement ID
            const originalId = gtmGA4Config.ga4MeasurementId;
            gtmGA4Config.ga4MeasurementId = 'invalid_id';

            const validationResults = await gtmGA4Config.validateGA4DataFlow();

            expect(validationResults.measurementIdValid).toBe(false);
            expect(validationResults.errors.length).toBeGreaterThan(0);

            // Restore original ID
            gtmGA4Config.ga4MeasurementId = originalId;
        });
    });

    describe('Debug Mode', () => {
        beforeEach(async () => {
            await gtmGA4Config.initialize();
        });

        test('should enable debug mode successfully', () => {
            gtmGA4Config.enableDebugMode(true);

            expect(gtmGA4Config.debugMode).toBe(true);

            const debugEvent = window.dataLayer.find(event =>
                event.event === 'gtm_ga4_debug_mode'
            );

            expect(debugEvent).toBeDefined();
            expect(debugEvent.debug_mode).toBe(true);
        });

        test('should provide detailed status information', () => {
            const status = gtmGA4Config.getStatus();

            expect(status.isInitialized).toBe(true);
            expect(status.measurementId).toBe('G-5GVJBRE1SY');
            expect(status.enhancedEcommerceEnabled).toBe(true);
            expect(status.customDimensions).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle missing dataLayer gracefully', () => {
            delete window.dataLayer;

            const result = gtmGA4Config.trackGA4Purchase({
                transactionId: 'test',
                value: 1000
            });

            // Should not throw error, but return false
            expect(result).toBe(false);
        });

        test('should handle invalid event data gracefully', () => {
            const result = gtmGA4Config.trackGA4Purchase(null);

            expect(result).toBe(false);
        });

        test('should handle initialization errors gracefully', async () => {
            // Mock console.error to avoid test output noise
            const originalError = console.error;
            console.error = jest.fn();

            // Force an error by breaking the environment
            const originalEnv = process.env.REACT_APP_GA_MEASUREMENT_ID;
            delete process.env.REACT_APP_GA_MEASUREMENT_ID;

            const newConfig = new (gtmGA4Config.constructor)();
            const result = await newConfig.initialize();

            // Should handle gracefully
            expect(typeof result).toBe('boolean');

            // Restore environment
            process.env.REACT_APP_GA_MEASUREMENT_ID = originalEnv;
            console.error = originalError;
        });
    });

    describe('Integration with GTM Service', () => {
        test('should provide configuration that integrates with GTM service', () => {
            const status = gtmGA4Config.getStatus();

            // Should provide all necessary configuration for GTM service integration
            expect(status.measurementId).toBeDefined();
            expect(status.customDimensions).toBeDefined();
            expect(status.enhancedEcommerceEnabled).toBe(true);
        });

        test('should track events in format compatible with GTM service', () => {
            const transactionData = {
                transactionId: 'test_integration',
                value: 3000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    price: 3000
                }]
            };

            gtmGA4Config.trackGA4Purchase(transactionData, { tourId: 'test_tour' });

            const purchaseEvent = window.dataLayer.find(event =>
                event.event === 'purchase' && event.transaction_id === 'test_integration'
            );

            expect(purchaseEvent).toBeDefined();
            expect(purchaseEvent.send_to).toBe('G-5GVJBRE1SY');
            expect(purchaseEvent.enhanced_ecommerce).toBe(true);
        });
    });
});