/**
 * Tests for GTM Conversion Configuration Service
 */

import GTMConversionConfig from '../gtmConversionConfig.js';

// Mock environment variables
const mockEnv = {
    REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392',
    REACT_APP_GOOGLE_ADS_CONVERSION_LABELS: JSON.stringify({
        purchase: 'AbC-D_efGhIjKlMnOp',
        begin_checkout: 'XyZ-A_bcDeFgHiJkLm',
        view_item: 'QrS-T_uvWxYzAbCdEf',
        add_payment_info: 'MnO-P_qrStUvWxYzAb'
    }),
    REACT_APP_ENHANCED_CONVERSIONS_ENABLED: 'true'
};

// Mock process.env
Object.defineProperty(process, 'env', {
    value: mockEnv
});

describe('GTMConversionConfig', () => {
    let conversionConfig;

    beforeEach(() => {
        conversionConfig = new GTMConversionConfig();
    });

    describe('Configuration Validation', () => {
        test('should validate configuration with all required fields', () => {
            const isValid = conversionConfig.validateConfiguration();
            expect(isValid).toBe(true);
        });

        test('should fail validation with missing conversion ID', () => {
            const originalEnv = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
            delete process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;

            const config = new GTMConversionConfig();
            const isValid = config.validateConfiguration();
            expect(isValid).toBe(false);

            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = originalEnv;
        });

        test('should fail validation with missing conversion labels', () => {
            const originalEnv = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = JSON.stringify({});

            const config = new GTMConversionConfig();
            const isValid = config.validateConfiguration();
            expect(isValid).toBe(false);

            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = originalEnv;
        });
    });

    describe('Purchase Conversion Configuration', () => {
        test('should generate correct purchase conversion config', () => {
            const transactionData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'txn_123',
                tour_id: 'morning_tour',
                tour_name: 'Morning Arashiyama Tour',
                booking_date: '2025-01-15',
                payment_provider: 'stripe'
            };

            const config = conversionConfig.getPurchaseConversionConfig(transactionData);

            expect(config).toEqual({
                conversionId: 'AW-17482092392',
                conversionLabel: 'AbC-D_efGhIjKlMnOp',
                conversionValue: 15000,
                currencyCode: 'JPY',
                transactionId: 'txn_123',
                enhancedConversions: true,
                customParameters: {
                    tour_id: 'morning_tour',
                    tour_name: 'Morning Arashiyama Tour',
                    booking_date: '2025-01-15',
                    payment_provider: 'stripe'
                }
            });
        });

        test('should handle missing transaction data with defaults', () => {
            const config = conversionConfig.getPurchaseConversionConfig({});

            expect(config.conversionValue).toBe(0);
            expect(config.currencyCode).toBe('JPY');
            expect(config.conversionId).toBe('AW-17482092392');
            expect(config.conversionLabel).toBe('AbC-D_efGhIjKlMnOp');
        });
    });

    describe('Begin Checkout Conversion Configuration', () => {
        test('should generate correct begin checkout conversion config', () => {
            const checkoutData = {
                value: 15000,
                currency: 'JPY',
                tour_id: 'night_tour',
                tour_name: 'Night Gion Tour'
            };

            const config = conversionConfig.getBeginCheckoutConversionConfig(checkoutData);

            expect(config).toEqual({
                conversionId: 'AW-17482092392',
                conversionLabel: 'XyZ-A_bcDeFgHiJkLm',
                conversionValue: 15000,
                currencyCode: 'JPY',
                enhancedConversions: true,
                customParameters: {
                    tour_id: 'night_tour',
                    tour_name: 'Night Gion Tour',
                    checkout_step: 'begin_checkout'
                }
            });
        });
    });

    describe('View Item Conversion Configuration', () => {
        test('should generate correct view item conversion config', () => {
            const itemData = {
                value: 15000,
                currency: 'JPY',
                tour_id: 'uji_tour',
                tour_name: 'Uji Tea Tour',
                item_category: 'tour'
            };

            const config = conversionConfig.getViewItemConversionConfig(itemData);

            expect(config).toEqual({
                conversionId: 'AW-17482092392',
                conversionLabel: 'QrS-T_uvWxYzAbCdEf',
                conversionValue: 15000,
                currencyCode: 'JPY',
                enhancedConversions: true,
                customParameters: {
                    tour_id: 'uji_tour',
                    tour_name: 'Uji Tea Tour',
                    item_category: 'tour'
                }
            });
        });
    });

    describe('Add Payment Info Conversion Configuration', () => {
        test('should generate correct add payment info conversion config', () => {
            const paymentData = {
                value: 15000,
                currency: 'JPY',
                payment_provider: 'payjp',
                tour_id: 'gion_tour'
            };

            const config = conversionConfig.getAddPaymentInfoConversionConfig(paymentData);

            expect(config).toEqual({
                conversionId: 'AW-17482092392',
                conversionLabel: 'MnO-P_qrStUvWxYzAb',
                conversionValue: 15000,
                currencyCode: 'JPY',
                enhancedConversions: true,
                customParameters: {
                    payment_provider: 'payjp',
                    tour_id: 'gion_tour'
                }
            });
        });
    });

    describe('DataLayer Event Generation', () => {
        test('should generate correct dataLayer event for purchase conversion', () => {
            const eventData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'txn_123',
                items: [{ item_id: 'tour_1', item_name: 'Test Tour' }],
                user_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                }
            };

            const purchaseConfig = {
                conversionId: 'AW-17482092392',
                conversionLabel: 'AbC-D_efGhIjKlMnOp',
                conversionValue: 15000,
                currencyCode: 'JPY',
                enhancedConversions: true,
                customParameters: {
                    tour_id: 'morning_tour'
                }
            };

            const dataLayerEvent = conversionConfig.generateConversionDataLayerEvent(
                'purchase',
                eventData,
                purchaseConfig
            );

            expect(dataLayerEvent).toEqual({
                event: 'google_ads_conversion',
                event_category: 'ecommerce',
                event_label: 'purchase',
                conversion_id: 'AW-17482092392',
                conversion_label: 'AbC-D_efGhIjKlMnOp',
                value: 15000,
                currency: 'JPY',
                enhanced_conversion_data: {
                    email: 'hashed_email',
                    phone_number: 'hashed_phone'
                },
                custom_parameters: {
                    tour_id: 'morning_tour'
                },
                transaction_id: 'txn_123',
                items: [{ item_id: 'tour_1', item_name: 'Test Tour' }]
            });
        });

        test('should generate dataLayer event without enhanced conversion data when not provided', () => {
            const eventData = {
                value: 15000,
                currency: 'JPY'
            };

            const checkoutConfig = {
                conversionId: 'AW-17482092392',
                conversionLabel: 'XyZ-A_bcDeFgHiJkLm',
                conversionValue: 15000,
                currencyCode: 'JPY',
                enhancedConversions: false,
                customParameters: {}
            };

            const dataLayerEvent = conversionConfig.generateConversionDataLayerEvent(
                'begin_checkout',
                eventData,
                checkoutConfig
            );

            expect(dataLayerEvent.enhanced_conversion_data).toBeUndefined();
            expect(dataLayerEvent.event).toBe('google_ads_conversion');
            expect(dataLayerEvent.event_label).toBe('begin_checkout');
        });
    });

    describe('Event Validation', () => {
        test('should validate purchase event with required fields', () => {
            const eventData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'txn_123'
            };

            const isValid = conversionConfig.validateConversionEvent('purchase', eventData);
            expect(isValid).toBe(true);
        });

        test('should fail validation for purchase event with missing required fields', () => {
            const eventData = {
                value: 15000
                // Missing currency and transaction_id
            };

            const isValid = conversionConfig.validateConversionEvent('purchase', eventData);
            expect(isValid).toBe(false);
        });

        test('should validate view_item event with required fields', () => {
            const eventData = {
                tour_id: 'morning_tour'
            };

            const isValid = conversionConfig.validateConversionEvent('view_item', eventData);
            expect(isValid).toBe(true);
        });

        test('should validate begin_checkout event with required fields', () => {
            const eventData = {
                value: 15000,
                currency: 'JPY'
            };

            const isValid = conversionConfig.validateConversionEvent('begin_checkout', eventData);
            expect(isValid).toBe(true);
        });
    });

    describe('Debug Information', () => {
        test('should provide debug information', () => {
            const debugInfo = conversionConfig.getDebugInfo();

            expect(debugInfo).toEqual({
                conversionId: 'AW-17482092392',
                conversionLabels: {
                    purchase: 'AbC-D_efGhIjKlMnOp',
                    begin_checkout: 'XyZ-A_bcDeFgHiJkLm',
                    view_item: 'QrS-T_uvWxYzAbCdEf',
                    add_payment_info: 'MnO-P_qrStUvWxYzAb'
                },
                enhancedConversionsEnabled: true,
                configurationValid: true
            });
        });
    });
});