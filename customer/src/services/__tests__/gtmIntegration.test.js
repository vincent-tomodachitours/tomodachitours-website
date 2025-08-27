/**
 * Integration tests for GTM conversion tracking
 */

import gtmService from '../gtmService.js';
import gtmTestingUtils from '../gtmTestingUtils.js';

// Mock environment variables
const mockEnv = {
    REACT_APP_GTM_CONTAINER_ID: 'GTM-XXXXXXX',
    REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392',
    REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: JSON.stringify({
        purchase: 'AbC-D_efGhIjKlMnOp',
        begin_checkout: 'XyZ-A_bcDeFgHiJkLm',
        view_item: 'QrS-T_uvWxYzAbCdEf',
        add_payment_info: 'MnO-P_qrStUvWxYzAb'
    }),
    REACT_APP_ENHANCED_CONVERSIONS_ENABLED: 'true'
};

Object.defineProperty(process, 'env', {
    value: mockEnv
});

describe('GTM Conversion Integration', () => {
    beforeEach(() => {
        // Reset window.dataLayer
        window.dataLayer = [];

        // Enable debug mode for testing
        gtmService.enableDebugMode(true);
    });

    describe('Purchase Conversion Tracking', () => {
        test('should track purchase conversion with complete data', () => {
            const transactionData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'txn_test_123',
                items: [{
                    item_id: 'morning_tour',
                    item_name: 'Morning Arashiyama Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'morning_tour',
                tour_name: 'Morning Arashiyama Tour',
                booking_date: '2025-01-15',
                payment_provider: 'stripe'
            };

            const customerData = {
                email: 'hashed_email_123',
                phone_number: 'hashed_phone_123'
            };

            const result = gtmService.trackPurchaseConversion(transactionData, customerData);

            expect(result).toBe(true);
            expect(window.dataLayer.length).toBeGreaterThanOrEqual(2); // google_ads_conversion + purchase events (+ debug event)

            // Check Google Ads conversion event
            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent).toBeDefined();
            expect(conversionEvent.event_label).toBe('purchase');
            expect(conversionEvent.conversion_id).toBe('AW-17482092392');
            expect(conversionEvent.conversion_label).toBe('AbC-D_efGhIjKlMnOp');
            expect(conversionEvent.value).toBe(15000);
            expect(conversionEvent.currency).toBe('JPY');
            expect(conversionEvent.transaction_id).toBe('txn_test_123');
            expect(conversionEvent.enhanced_conversion_data).toEqual(customerData);

            // Check standard ecommerce event
            const ecommerceEvent = window.dataLayer.find(event => event.event === 'purchase');
            expect(ecommerceEvent).toBeDefined();
            expect(ecommerceEvent.value).toBe(15000);
            expect(ecommerceEvent.items).toEqual(transactionData.items);
        });
    });

    describe('Begin Checkout Conversion Tracking', () => {
        test('should track begin checkout conversion', () => {
            const checkoutData = {
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'night_tour',
                    item_name: 'Night Gion Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'night_tour',
                tour_name: 'Night Gion Tour'
            };

            const result = gtmService.trackBeginCheckoutConversion(checkoutData);

            expect(result).toBe(true);
            expect(window.dataLayer.length).toBeGreaterThanOrEqual(2);

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent.event_label).toBe('begin_checkout');
            expect(conversionEvent.conversion_label).toBe('XyZ-A_bcDeFgHiJkLm');
            expect(conversionEvent.custom_parameters.checkout_step).toBe('begin_checkout');
        });
    });

    describe('View Item Conversion Tracking', () => {
        test('should track view item conversion', () => {
            const itemData = {
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'uji_tour',
                    item_name: 'Uji Tea Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'uji_tour',
                tour_name: 'Uji Tea Tour',
                item_category: 'tour'
            };

            const result = gtmService.trackViewItemConversion(itemData);

            expect(result).toBe(true);

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent.event_label).toBe('view_item');
            expect(conversionEvent.conversion_label).toBeTruthy(); // Should have a conversion label
            expect(conversionEvent.custom_parameters.item_category).toBe('tour');
        });
    });

    describe('Add Payment Info Conversion Tracking', () => {
        test('should track add payment info conversion', () => {
            const paymentData = {
                value: 15000,
                currency: 'JPY',
                payment_provider: 'payjp',
                tour_id: 'gion_tour'
            };

            const customerData = {
                email: 'hashed_email_456',
                phone_number: 'hashed_phone_456'
            };

            const result = gtmService.trackAddPaymentInfoConversion(paymentData, customerData);

            expect(result).toBe(true);

            const conversionEvent = window.dataLayer.find(event => event.event === 'google_ads_conversion');
            expect(conversionEvent.event_label).toBe('add_payment_info');
            expect(conversionEvent.conversion_label).toBeTruthy(); // Should have a conversion label
            expect(conversionEvent.custom_parameters.payment_provider).toBe('payjp');
            expect(conversionEvent.enhanced_conversion_data).toEqual(customerData);
        });
    });

    describe('GTM Service Status', () => {
        test('should provide comprehensive status information', () => {
            const status = gtmService.getStatus();

            expect(status).toHaveProperty('isInitialized');
            expect(status).toHaveProperty('containerId');
            expect(status).toHaveProperty('fallbackMode');
            expect(status).toHaveProperty('debugMode');
            expect(status).toHaveProperty('dataLayerLength');
            expect(status).toHaveProperty('conversionConfig');

            expect(status.conversionConfig.conversionId).toBe('AW-17482092392');
            expect(status.conversionConfig.enhancedConversionsEnabled).toBe(true);
            expect(status.conversionConfig.conversionLabels).toHaveProperty('purchase');
            expect(status.conversionConfig.conversionLabels).toHaveProperty('begin_checkout');
            expect(status.conversionConfig.conversionLabels).toHaveProperty('view_item');
            expect(Object.keys(status.conversionConfig.conversionLabels).length).toBeGreaterThan(0);
        });
    });

    describe('Testing Utilities Integration', () => {
        test('should generate diagnostic report with GTM service data', () => {
            // Track some conversions first
            gtmService.trackPurchaseConversion({
                value: 15000,
                currency: 'JPY',
                transaction_id: 'test_txn_diagnostic'
            });

            const report = gtmTestingUtils.generateDiagnosticReport();

            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('gtmConfiguration');
            expect(report).toHaveProperty('conversionConfiguration');
            expect(report).toHaveProperty('dataLayerStatus');

            expect(report.conversionConfiguration.conversionId).toBe('AW-17482092392');
            expect(report.dataLayerStatus.exists).toBe(true);
            expect(report.dataLayerStatus.length).toBeGreaterThan(0);
        });

        test('should validate conversion tracking accuracy', () => {
            const testResults = gtmTestingUtils.testAllConversions();

            expect(testResults).toHaveProperty('purchase');
            expect(testResults).toHaveProperty('begin_checkout');
            expect(testResults).toHaveProperty('view_item');
            expect(testResults).toHaveProperty('add_payment_info');

            Object.values(testResults).forEach(result => {
                expect(result.success).toBe(true);
                expect(result.testId).toBeTruthy();
            });

            // Verify all test events were recorded
            const testHistory = gtmTestingUtils.getTestHistory();
            expect(testHistory.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid conversion data gracefully', () => {
            const invalidData = {
                // Missing required fields
            };

            const result = gtmService.trackPurchaseConversion(invalidData);

            expect(result).toBe(false);
        });

        test('should handle missing conversion labels', () => {
            // Temporarily modify environment
            const originalLabels = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = JSON.stringify({});

            // This should fail validation
            const result = gtmService.trackPurchaseConversion({
                value: 15000,
                currency: 'JPY',
                transaction_id: 'test_txn'
            });

            expect(result).toBe(false);

            // Restore original labels
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = originalLabels;
        });
    });
});