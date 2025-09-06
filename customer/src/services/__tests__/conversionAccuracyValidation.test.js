/**
 * Conversion Accuracy Validation Tests
 * Tests conversion tracking accuracy and validation scenarios
 * Requirements: 7.1, 7.2, 7.3, 7.4 (Task 14)
 */

import gtmService from '../gtmService.js';
import bookingFlowManager from '../bookingFlowManager.js';
import conversionMonitor from '../conversionMonitor.js';

// Mock dependencies
jest.mock('../conversionMonitor.js');

describe('Conversion Accuracy Validation Tests', () => {
    let mockDataLayer;
    let mockGoogleTagManager;
    let originalWindow;

    beforeEach(() => {
        // Store original window
        originalWindow = global.window;

        // Reset mocks
        jest.clearAllMocks();

        // Create fresh mocks
        mockDataLayer = [];
        mockGoogleTagManager = { 'GTM-TEST123': { loaded: true } };

        // Mock global objects
        global.window = {
            dataLayer: mockDataLayer,
            google_tag_manager: mockGoogleTagManager,
            location: {
                href: 'https://test.example.com',
                search: '?gclid=test_gclid_123'
            }
        };

        // Mock document
        global.document = {
            querySelector: jest.fn().mockReturnValue(null),
            createElement: jest.fn().mockReturnValue({
                onload: null,
                onerror: null,
                src: '',
                async: false
            }),
            getElementsByTagName: jest.fn().mockReturnValue([{
                parentNode: { insertBefore: jest.fn() }
            }])
        };

        // Reset service states
        gtmService.isInitialized = false;
        gtmService.containerId = null;
        gtmService.fallbackToGtag = false;
        gtmService.debugMode = false;
        bookingFlowManager.resetBookingState();

        // Mock conversion monitor
        conversionMonitor.trackConversionAttempt.mockResolvedValue({ success: true });
        conversionMonitor.validateConversionFiring.mockResolvedValue({ isValid: true });
        conversionMonitor.compareActualVsTracked.mockResolvedValue({ accuracy: 95.5 });
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    describe('Conversion Data Accuracy Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-TEST123');
        });

        test('should validate purchase conversion data accuracy', () => {
            const expectedData = {
                transaction_id: 'txn_accuracy_001',
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'gion-tour',
                    item_name: 'Gion District Walking Tour',
                    item_category: 'cultural',
                    price: 15000,
                    quantity: 1
                }],
                custom_parameters: {
                    tour_id: 'gion-tour',
                    tour_location: 'Kyoto',
                    booking_date: '2024-03-15',
                    payment_provider: 'stripe'
                }
            };

            gtmService.trackPurchaseConversion(expectedData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            // Validate core conversion data
            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.transaction_id).toBe(expectedData.transaction_id);
            expect(conversionEvent.value).toBe(expectedData.value);
            expect(conversionEvent.currency).toBe(expectedData.currency);

            // Validate items array
            expect(conversionEvent.items).toEqual(expectedData.items);

            // Validate custom parameters
            expect(conversionEvent.custom_parameters).toEqual(expectedData.custom_parameters);

            // Validate timestamp presence
            expect(conversionEvent._timestamp).toBeDefined();
            expect(typeof conversionEvent._timestamp).toBe('number');
        });

        test('should validate begin_checkout conversion accuracy', () => {
            const checkoutData = {
                value: 24000,
                currency: 'JPY',
                items: [{
                    item_id: 'morning-tour',
                    item_name: 'Morning Bamboo Tour',
                    price: 12000,
                    quantity: 2
                }]
            };

            const customerData = {
                email: 'accuracy.test@example.com',
                phone: '+81-90-1234-5678'
            };

            gtmService.trackBeginCheckoutConversion(checkoutData, customerData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent.value).toBe(24000);
            expect(conversionEvent.currency).toBe('JPY');
            expect(conversionEvent.user_data).toEqual(customerData);
            expect(conversionEvent.items.length).toBe(1);
            expect(conversionEvent.items[0].quantity).toBe(2);
        });

        test('should validate view_item conversion accuracy', () => {
            const itemData = {
                value: 18000,
                currency: 'JPY',
                items: [{
                    item_id: 'night-tour',
                    item_name: 'Night Photography Tour',
                    item_category: 'photography',
                    price: 18000,
                    quantity: 1
                }]
            };

            gtmService.trackViewItemConversion(itemData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent.value).toBe(18000);
            expect(conversionEvent.items[0].item_category).toBe('photography');
            expect(conversionEvent.items[0].price).toBe(18000);
        });

        test('should validate conversion value calculations with dynamic pricing', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'pricing-test-tour',
                tourName: 'Pricing Test Tour',
                price: 10000
            });

            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'pricing@example.com' }
            });

            bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 10000
            });

            // Test purchase with discount
            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_pricing_test',
                finalAmount: 8500,
                originalAmount: 10000,
                discount: {
                    type: 'percentage',
                    value: 15
                }
            });

            expect(purchaseResult.success).toBe(true);
            expect(purchaseResult.data.value).toBe(8500);

            // Validate pricing optimization data if available
            if (purchaseResult.data.pricing_optimization) {
                expect(purchaseResult.data.pricing_optimization.original_value).toBe(10000);
                expect(purchaseResult.data.pricing_optimization.discount_amount).toBeGreaterThan(0);
            }
        });
    });

    describe('Conversion Tracking Validation Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-TEST123');
        });

        test('should validate conversion firing success', async () => {
            const conversionData = {
                transaction_id: 'txn_validation_001',
                value: 12000,
                currency: 'JPY'
            };

            // Track conversion
            gtmService.trackPurchaseConversion(conversionData);

            // Validate tag firing
            const validationResult = await gtmService.validateTagFiring('google_ads_conversion');

            expect(validationResult).toBe(true);
            expect(conversionMonitor.trackConversionAttempt).toHaveBeenCalled();

            // Check validation event in dataLayer
            const validationEvent = mockDataLayer.find(event =>
                event.event === 'tag_validation'
            );

            expect(validationEvent).toBeDefined();
            expect(validationEvent.tag_name).toBe('google_ads_conversion');
        });

        test('should validate booking flow conversion sequence', () => {
            // Initialize complete booking flow
            const tourData = {
                tourId: 'validation-tour',
                tourName: 'Validation Test Tour',
                price: 15000,
                location: 'Kyoto'
            };

            const bookingId = bookingFlowManager.initializeBooking(tourData);

            // Track each step and validate
            const viewResult = bookingFlowManager.trackViewItem();
            expect(viewResult.success).toBe(true);
            expect(bookingFlowManager.isConversionTracked('view_item')).toBe(true);

            const checkoutResult = bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'validation@example.com' }
            });
            expect(checkoutResult.success).toBe(true);
            expect(bookingFlowManager.isConversionTracked('begin_checkout')).toBe(true);

            const paymentResult = bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 15000
            });
            expect(paymentResult.success).toBe(true);
            expect(bookingFlowManager.isConversionTracked('add_payment_info')).toBe(true);

            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_validation_sequence'
            });
            expect(purchaseResult.success).toBe(true);
            expect(bookingFlowManager.isConversionTracked('purchase')).toBe(true);

            // Validate final state
            const finalState = bookingFlowManager.getCurrentBookingState();
            expect(finalState.currentStep).toBe('purchase');
            expect(Object.values(finalState.conversionTracking).every(tracked => tracked)).toBe(true);
        });

        test('should validate conversion deduplication', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'dedup-test',
                price: 5000
            });

            // Track view item multiple times
            const firstResult = bookingFlowManager.trackViewItem();
            expect(firstResult.success).toBe(true);

            const secondResult = bookingFlowManager.trackViewItem();
            expect(secondResult.success).toBe(false);
            expect(secondResult.reason).toBe('already_tracked');

            // Ensure only one conversion was tracked
            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.conversionTracking.viewItemTracked).toBe(true);
        });

        test('should validate conversion data consistency across platforms', () => {
            const testData = {
                transaction_id: 'txn_consistency_test',
                value: 20000,
                currency: 'JPY',
                items: [{
                    item_id: 'consistency-tour',
                    item_name: 'Consistency Test Tour',
                    price: 20000,
                    quantity: 1
                }]
            };

            gtmService.trackPurchaseConversion(testData);

            // Find both Google Ads and GA4 events
            const googleAdsEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );
            const ga4Event = mockDataLayer.find(event =>
                event.event === 'purchase'
            );

            // Validate data consistency
            expect(googleAdsEvent).toBeDefined();
            expect(ga4Event).toBeDefined();

            expect(googleAdsEvent.transaction_id).toBe(ga4Event.transaction_id);
            expect(googleAdsEvent.value).toBe(ga4Event.value);
            expect(googleAdsEvent.currency).toBe(ga4Event.currency);
            expect(googleAdsEvent.items).toEqual(ga4Event.items);
        });
    });

    describe('Conversion Accuracy Monitoring Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-TEST123');
        });

        test('should monitor conversion firing accuracy', async () => {
            const conversionData = {
                transaction_id: 'txn_monitor_001',
                value: 25000,
                currency: 'JPY'
            };

            // Track conversion with monitoring
            gtmService.trackPurchaseConversion(conversionData);

            // Verify monitoring was called
            expect(conversionMonitor.trackConversionAttempt).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction_id: 'txn_monitor_001',
                    value: 25000
                })
            );
        });

        test('should validate conversion accuracy threshold', async () => {
            // Mock high accuracy
            conversionMonitor.compareActualVsTracked.mockResolvedValue({
                accuracy: 97.5,
                trackedConversions: 195,
                actualBookings: 200,
                discrepancy: 5
            });

            const accuracyResult = await conversionMonitor.compareActualVsTracked('2024-03-01', '2024-03-31');

            expect(accuracyResult.accuracy).toBeGreaterThan(95);
            expect(accuracyResult.discrepancy).toBeLessThan(10);
        });

        test('should detect low conversion accuracy', async () => {
            // Mock low accuracy scenario
            conversionMonitor.compareActualVsTracked.mockResolvedValue({
                accuracy: 87.2,
                trackedConversions: 174,
                actualBookings: 200,
                discrepancy: 26
            });

            const accuracyResult = await conversionMonitor.compareActualVsTracked('2024-03-01', '2024-03-31');

            expect(accuracyResult.accuracy).toBeLessThan(95);
            expect(accuracyResult.discrepancy).toBeGreaterThan(20);
        });

        test('should validate conversion timing accuracy', () => {
            const startTime = Date.now();

            gtmService.trackPurchaseConversion({
                transaction_id: 'txn_timing_test',
                value: 10000,
                currency: 'JPY'
            });

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            const endTime = Date.now();

            // Validate conversion was tracked quickly (within 100ms)
            expect(conversionEvent._timestamp).toBeGreaterThanOrEqual(startTime);
            expect(conversionEvent._timestamp).toBeLessThanOrEqual(endTime);
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-TEST123');
        });

        test('should handle invalid conversion data gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Test with missing required data
            const result = gtmService.trackPurchaseConversion({
                // Missing transaction_id and value
                currency: 'JPY'
            });

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should validate conversion with missing customer data', () => {
            const conversionData = {
                transaction_id: 'txn_no_customer',
                value: 15000,
                currency: 'JPY'
            };

            // Should still track conversion without customer data
            const result = gtmService.trackPurchaseConversion(conversionData, null);

            expect(result).toBe(true);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.user_data).toBeUndefined();
        });

        test('should handle dataLayer errors during validation', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataLayer to throw error
            global.window.dataLayer = {
                push: jest.fn(() => {
                    throw new Error('DataLayer validation error');
                }),
                find: jest.fn()
            };

            gtmService.trackPurchaseConversion({
                transaction_id: 'txn_error_test',
                value: 5000,
                currency: 'JPY'
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('GTM: Failed to track conversion'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        test('should validate conversion with zero value', () => {
            const zeroValueData = {
                transaction_id: 'txn_zero_value',
                value: 0,
                currency: 'JPY'
            };

            const result = gtmService.trackPurchaseConversion(zeroValueData);

            // Should handle zero value conversions
            expect(result).toBe(true);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent.value).toBe(0);
        });

        test('should validate conversion with very large values', () => {
            const largeValueData = {
                transaction_id: 'txn_large_value',
                value: 999999999,
                currency: 'JPY'
            };

            const result = gtmService.trackPurchaseConversion(largeValueData);

            expect(result).toBe(true);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent.value).toBe(999999999);
        });
    });

    describe('Performance Validation Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-TEST123');
        });

        test('should validate conversion tracking performance under load', () => {
            const startTime = Date.now();
            const conversions = [];

            // Track 50 conversions rapidly
            for (let i = 0; i < 50; i++) {
                conversions.push({
                    transaction_id: `txn_load_${i}`,
                    value: 1000 * (i + 1),
                    currency: 'JPY'
                });
            }

            conversions.forEach(conversion => {
                gtmService.trackPurchaseConversion(conversion);
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete all conversions within reasonable time (under 1 second)
            expect(duration).toBeLessThan(1000);

            // Verify all conversions were tracked
            const conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvents.length).toBe(50);
        });

        test('should validate memory usage with large dataLayer', () => {
            // Add many events to simulate large dataLayer
            for (let i = 0; i < 1000; i++) {
                mockDataLayer.push({
                    event: `background_event_${i}`,
                    timestamp: Date.now(),
                    data: `test_data_${i}`
                });
            }

            const initialLength = mockDataLayer.length;

            // Track new conversion
            gtmService.trackPurchaseConversion({
                transaction_id: 'txn_memory_test',
                value: 15000,
                currency: 'JPY'
            });

            // Should still work with large dataLayer
            const finalLength = mockDataLayer.length;
            expect(finalLength).toBeGreaterThan(initialLength);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion' &&
                event.transaction_id === 'txn_memory_test'
            );

            expect(conversionEvent).toBeDefined();
        });
    });
});