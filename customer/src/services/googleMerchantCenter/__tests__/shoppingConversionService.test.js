/**
 * Unit tests for Shopping Conversion Service
 */

import shoppingConversionService from '../shoppingConversionService.js';
import gtmService from '../../gtmService.js';
import dynamicRemarketingService from '../dynamicRemarketingService.js';
import { getTour } from '../../toursService.js';

// Mock dependencies
jest.mock('../../gtmService.js');
jest.mock('../dynamicRemarketingService.js');
jest.mock('../../toursService.js');

describe('ShoppingConversionService', () => {
    const mockTourData = {
        'tour-title': 'Kyoto Night Tour',
        'tour-description': 'Amazing night tour experience',
        'tour-price': 6500,
        'tour-duration': '90-120 minutes',
        'reviews': 178,
        'time-slots': ['17:00', '18:00', '19:00'],
        'max-participants': 12
    };

    const mockTransactionData = {
        participants: 2,
        date: '2025-08-28',
        time: '18:00',
        amount: 13000,
        transaction_id: 'txn_123456',
        paymentMethod: 'stripe'
    };

    const mockShoppingData = {
        campaign_id: 'camp_123',
        ad_group_id: 'adg_456',
        gclid: 'gclid_789',
        feed_id: 'feed_001',
        feed_item_id: 'item_001'
    };

    const mockCustomerData = {
        email_hash: 'hashed_email',
        phone_hash: 'hashed_phone'
    };

    beforeEach(() => {
        getTour.mockResolvedValue(mockTourData);
        gtmService.trackConversion.mockResolvedValue(true);
        gtmService.pushEvent.mockClear();
        dynamicRemarketingService.trackPurchase.mockResolvedValue(true);
        dynamicRemarketingService.trackAddToCart.mockResolvedValue(true);
        dynamicRemarketingService.trackViewItem.mockResolvedValue(true);

        // Set up environment variables
        process.env.REACT_APP_GOOGLE_MERCHANT_ID = 'TEST_MERCHANT_123';
        process.env.REACT_APP_SHOPPING_PURCHASE_LABEL = 'shopping_purchase_label';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackShoppingPurchase', () => {
        test('should track shopping purchase successfully', async () => {
            const result = await shoppingConversionService.trackShoppingPurchase(
                'night-tour',
                mockTransactionData,
                mockShoppingData,
                mockCustomerData
            );

            expect(result).toBe(true);
            expect(getTour).toHaveBeenCalledWith('night-tour');
            expect(gtmService.trackConversion).toHaveBeenCalled();
            expect(dynamicRemarketingService.trackPurchase).toHaveBeenCalledWith(
                'night-tour',
                mockTransactionData,
                mockTourData
            );
            expect(gtmService.pushEvent).toHaveBeenCalledWith('shopping_conversion', expect.any(Object));
        });

        test('should handle missing tour data', async () => {
            getTour.mockResolvedValue(null);

            const result = await shoppingConversionService.trackShoppingPurchase(
                'invalid-tour',
                mockTransactionData,
                mockShoppingData
            );

            expect(result).toBe(false);
            expect(gtmService.trackConversion).not.toHaveBeenCalled();
        });

        test('should track purchase without customer data', async () => {
            const result = await shoppingConversionService.trackShoppingPurchase(
                'night-tour',
                mockTransactionData,
                mockShoppingData
            );

            expect(result).toBe(true);
            expect(gtmService.trackConversion).toHaveBeenCalledWith(
                'purchase',
                expect.any(Object),
                null, // No customer data
                expect.any(Object)
            );
        });

        test('should handle conversion tracking errors', async () => {
            gtmService.trackConversion.mockResolvedValue(false);

            const result = await shoppingConversionService.trackShoppingPurchase(
                'night-tour',
                mockTransactionData,
                mockShoppingData
            );

            expect(result).toBe(false);
        });
    });

    describe('trackShoppingAddToCart', () => {
        test('should track shopping add to cart successfully', async () => {
            const cartData = {
                participants: 1,
                date: '2025-08-28',
                time: '18:00'
            };

            const result = await shoppingConversionService.trackShoppingAddToCart(
                'night-tour',
                cartData,
                mockShoppingData
            );

            expect(result).toBe(true);
            expect(gtmService.trackConversion).toHaveBeenCalledWith(
                'add_to_cart',
                expect.objectContaining({
                    value: 6500,
                    currency: 'JPY'
                }),
                undefined,
                expect.any(Object)
            );
            expect(dynamicRemarketingService.trackAddToCart).toHaveBeenCalled();
        });

        test('should calculate correct value for multiple participants', async () => {
            const cartData = {
                participants: 3,
                date: '2025-08-28',
                time: '18:00'
            };

            await shoppingConversionService.trackShoppingAddToCart(
                'night-tour',
                cartData,
                mockShoppingData
            );

            const conversionCall = gtmService.trackConversion.mock.calls[0];
            expect(conversionCall[1].value).toBe(19500); // 6500 * 3
        });
    });

    describe('trackShoppingViewItem', () => {
        test('should track shopping view item successfully', async () => {
            const viewData = {
                source: 'shopping_ad',
                position: 1
            };

            const result = await shoppingConversionService.trackShoppingViewItem(
                'night-tour',
                viewData,
                mockShoppingData
            );

            expect(result).toBe(true);
            expect(gtmService.trackConversion).toHaveBeenCalledWith(
                'view_item',
                expect.objectContaining({
                    value: 6500,
                    currency: 'JPY'
                })
            );
            expect(dynamicRemarketingService.trackViewItem).toHaveBeenCalled();
        });

        test('should work with empty view data', async () => {
            const result = await shoppingConversionService.trackShoppingViewItem(
                'night-tour',
                {},
                mockShoppingData
            );

            expect(result).toBe(true);
        });
    });

    describe('trackShoppingClick', () => {
        test('should track shopping click successfully', async () => {
            const clickData = {
                campaign_id: 'camp_123',
                ad_group_id: 'adg_456',
                gclid: 'gclid_789'
            };

            const result = await shoppingConversionService.trackShoppingClick('night-tour', clickData);

            expect(result).toBe(true);
            expect(gtmService.pushEvent).toHaveBeenCalledWith('shopping_click', expect.objectContaining({
                event_category: 'shopping_campaign',
                event_label: 'shopping_click_night-tour',
                campaign_id: 'camp_123',
                ad_group_id: 'adg_456',
                product_id: 'tour_night-tour',
                gclid: 'gclid_789'
            }));
        });

        test('should handle missing tour data for click tracking', async () => {
            getTour.mockResolvedValue(null);

            const result = await shoppingConversionService.trackShoppingClick('invalid-tour', {});

            expect(result).toBe(false);
        });
    });

    describe('_prepareProductConversionData', () => {
        test('should prepare product conversion data correctly', async () => {
            const eventData = {
                participants: 2,
                booking_date: '2025-08-28',
                booking_time: '18:00',
                amount: 13000,
                transaction_id: 'txn_123'
            };

            const productData = await shoppingConversionService._prepareProductConversionData(
                'night-tour',
                mockTourData,
                eventData,
                mockShoppingData
            );

            expect(productData).toMatchObject({
                product_id: 'tour_night-tour_2025-08-28_1800',
                item_id: 'tour_night-tour_2025-08-28_1800',
                item_name: 'Kyoto Night Tour',
                item_category: 'Arts & Entertainment > Events & Attractions > Tours',
                item_brand: 'Tomodachi Tours',
                price: 6500,
                quantity: 2,
                value: 13000,
                currency: 'JPY',
                merchant_id: 'TEST_MERCHANT_123',
                campaign_id: 'camp_123',
                ad_group_id: 'adg_456',
                tour_type: 'night-tour',
                booking_date: '2025-08-28',
                booking_time: '18:00',
                transaction_id: 'txn_123'
            });
        });

        test('should handle missing booking date/time', async () => {
            const eventData = {
                participants: 1,
                amount: 6500
            };

            const productData = await shoppingConversionService._prepareProductConversionData(
                'night-tour',
                mockTourData,
                eventData,
                mockShoppingData
            );

            expect(productData.product_id).toBe('tour_night-tour');
            expect(productData.booking_date).toBeUndefined();
            expect(productData.booking_time).toBeUndefined();
        });

        test('should use default values for missing data', async () => {
            const eventData = {};

            const productData = await shoppingConversionService._prepareProductConversionData(
                'night-tour',
                mockTourData,
                eventData,
                {}
            );

            expect(productData.quantity).toBe(1);
            expect(productData.value).toBe(6500); // Default to unit price * 1
            expect(productData.discount_amount).toBe(0);
        });
    });

    describe('validateShoppingSetup', () => {
        test('should validate correct setup', async () => {
            const validation = await shoppingConversionService.validateShoppingSetup('night-tour');

            expect(validation.valid).toBe(true);
            expect(validation.errors).toEqual([]);
        });

        test('should detect missing tour data', async () => {
            getTour.mockResolvedValue(null);

            const validation = await shoppingConversionService.validateShoppingSetup('invalid-tour');

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Tour data not found for invalid-tour');
        });

        test('should detect missing merchant ID', async () => {
            delete process.env.REACT_APP_GOOGLE_MERCHANT_ID;

            const validation = await shoppingConversionService.validateShoppingSetup('night-tour');

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Google Merchant ID not configured');
        });

        test('should warn about placeholder conversion labels', async () => {
            process.env.REACT_APP_SHOPPING_PURCHASE_LABEL = 'placeholder_label';

            const validation = await shoppingConversionService.validateShoppingSetup('night-tour');

            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.warnings.some(w => w.includes('placeholder'))).toBe(true);
        });

        test('should handle validation errors', async () => {
            getTour.mockRejectedValue(new Error('Service error'));

            const validation = await shoppingConversionService.validateShoppingSetup('night-tour');

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Validation error: Service error');
        });
    });

    describe('getShoppingPerformanceData', () => {
        test('should return performance data structure', () => {
            const performanceData = shoppingConversionService.getShoppingPerformanceData(
                'night-tour',
                { start: '2025-08-01', end: '2025-08-31' }
            );

            expect(performanceData).toMatchObject({
                tourKey: 'night-tour',
                dateRange: { start: '2025-08-01', end: '2025-08-31' },
                metrics: {
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    conversionValue: 0,
                    cost: 0,
                    roas: 0
                },
                products: [],
                campaigns: []
            });
        });

        test('should handle null tour key', () => {
            const performanceData = shoppingConversionService.getShoppingPerformanceData(null, {});

            expect(performanceData.tourKey).toBeNull();
        });
    });

    describe('getStatus', () => {
        test('should return service status', () => {
            const status = shoppingConversionService.getStatus();

            expect(status).toMatchObject({
                merchantId: 'TEST_MERCHANT_123',
                currency: 'JPY',
                conversionLabels: expect.any(Object),
                productCategories: expect.any(Array),
                gtmServiceStatus: expect.any(Object)
            });
        });
    });

    describe('_trackStandardShoppingConversion', () => {
        test('should track standard conversion with correct data structure', async () => {
            const productData = {
                item_id: 'tour_night-tour',
                item_name: 'Kyoto Night Tour',
                item_category: 'Tours',
                price: 6500,
                quantity: 1,
                value: 6500,
                currency: 'JPY',
                merchant_id: 'TEST_MERCHANT_123',
                campaign_id: 'camp_123',
                gclid: 'gclid_789'
            };

            const result = await shoppingConversionService._trackStandardShoppingConversion(
                'purchase',
                productData,
                mockCustomerData
            );

            expect(result).toBe(true);
            expect(gtmService.trackConversion).toHaveBeenCalledWith(
                'purchase',
                expect.objectContaining({
                    event_category: 'ecommerce',
                    event_label: 'shopping_purchase',
                    value: 6500,
                    currency: 'JPY',
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            item_id: 'tour_night-tour',
                            item_name: 'Kyoto Night Tour'
                        })
                    ]),
                    user_data: mockCustomerData
                }),
                mockCustomerData,
                expect.any(Object)
            );
        });
    });

    describe('_trackShoppingSpecificConversion', () => {
        test('should track shopping-specific conversion event', async () => {
            const productData = {
                product_id: 'tour_night-tour',
                item_name: 'Kyoto Night Tour',
                item_category: 'Tours',
                price: 6500,
                quantity: 1,
                value: 6500,
                currency: 'JPY',
                merchant_id: 'TEST_MERCHANT_123',
                campaign_id: 'camp_123',
                location: 'Kyoto, Japan',
                booking_date: '2025-08-28',
                booking_time: '18:00'
            };

            const result = await shoppingConversionService._trackShoppingSpecificConversion(
                'purchase',
                'night-tour',
                productData,
                mockShoppingData
            );

            expect(result).toBe(true);
            expect(gtmService.pushEvent).toHaveBeenCalledWith('shopping_conversion', expect.objectContaining({
                event: 'shopping_conversion',
                conversion_type: 'purchase',
                conversion_label: 'shopping_purchase_label',
                product_id: 'tour_night-tour',
                product_title: 'Kyoto Night Tour',
                conversion_value: 6500,
                currency: 'JPY',
                tour_type: 'night-tour',
                feed_id: 'feed_001',
                feed_item_id: 'item_001'
            }));
        });
    });
});