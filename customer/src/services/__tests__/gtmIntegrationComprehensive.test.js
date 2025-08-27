/**
 * Comprehensive GTM Integration Tests
 * Tests GTM container loading, tag firing, and conversion tracking
 * Requirements: 1.4, 2.3, 7.1, 10.2 (Task 14)
 */

import gtmService from '../gtmService.js';
import bookingFlowManager from '../bookingFlowManager.js';

// Mock environment variables
const mockEnv = {
    REACT_APP_GTM_CONTAINER_ID: 'GTM-TEST123',
    REACT_APP_GA_MEASUREMENT_ID: 'G-TEST123',
    REACT_APP_GTM_AUTH: 'test_auth',
    REACT_APP_GTM_PREVIEW: 'test_preview',
    REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392',
    REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: JSON.stringify({
        purchase: 'AbC-D_efGhIjKlMnOp',
        begin_checkout: 'XyZ-A_bcDeFgHiJkLm',
        view_item: 'QrS-T_uvWxYzAbCdEf'
    })
};

describe('GTM Integration - Comprehensive Tests', () => {
    let mockDataLayer;
    let mockGtag;
    let mockGoogleTagManager;
    let originalWindow;
    let originalDocument;

    beforeEach(() => {
        // Store originals
        originalWindow = global.window;
        originalDocument = global.document;

        // Reset mocks
        jest.clearAllMocks();

        // Mock environment variables
        Object.keys(mockEnv).forEach(key => {
            process.env[key] = mockEnv[key];
        });

        // Create fresh mocks
        mockDataLayer = [];
        mockGtag = jest.fn();
        mockGoogleTagManager = {};

        // Mock DOM elements
        const mockScript = {
            onload: null,
            onerror: null,
            src: '',
            async: false
        };

        const mockFirstScript = {
            parentNode: {
                insertBefore: jest.fn()
            }
        };

        // Mock global objects
        global.window = {
            dataLayer: mockDataLayer,
            gtag: mockGtag,
            google_tag_manager: mockGoogleTagManager,
            location: {
                href: 'https://test.example.com/gion-tour',
                search: '?gclid=test_gclid_123'
            }
        };

        global.document = {
            querySelector: jest.fn().mockReturnValue(null),
            createElement: jest.fn().mockReturnValue(mockScript),
            getElementsByTagName: jest.fn().mockReturnValue([mockFirstScript]),
            title: 'Test Tour Page',
            referrer: 'https://google.com'
        };

        // Reset service states
        gtmService.isInitialized = false;
        gtmService.containerId = null;
        gtmService.fallbackToGtag = false;
        gtmService.debugMode = false;
        bookingFlowManager.resetBookingState();
    });

    afterEach(() => {
        // Clean up environment variables
        Object.keys(mockEnv).forEach(key => {
            delete process.env[key];
        });

        // Restore originals
        global.window = originalWindow;
        global.document = originalDocument;
    });

    describe('GTM Container Loading Tests', () => {
        test('should load GTM container successfully with proper script injection', async () => {
            // Mock successful GTM loading
            const mockScript = global.document.createElement();
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(true);
            expect(gtmService.isInitialized).toBe(true);
            expect(gtmService.containerId).toBe('GTM-TEST123');
            expect(global.document.createElement).toHaveBeenCalledWith('script');
            expect(mockScript.src).toContain('GTM-TEST123');
        });

        test('should handle GTM script loading failure gracefully', async () => {
            const mockScript = global.document.createElement();

            // Simulate script loading error
            setTimeout(() => {
                if (mockScript.onerror) {
                    mockScript.onerror(new Error('Script loading failed'));
                }
            }, 10);

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
        });

        test('should include auth and preview parameters when provided', async () => {
            const mockScript = global.document.createElement();
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };

            await gtmService.initialize('GTM-TEST123', {
                auth: 'custom_auth',
                preview: 'custom_preview'
            });

            expect(mockScript.src).toContain('gtm_auth=custom_auth');
            expect(mockScript.src).toContain('gtm_preview=custom_preview');
        });

        test('should detect already loaded GTM container', async () => {
            // Pre-load GTM container
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(true);
            expect(gtmService.isInitialized).toBe(true);
            // Should not create new script if already loaded
            expect(global.document.createElement).not.toHaveBeenCalled();
        });

        test('should timeout and fallback if GTM takes too long to load', async () => {
            // Set very short timeout for testing
            gtmService.initializationTimeout = 50;

            const result = await gtmService.initialize('GTM-TEST123');

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
        });
    });

    describe('GTM Tag Firing Tests', () => {
        beforeEach(async () => {
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };
            await gtmService.initialize('GTM-TEST123');
        });

        test('should fire GTM tags for view_item conversion', () => {
            const itemData = {
                value: 12000,
                currency: 'JPY',
                items: [{
                    item_id: 'gion-tour',
                    item_name: 'Gion District Walking Tour',
                    item_category: 'cultural',
                    price: 12000,
                    quantity: 1
                }]
            };

            gtmService.trackViewItemConversion(itemData);

            // Should push both Google Ads conversion and GA4 event
            expect(mockDataLayer.length).toBeGreaterThanOrEqual(2);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );
            const ga4Event = mockDataLayer.find(event =>
                event.event === 'view_item'
            );

            expect(conversionEvent).toBeDefined();
            expect(ga4Event).toBeDefined();
            expect(conversionEvent.value).toBe(12000);
            expect(ga4Event.currency).toBe('JPY');
        });

        test('should fire GTM tags for begin_checkout conversion', () => {
            const checkoutData = {
                value: 24000,
                currency: 'JPY',
                items: [{
                    item_id: 'gion-tour',
                    item_name: 'Gion District Walking Tour',
                    quantity: 2,
                    price: 12000
                }]
            };

            const customerData = {
                email: 'test@example.com',
                phone: '+81-90-1234-5678'
            };

            gtmService.trackBeginCheckoutConversion(checkoutData, customerData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );
            const ga4Event = mockDataLayer.find(event =>
                event.event === 'begin_checkout'
            );

            expect(conversionEvent).toBeDefined();
            expect(ga4Event).toBeDefined();
            expect(conversionEvent.user_data).toEqual(customerData);
        });

        test('should fire GTM tags for purchase conversion with enhanced data', () => {
            const purchaseData = {
                transaction_id: 'txn_test_123',
                value: 24000,
                currency: 'JPY',
                items: [{
                    item_id: 'gion-tour',
                    item_name: 'Gion District Walking Tour',
                    quantity: 2,
                    price: 12000
                }]
            };

            const customerData = {
                email: 'test@example.com',
                phone: '+81-90-1234-5678'
            };

            gtmService.trackPurchaseConversion(purchaseData, customerData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );
            const ga4Event = mockDataLayer.find(event =>
                event.event === 'purchase'
            );

            expect(conversionEvent).toBeDefined();
            expect(ga4Event).toBeDefined();
            expect(conversionEvent.transaction_id).toBe('txn_test_123');
            expect(conversionEvent.user_data).toEqual(customerData);
        });

        test('should validate tag firing with debug mode', async () => {
            gtmService.enableDebugMode(true);

            const result = await gtmService.validateTagFiring('google_ads_conversion');

            expect(result).toBe(true);

            const validationEvent = mockDataLayer.find(event =>
                event.event === 'tag_validation'
            );

            expect(validationEvent).toBeDefined();
            expect(validationEvent.tag_name).toBe('google_ads_conversion');
            expect(validationEvent.validation_id).toBeDefined();
        });
    });

    describe('End-to-End Booking Flow Conversion Tests', () => {
        beforeEach(async () => {
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };
            await gtmService.initialize('GTM-TEST123');
        });

        test('should track complete booking flow with GTM integration', () => {
            // Initialize booking
            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                date: '2024-03-15',
                time: '14:00',
                location: 'Kyoto'
            };

            const bookingId = bookingFlowManager.initializeBooking(tourData);
            expect(bookingId).toBeDefined();

            // Step 1: Track view item
            const viewResult = bookingFlowManager.trackViewItem();
            expect(viewResult.success).toBe(true);

            // Verify GTM event was pushed
            gtmService.trackViewItemConversion(viewResult.data);

            let conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );
            expect(conversionEvents.length).toBeGreaterThanOrEqual(1);

            // Step 2: Track begin checkout
            const checkoutData = {
                customerData: {
                    email: 'test@example.com',
                    phone: '+81-90-1234-5678',
                    name: 'John Doe'
                }
            };

            const checkoutResult = bookingFlowManager.trackBeginCheckout(checkoutData);
            expect(checkoutResult.success).toBe(true);

            gtmService.trackBeginCheckoutConversion(checkoutResult.data, checkoutData.customerData);

            // Step 3: Track add payment info
            const paymentData = {
                provider: 'stripe',
                amount: 12000,
                currency: 'JPY',
                paymentMethod: 'card'
            };

            const paymentResult = bookingFlowManager.trackAddPaymentInfo(paymentData);
            expect(paymentResult.success).toBe(true);

            gtmService.trackAddPaymentInfoConversion(paymentResult.data, checkoutData.customerData);

            // Step 4: Track purchase
            const transactionData = {
                transactionId: 'txn_e2e_test_123',
                finalAmount: 12000,
                paymentProvider: 'stripe'
            };

            const purchaseResult = bookingFlowManager.trackPurchase(transactionData);
            expect(purchaseResult.success).toBe(true);

            gtmService.trackPurchaseConversion(purchaseResult.data, checkoutData.customerData);

            // Verify all conversion events were tracked
            conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );
            expect(conversionEvents.length).toBeGreaterThanOrEqual(4);

            // Verify booking state
            const finalState = bookingFlowManager.getCurrentBookingState();
            expect(finalState.conversionTracking.viewItemTracked).toBe(true);
            expect(finalState.conversionTracking.beginCheckoutTracked).toBe(true);
            expect(finalState.conversionTracking.addPaymentInfoTracked).toBe(true);
            expect(finalState.conversionTracking.purchaseTracked).toBe(true);
        });

        test('should handle booking flow errors gracefully', () => {
            // Try to track without initialization
            expect(() => {
                bookingFlowManager.trackViewItem();
            }).toThrow('Booking must be initialized before tracking view item');

            // Initialize and try invalid progression
            bookingFlowManager.initializeBooking({
                tourId: 'test-tour',
                price: 5000
            });

            // Try to skip steps
            expect(() => {
                bookingFlowManager.trackAddPaymentInfo({ provider: 'stripe' });
            }).toThrow('Customer data with email is required');
        });

        test('should prevent duplicate conversion tracking', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'test-tour',
                price: 5000
            });

            // Track view item twice
            const firstResult = bookingFlowManager.trackViewItem();
            expect(firstResult.success).toBe(true);

            const secondResult = bookingFlowManager.trackViewItem();
            expect(secondResult.success).toBe(false);
            expect(secondResult.reason).toBe('already_tracked');
        });
    });

    describe('Conversion Accuracy Validation Tests', () => {
        beforeEach(async () => {
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };
            await gtmService.initialize('GTM-TEST123');
        });

        test('should validate conversion data accuracy', () => {
            const testData = {
                transaction_id: 'txn_accuracy_test',
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'morning-tour',
                    item_name: 'Morning Bamboo Tour',
                    price: 15000,
                    quantity: 1
                }]
            };

            gtmService.trackPurchaseConversion(testData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            // Validate data structure
            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.transaction_id).toBe(testData.transaction_id);
            expect(conversionEvent.value).toBe(testData.value);
            expect(conversionEvent.currency).toBe(testData.currency);
            expect(conversionEvent.items).toEqual(testData.items);

            // Validate timestamp
            expect(conversionEvent._timestamp).toBeDefined();
            expect(typeof conversionEvent._timestamp).toBe('number');
        });

        test('should validate conversion value calculations with discounts', () => {
            bookingFlowManager.initializeBooking({
                tourId: 'test-tour',
                price: 10000
            });

            bookingFlowManager.trackBeginCheckout({
                customerData: { email: 'test@example.com' }
            });

            bookingFlowManager.trackAddPaymentInfo({
                provider: 'stripe',
                amount: 10000
            });

            // Purchase with discount
            const purchaseResult = bookingFlowManager.trackPurchase({
                transactionId: 'txn_discount_test',
                finalAmount: 8000, // 20% discount applied
                originalAmount: 10000,
                discount: {
                    type: 'percentage',
                    value: 20
                }
            });

            expect(purchaseResult.success).toBe(true);
            expect(purchaseResult.data.value).toBe(8000);

            // Verify pricing optimization was applied
            if (purchaseResult.pricingOptimization) {
                expect(purchaseResult.pricingOptimization.originalTotal).toBe(10000);
                expect(purchaseResult.pricingOptimization.finalPrice).toBe(8000);
                expect(purchaseResult.pricingOptimization.discountAmount).toBe(2000);
            }
        });

        test('should validate enhanced conversion data format', () => {
            const customerData = {
                email: 'test@example.com',
                phone: '+81-90-1234-5678'
            };

            const purchaseData = {
                transaction_id: 'txn_enhanced_test',
                value: 20000,
                currency: 'JPY'
            };

            gtmService.trackPurchaseConversion(purchaseData, customerData);

            const conversionEvent = mockDataLayer.find(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvent.user_data).toBeDefined();
            expect(conversionEvent.user_data.email).toBe(customerData.email);
            expect(conversionEvent.user_data.phone).toBe(customerData.phone);
        });
    });

    describe('GTM Debug Mode and Validation Tests', () => {
        beforeEach(async () => {
            mockGoogleTagManager['GTM-TEST123'] = { loaded: true };
            await gtmService.initialize('GTM-TEST123');
        });

        test('should enable debug mode and add debug information', () => {
            gtmService.enableDebugMode(true);

            // Clear debug mode event
            mockDataLayer.length = 0;

            gtmService.pushEvent('test_debug_event', { value: 100 });

            const debugEvent = mockDataLayer.find(event =>
                event.event === 'test_debug_event'
            );

            expect(debugEvent._debug).toBeDefined();
            expect(debugEvent._debug.source).toBe('gtmService');
            expect(debugEvent._debug.containerId).toBe('GTM-TEST123');
            expect(debugEvent._debug.fallbackMode).toBe(false);
        });

        test('should validate GTM container status', () => {
            const status = gtmService.getStatus();

            expect(status.isInitialized).toBe(true);
            expect(status.containerId).toBe('GTM-TEST123');
            expect(status.fallbackMode).toBe(false);
            expect(status.debugMode).toBe(false);
            expect(typeof status.dataLayerLength).toBe('number');
        });

        test('should handle GTM preview mode', async () => {
            const options = {
                auth: 'test_auth_token',
                preview: 'test_preview_token'
            };

            const mockScript = global.document.createElement();
            mockGoogleTagManager['GTM-PREVIEW'] = { loaded: true };

            await gtmService.initialize('GTM-PREVIEW', options);

            expect(mockScript.src).toContain('gtm_auth=test_auth_token');
            expect(mockScript.src).toContain('gtm_preview=test_preview_token');
        });

        test('should validate dataLayer event structure', () => {
            const eventData = {
                event_category: 'ecommerce',
                event_label: 'test_conversion',
                value: 5000,
                currency: 'JPY'
            };

            gtmService.pushEvent('test_validation', eventData);

            const pushedEvent = mockDataLayer[mockDataLayer.length - 1];

            expect(pushedEvent.event).toBe('test_validation');
            expect(pushedEvent.event_category).toBe('ecommerce');
            expect(pushedEvent.event_label).toBe('test_conversion');
            expect(pushedEvent.value).toBe(5000);
            expect(pushedEvent.currency).toBe('JPY');
            expect(pushedEvent._timestamp).toBeDefined();
        });
    });

    describe('Fallback and Error Handling Tests', () => {
        test('should fallback to gtag when GTM fails to load', async () => {
            // Don't mock GTM as loaded to simulate failure
            gtmService.initializationTimeout = 100;

            const result = await gtmService.initialize('GTM-FAILED');

            expect(result).toBe(false);
            expect(gtmService.fallbackToGtag).toBe(true);
            expect(global.window.gtag).toBeDefined();
        });

        test('should use fallback gtag for event tracking when GTM unavailable', () => {
            gtmService.fallbackToGtag = true;
            global.window.gtag = mockGtag;

            gtmService.pushEvent('fallback_test', { value: 100 });

            expect(mockGtag).toHaveBeenCalledWith('event', 'fallback_test', { value: 100 });
        });

        test('should handle dataLayer errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock dataLayer to throw error
            global.window.dataLayer = {
                push: jest.fn(() => {
                    throw new Error('DataLayer error');
                })
            };

            gtmService.pushEvent('error_test', { value: 100 });

            expect(consoleSpy).toHaveBeenCalledWith(
                'GTM: Failed to push event:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        test('should validate conversion tracking when GTM is not initialized', () => {
            gtmService.isInitialized = false;

            const result = gtmService.trackPurchaseConversion({
                transaction_id: 'test',
                value: 100
            });

            // Should still attempt to track (may use fallback)
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Performance and Load Testing', () => {
        test('should handle multiple rapid conversion events', () => {
            const events = [];
            for (let i = 0; i < 10; i++) {
                events.push({
                    transaction_id: `txn_load_test_${i}`,
                    value: 1000 * (i + 1),
                    currency: 'JPY'
                });
            }

            events.forEach(event => {
                gtmService.trackPurchaseConversion(event);
            });

            const conversionEvents = mockDataLayer.filter(event =>
                event.event === 'google_ads_conversion'
            );

            expect(conversionEvents.length).toBe(events.length);
        });

        test('should handle large dataLayer without performance issues', () => {
            // Add many events to dataLayer
            for (let i = 0; i < 100; i++) {
                mockDataLayer.push({
                    event: `test_event_${i}`,
                    value: i,
                    timestamp: Date.now()
                });
            }

            const startTime = Date.now();
            gtmService.pushEvent('performance_test', { value: 999 });
            const endTime = Date.now();

            // Should complete quickly (under 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});