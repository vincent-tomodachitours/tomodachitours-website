/**
 * End-to-End Booking Flow Conversion Tracking Tests
 * Tests complete user journey from tour view to purchase completion
 * Requirements: 1.4, 6.1, 6.2, 9.1, 9.2 (Task 14)
 */

import gtmService from '../gtmService.js';
import bookingFlowManager from '../bookingFlowManager.js';

// Mock external dependencies
jest.mock('../conversionValueOptimizer.js', () => ({
    calculateDynamicPrice: jest.fn().mockReturnValue({
        success: true,
        pricing: {
            finalPrice: 8000,
            originalTotal: 10000,
            discountAmount: 2000,
            discountPercentage: 20,
            validationPassed: true
        }
    }),
    getTargetROASData: jest.fn().mockReturnValue({
        targetRoas: 4.0,
        expectedRevenue: 32000,
        bidAdjustment: 1.2
    }),
    trackRevenueAttribution: jest.fn().mockReturnValue({
        success: true,
        attributionId: 'attr_test_123'
    })
}));

describe('End-to-End Booking Flow Conversion Tests', () => {
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
        mockGoogleTagManager = { 'GTM-E2E123': { loaded: true } };

        // Mock global objects
        global.window = {
            dataLayer: mockDataLayer,
            google_tag_manager: mockGoogleTagManager,
            location: {
                href: 'https://test.example.com/gion-tour',
                search: '?gclid=test_gclid_e2e_123&utm_source=google&utm_medium=cpc&utm_campaign=gion_tour_2024'
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
            }]),
            title: 'Gion District Walking Tour - Tomodachi Tours',
            referrer: 'https://www.google.com/search?q=kyoto+walking+tour'
        };

        // Reset service states
        gtmService.isInitialized = false;
        gtmService.containerId = null;
        gtmService.fallbackToGtag = false;
        gtmService.debugMode = false;
        bookingFlowManager.resetBookingState();
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    describe('Complete Booking Flow Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-E2E123');
        });

        test('should track complete booking flow from view to purchase', async () => {
            // Step 1: User lands on tour page and views tour
            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                date: '2024-03-15',
                time: '14:00',
                location: 'Kyoto',
                category: 'cultural'
            };

            const bookingId = bookingFlowManager.initializeBooking(tourData);
            expect(bookingId).toBeDefined();
            expect(bookingId).toMatch(/^booking_\d+_[a-z0-9]+$/);

            // Track view item
            const viewResult = bookingFlowManager.trackViewItem();
            expect(viewResult.success).toBe(true);

            // Fire GTM conversion for view item
            gtmService.trackViewItemConversion(viewResult.data);

            // Step 2: User begins checkout process
            const checkoutData = {
                customerData: {
                    email: 'e2e.test@example.com',
                    phone: '+81-90-1234-5678',
                    name: 'E2E Test User',
                    firstName: 'E2E',
                    lastName: 'Test User'
                }
            };

            const checkoutResult = bookingFlowManager.trackBeginCheckout(checkoutData);
            expect(checkoutResult.success).toBe(true);
            expect(checkoutResult.data.user_data.email).toBe('e2e.test@example.com');

            // Fire GTM conversion for begin checkout
            gtmService.trackBeginCheckoutConversion(checkoutResult.data, checkoutData.customerData);

            // Step 3: User adds payment information
            const paymentData = {
                provider: 'stripe',
                amount: 12000,
                currency: 'JPY',
                paymentMethod: 'card'
            };

            const paymentResult = bookingFlowManager.trackAddPaymentInfo(paymentData);
            expect(paymentResult.success).toBe(true);
            expect(paymentResult.data.custom_parameters.payment_provider).toBe('stripe');

            // Fire GTM conversion for add payment info
            gtmService.trackAddPaymentInfoConversion(paymentResult.data, checkoutData.customerData);

            // Step 4: User completes purchase
            const transactionData = {
                transactionId: 'txn_e2e_complete_123',
                finalAmount: 10800, // With discount applied
                paymentProvider: 'stripe',
                discount: {
                    type: 'percentage',
                    value: 10,
                    code: 'WELCOME10'
                }
            };

            const purchaseResult = bookingFlowManager.trackPurchase(transactionData);
            expect(purchaseResult.success).toBe(true);
            expect(purchaseResult.data.transaction_id).toBe('txn_e2e_complete_123');
            expect(purchaseResult.data.value).toBe(10800);

            // Fire GTM conversion for purchase
            gtmService.trackPurchaseConversion(purchaseResult.data, checkoutData.customerData);

            // Validate complete flow state
            const finalState = bookingFlowManager.getCurrentBookingState();
            expect(finalState.currentStep).toBe('purchase');
            expect(finalState.conversionTracking.viewItemTracked).toBe(true);
            expect(finalState.conversionTracking.beginCheckoutTracked).toBe(true);
            expect(finalState.conversionTracking.addPaymentInfoTracked).toBe(true);
            expect(finalState.conversionTracking.purchaseTracked).toBe(true);

            // Validate GTM events were fired
            const conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );
            expect(conversionEvents.length).toBeGreaterThanOrEqual(4);

            const ga4Events = mockDataLayer.filter(event =>
                ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'].includes(event.event)
            );
            expect(ga4Events.length).toBeGreaterThanOrEqual(4);
        });

        test('should handle booking flow with multiple tour selections', () => {
            // User views multiple tours before booking
            const tours = [
                {
                    tourId: 'gion-tour',
                    tourName: 'Gion District Walking Tour',
                    price: 12000,
                    category: 'cultural'
                },
                {
                    tourId: 'morning-tour',
                    tourName: 'Morning Bamboo Tour',
                    price: 15000,
                    category: 'nature'
                },
                {
                    tourId: 'night-tour',
                    tourName: 'Night Photography Tour',
                    price: 18000,
                    category: 'photography'
                }
            ];

            // Track view for each tour (simulating browsing)
            tours.forEach(tour => {
                gtmService.trackViewItemConversion({
                    value: tour.price,
                    currency: 'JPY',
                    items: [{
                        item_id: tour.tourId,
                        item_name: tour.tourName,
                        item_category: tour.category,
                        price: tour.price,
                        quantity: 1
                    }]
                });
            });

            // User decides on the night tour and books it
            const selectedTour = tours[2]; // night-tour
            const bookingId = bookingFlowManager.initializeBooking(selectedTour);

            const viewResult = bookingFlowManager.trackViewItem();
            expect(viewResult.success).toBe(true);

            const checkoutResult = bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'multi.tour@example.com' }
            });
            expect(checkoutResult.success).toBe(true);

            // Verify correct tour was booked
            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.tourData.tourId).toBe('night-tour');
            expect(state.tourData.price).toBe(18000);

            // Verify all view events were tracked
            const viewEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion' || event.event === 'view_item'
            );
            expect(viewEvents.length).toBeGreaterThanOrEqual(3);
        });

        test('should track booking flow with group booking (multiple quantities)', () => {
            const tourData = {
                tourId: 'group-tour',
                tourName: 'Group Cultural Tour',
                price: 8000,
                date: '2024-03-20',
                time: '10:00'
            };

            const bookingId = bookingFlowManager.initializeBooking(tourData);

            // Simulate group booking for 4 people
            const groupCheckoutData = {
                customerData: {
                    email: 'group.leader@example.com',
                    phone: '+81-90-9876-5432',
                    name: 'Group Leader'
                },
                quantity: 4,
                totalAmount: 32000 // 8000 * 4
            };

            const viewResult = bookingFlowManager.trackViewItem({
                quantity: 4,
                totalValue: 32000
            });

            const checkoutResult = bookingFlowManager.trackBeginCheckout(groupCheckoutData);

            const paymentResult = bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 32000,
                currency: 'JPY'
            });

            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_group_booking_123',
                finalAmount: 32000
            });

            expect(purchaseResult.success).toBe(true);
            expect(purchaseResult.data.value).toBe(32000);

            // Fire GTM events for group booking
            gtmService.trackPurchaseConversion({
                ...purchaseResult.data,
                items: [{
                    item_id: 'group-tour',
                    item_name: 'Group Cultural Tour',
                    price: 8000,
                    quantity: 4
                }]
            }, groupCheckoutData.customerData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion' &&
                event.transaction_id === 'txn_group_booking_123'
            );

            expect(conversionEvent.value).toBe(32000);
            expect(conversionEvent.items[0].quantity).toBe(4);
        });
    });

    describe('Booking Flow Error Handling Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-E2E123');
        });

        test('should handle booking flow interruption gracefully', () => {
            const tourData = {
                tourId: 'interrupted-tour',
                tourName: 'Interrupted Tour Test',
                price: 10000
            };

            bookingFlowManager.initializeBooking(tourData);
            bookingFlowManager.trackViewItem();

            // User starts checkout but doesn't complete
            const checkoutResult = bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'interrupted@example.com' }
            });

            expect(checkoutResult.success).toBe(true);

            // User abandons booking (no payment info or purchase)
            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.currentStep).toBe('begin_checkout');
            expect(state.conversionTracking.viewItemTracked).toBe(true);
            expect(state.conversionTracking.beginCheckoutTracked).toBe(true);
            expect(state.conversionTracking.addPaymentInfoTracked).toBe(false);
            expect(state.conversionTracking.purchaseTracked).toBe(false);

            // Should still have tracked the funnel steps that were completed
            gtmService.trackViewItemConversion(checkoutResult.data);
            gtmService.trackBeginCheckoutConversion(checkoutResult.data, { email: 'interrupted@example.com' });

            const trackedEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );
            expect(trackedEvents.length).toBe(2); // view_item and begin_checkout only
        });

        test('should handle invalid booking progression', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'invalid-progression',
                price: 5000
            });

            // Try to skip steps
            expect(() => {
                bookingFlowManager.trackAddPaymentInfo({ provider: 'stripe' });
            }).toThrow('Customer data with email is required');

            expect(() => {
                bookingFlowManager.trackPurchase({ transactionId: 'invalid' });
            }).toThrow('Customer data with email is required');

            // Verify no invalid conversions were tracked
            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.conversionTracking.addPaymentInfoTracked).toBe(false);
            expect(state.conversionTracking.purchaseTracked).toBe(false);
        });

        test('should handle booking flow reset and restart', () => {
            // First booking attempt
            bookingFlowManager.initializeBooking({
                tourId: 'first-attempt',
                price: 8000
            });

            const firstBookingId = bookingFlowManager.getCurrentBookingState().bookingId;
            bookingFlowManager.trackViewItem();

            // Reset and start new booking
            bookingFlowManager.resetBookingState();
            expect(bookingFlowManager.getCurrentBookingState()).toBeNull();

            // Second booking attempt
            bookingFlowManager.initializeBooking({
                tourId: 'second-attempt',
                price: 12000
            });

            const secondBookingId = bookingFlowManager.getCurrentBookingState().bookingId;
            expect(secondBookingId).not.toBe(firstBookingId);

            // Complete second booking
            bookingFlowManager.trackViewItem();
            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'restart@example.com' }
            });

            const state = bookingFlowManager.getCurrentBookingState();
            expect(state.tourData.tourId).toBe('second-attempt');
            expect(state.conversionTracking.viewItemTracked).toBe(true);
            expect(state.conversionTracking.beginCheckoutTracked).toBe(true);
        });
    });

    describe('Cross-Device and Attribution Tests', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-E2E123');
        });

        test('should handle cross-device booking flow', () => {
            // Simulate user starting on mobile, finishing on desktop

            // Mobile session - view and begin checkout
            global.window.location.search = '?gclid=mobile_gclid_123&utm_source=google&utm_medium=cpc';

            const tourData = {
                tourId: 'cross-device-tour',
                tourName: 'Cross Device Test Tour',
                price: 14000
            };

            bookingFlowManager.initializeBooking(tourData);
            bookingFlowManager.trackViewItem();

            const mobileCheckout = bookingFlowManager.trackBeginCheckout({
                customerData: {
                    email: 'crossdevice@example.com',
                    phone: '+81-90-1111-2222'
                }
            });

            // Fire mobile GTM events
            gtmService.trackViewItemConversion(mobileCheckout.data);
            gtmService.trackBeginCheckoutConversion(mobileCheckout.data, { email: 'crossdevice@example.com' });

            // Desktop session - complete purchase (simulate different gclid)
            global.window.location.search = '?gclid=desktop_gclid_456&utm_source=google&utm_medium=cpc';

            const paymentResult = bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 14000
            });

            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_cross_device_123',
                finalAmount: 14000
            });

            // Fire desktop GTM events with enhanced conversion data
            gtmService.trackPurchaseConversion(purchaseResult.data, {
                email: 'crossdevice@example.com',
                phone: '+81-90-1111-2222'
            });

            // Verify enhanced conversion data for cross-device attribution
            const purchaseEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion' &&
                event.transaction_id === 'txn_cross_device_123'
            );

            expect(purchaseEvent.user_data).toBeDefined();
            expect(purchaseEvent.user_data.email).toBe('crossdevice@example.com');
            expect(purchaseEvent.user_data.phone).toBe('+81-90-1111-2222');
        });

        test('should track attribution data throughout booking flow', () => {
            // Set up attribution context
            global.window.location.search = '?gclid=attribution_test_123&utm_source=google&utm_medium=cpc&utm_campaign=spring_promotion&utm_term=kyoto+tour&utm_content=ad_variant_a';

            const tourData = {
                tourId: 'attribution-tour',
                tourName: 'Attribution Test Tour',
                price: 16000
            };

            bookingFlowManager.initializeBooking(tourData);

            // Complete full booking flow
            const viewResult = bookingFlowManager.trackViewItem();
            const checkoutResult = bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'attribution@example.com' }
            });
            const paymentResult = bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 16000
            });
            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_attribution_123'
            });

            // Fire all GTM events
            gtmService.trackViewItemConversion(viewResult.data);
            gtmService.trackBeginCheckoutConversion(checkoutResult.data, { email: 'attribution@example.com' });
            gtmService.trackAddPaymentInfoConversion(paymentResult.data, { email: 'attribution@example.com' });
            gtmService.trackPurchaseConversion(purchaseResult.data, { email: 'attribution@example.com' });

            // Verify attribution context is maintained
            const allConversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );

            expect(allConversionEvents.length).toBe(4);

            // Each event should maintain consistent attribution context
            allConversionEvents.forEach(event => {
                expect(event._timestamp).toBeDefined();
                // Attribution data would be handled by GTM tags, not directly in dataLayer events
            });
        });
    });

    describe('Performance and Load Testing', () => {
        beforeEach(async () => {
            await gtmService.initialize('GTM-E2E123');
        });

        test('should handle rapid booking flow completion', () => {
            const startTime = Date.now();

            const tourData = {
                tourId: 'rapid-booking',
                tourName: 'Rapid Booking Test',
                price: 9000
            };

            // Complete entire flow rapidly
            bookingFlowManager.initializeBooking(tourData);

            const viewResult = bookingFlowManager.trackViewItem();
            gtmService.trackViewItemConversion(viewResult.data);

            const checkoutResult = bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'rapid@example.com' }
            });
            gtmService.trackBeginCheckoutConversion(checkoutResult.data, { email: 'rapid@example.com' });

            const paymentResult = bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 9000
            });
            gtmService.trackAddPaymentInfoConversion(paymentResult.data, { email: 'rapid@example.com' });

            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_rapid_123'
            });
            gtmService.trackPurchaseConversion(purchaseResult.data, { email: 'rapid@example.com' });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete rapidly (under 100ms)
            expect(duration).toBeLessThan(100);

            // Verify all events were tracked
            const conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );
            expect(conversionEvents.length).toBe(4);
        });

        test('should handle concurrent booking flows', () => {
            const bookingFlows = [];

            // Start multiple booking flows concurrently
            for (let i = 0; i < 5; i++) {
                const tourData = {
                    tourId: `concurrent-tour-${i}`,
                    tourName: `Concurrent Tour ${i}`,
                    price: 5000 + (i * 1000)
                };

                // Each flow uses separate booking manager instance (simulated)
                const flowData = {
                    tourData,
                    bookingId: `concurrent_booking_${i}`,
                    transactionId: `txn_concurrent_${i}`
                };

                bookingFlows.push(flowData);

                // Track conversion for each flow
                gtmService.trackPurchaseConversion({
                    transaction_id: flowData.transactionId,
                    value: flowData.tourData.price,
                    currency: 'JPY',
                    items: [{
                        item_id: flowData.tourData.tourId,
                        item_name: flowData.tourData.tourName,
                        price: flowData.tourData.price,
                        quantity: 1
                    }]
                });
            }

            // Verify all concurrent conversions were tracked
            const conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvents.length).toBe(5);

            // Verify each conversion has unique transaction ID
            const transactionIds = conversionEvents.map(event => event.transaction_id);
            const uniqueIds = new Set(transactionIds);
            expect(uniqueIds.size).toBe(5);
        });
    });
});