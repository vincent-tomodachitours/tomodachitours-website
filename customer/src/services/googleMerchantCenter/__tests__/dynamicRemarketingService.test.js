/**
 * Unit tests for Dynamic Remarketing Service
 */

import dynamicRemarketingService from '../dynamicRemarketingService.js';
import gtmService from '../../gtmService.js';
import { getTour, fetchTours } from '../../toursService.js';

// Mock dependencies
jest.mock('../../gtmService.js');
jest.mock('../../toursService.js');

describe('DynamicRemarketingService', () => {
    const mockTourData = {
        'tour-title': 'Kyoto Night Tour',
        'tour-description': 'Amazing night tour experience',
        'tour-price': 6500,
        'tour-duration': '90-120 minutes',
        'reviews': 178,
        'time-slots': ['17:00', '18:00', '19:00'],
        'max-participants': 12
    };

    const mockTours = {
        'night-tour': mockTourData,
        'morning-tour': {
            'tour-title': 'Kyoto Morning Tour',
            'tour-price': 14500,
            'tour-duration': '4.5 hours',
            'reviews': 108,
            'max-participants': 9
        }
    };

    beforeEach(() => {
        getTour.mockResolvedValue(mockTourData);
        fetchTours.mockResolvedValue(mockTours);
        gtmService.pushEvent.mockClear();

        // Clear cache before each test
        dynamicRemarketingService.clearCache();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackViewItem', () => {
        test('should track view item event successfully', async () => {
            const result = await dynamicRemarketingService.trackViewItem('night-tour', mockTourData);

            expect(result).toBe(true);
            expect(gtmService.pushEvent).toHaveBeenCalledTimes(2); // view_item + dynamic_remarketing

            const viewItemCall = gtmService.pushEvent.mock.calls[0];
            expect(viewItemCall[0]).toBe('view_item');
            expect(viewItemCall[1]).toMatchObject({
                event_category: 'ecommerce',
                event_label: 'night-tour',
                value: 6500,
                currency: 'JPY',
                ecomm_prodid: 'tour_night-tour',
                ecomm_pagetype: 'product'
            });
        });

        test('should fetch tour data if not provided', async () => {
            const result = await dynamicRemarketingService.trackViewItem('night-tour');

            expect(getTour).toHaveBeenCalledWith('night-tour');
            expect(result).toBe(true);
        });

        test('should handle missing tour data', async () => {
            getTour.mockResolvedValue(null);

            const result = await dynamicRemarketingService.trackViewItem('invalid-tour');

            expect(result).toBe(false);
            expect(gtmService.pushEvent).not.toHaveBeenCalled();
        });

        test('should include context data in event', async () => {
            const context = {
                booking_date: '2025-08-28',
                booking_time: '18:00',
                source: 'search'
            };

            await dynamicRemarketingService.trackViewItem('night-tour', mockTourData, context);

            const viewItemCall = gtmService.pushEvent.mock.calls[0];
            expect(viewItemCall[1]).toMatchObject(context);
        });

        test('should handle errors gracefully', async () => {
            getTour.mockRejectedValue(new Error('Service error'));

            const result = await dynamicRemarketingService.trackViewItem('night-tour');

            expect(result).toBe(false);
        });
    });

    describe('trackViewItemList', () => {
        test('should track view item list for multiple tours', async () => {
            const tourKeys = ['night-tour', 'morning-tour'];
            const result = await dynamicRemarketingService.trackViewItemList(tourKeys);

            expect(result).toBe(true);
            expect(gtmService.pushEvent).toHaveBeenCalledTimes(2); // view_item_list + dynamic_remarketing

            const viewItemListCall = gtmService.pushEvent.mock.calls[0];
            expect(viewItemListCall[0]).toBe('view_item_list');
            expect(viewItemListCall[1]).toMatchObject({
                event_category: 'ecommerce',
                event_label: 'tours_list',
                value: 21000, // 6500 + 14500
                currency: 'JPY',
                ecomm_pagetype: 'category'
            });
            expect(viewItemListCall[1].items).toHaveLength(2);
        });

        test('should handle empty tour list', async () => {
            const result = await dynamicRemarketingService.trackViewItemList([]);

            expect(result).toBe(false);
            expect(gtmService.pushEvent).not.toHaveBeenCalled();
        });

        test('should filter out invalid tours', async () => {
            const tourKeys = ['night-tour', 'invalid-tour', 'morning-tour'];
            const result = await dynamicRemarketingService.trackViewItemList(tourKeys);

            expect(result).toBe(true);
            const viewItemListCall = gtmService.pushEvent.mock.calls[0];
            expect(viewItemListCall[1].items).toHaveLength(2); // Only valid tours
        });
    });

    describe('trackAddToCart', () => {
        test('should track add to cart with booking data', async () => {
            const bookingData = {
                participants: 2,
                date: '2025-08-28',
                time: '18:00'
            };

            const result = await dynamicRemarketingService.trackAddToCart('night-tour', bookingData, mockTourData);

            expect(result).toBe(true);
            expect(gtmService.pushEvent).toHaveBeenCalledTimes(2);

            const addToCartCall = gtmService.pushEvent.mock.calls[0];
            expect(addToCartCall[0]).toBe('add_to_cart');
            expect(addToCartCall[1]).toMatchObject({
                event_category: 'ecommerce',
                event_label: 'night-tour',
                value: 13000, // 6500 * 2 participants
                currency: 'JPY',
                booking_date: '2025-08-28',
                booking_time: '18:00',
                participants: 2
            });
        });

        test('should default to 1 participant if not specified', async () => {
            const bookingData = { date: '2025-08-28', time: '18:00' };

            await dynamicRemarketingService.trackAddToCart('night-tour', bookingData, mockTourData);

            const addToCartCall = gtmService.pushEvent.mock.calls[0];
            expect(addToCartCall[1].value).toBe(6500); // Single participant price
            expect(addToCartCall[1].participants).toBe(1);
        });
    });

    describe('trackBeginCheckout', () => {
        test('should track begin checkout with discount', async () => {
            const checkoutData = {
                participants: 2,
                date: '2025-08-28',
                time: '18:00',
                discountAmount: 1000,
                paymentMethod: 'stripe'
            };

            const result = await dynamicRemarketingService.trackBeginCheckout('night-tour', checkoutData, mockTourData);

            expect(result).toBe(true);

            const beginCheckoutCall = gtmService.pushEvent.mock.calls[0];
            expect(beginCheckoutCall[0]).toBe('begin_checkout');
            expect(beginCheckoutCall[1]).toMatchObject({
                value: 12000, // (6500 * 2) - 1000 discount
                participants: 2,
                payment_method: 'stripe'
            });
        });
    });

    describe('trackPurchase', () => {
        test('should track purchase with transaction data', async () => {
            const transactionData = {
                participants: 1,
                date: '2025-08-28',
                time: '18:00',
                amount: 6500,
                transaction_id: 'txn_123456',
                paymentMethod: 'stripe'
            };

            const result = await dynamicRemarketingService.trackPurchase('night-tour', transactionData, mockTourData);

            expect(result).toBe(true);

            const purchaseCall = gtmService.pushEvent.mock.calls[0];
            expect(purchaseCall[0]).toBe('purchase');
            expect(purchaseCall[1]).toMatchObject({
                value: 6500,
                currency: 'JPY',
                transaction_id: 'txn_123456',
                booking_date: '2025-08-28',
                booking_time: '18:00',
                participants: 1,
                payment_method: 'stripe'
            });
        });
    });

    describe('trackViewSearchResults', () => {
        test('should track search results with query and results', async () => {
            const searchQuery = 'night tour kyoto';
            const resultTourKeys = ['night-tour', 'morning-tour'];

            const result = await dynamicRemarketingService.trackViewSearchResults(searchQuery, resultTourKeys);

            expect(result).toBe(true);

            const searchCall = gtmService.pushEvent.mock.calls[0];
            expect(searchCall[0]).toBe('view_search_results');
            expect(searchCall[1]).toMatchObject({
                event_category: 'search',
                event_label: searchQuery,
                search_term: searchQuery,
                search_results_count: 2
            });
        });

        test('should handle empty search results', async () => {
            const result = await dynamicRemarketingService.trackViewSearchResults('invalid query', []);

            expect(result).toBe(true);

            const searchCall = gtmService.pushEvent.mock.calls[0];
            expect(searchCall[1].search_results_count).toBe(0);
            expect(searchCall[1].items).toEqual([]);
        });
    });

    describe('_prepareProductData', () => {
        test('should prepare product data with correct structure', async () => {
            const context = {
                quantity: 2,
                booking_date: '2025-08-28',
                booking_time: '18:00'
            };

            const productData = await dynamicRemarketingService._prepareProductData('night-tour', mockTourData, context);

            expect(productData).toMatchObject({
                item_id: 'tour_night-tour_2025-08-28_1800',
                item_name: 'Kyoto Night Tour',
                item_category: 'Tours',
                item_brand: 'Tomodachi Tours',
                price: 6500,
                quantity: 2,
                currency: 'JPY',
                booking_date: '2025-08-28',
                booking_time: '18:00'
            });
        });

        test('should cache product data', async () => {
            const context = { quantity: 1 };

            // First call
            const productData1 = await dynamicRemarketingService._prepareProductData('night-tour', mockTourData, context);

            // Second call with same parameters should use cache
            const productData2 = await dynamicRemarketingService._prepareProductData('night-tour', mockTourData, context);

            expect(productData1).toEqual(productData2);

            // Check cache stats
            const cacheStats = dynamicRemarketingService.getCacheStats();
            expect(cacheStats.size).toBeGreaterThan(0);
        });
    });

    describe('clearCache', () => {
        test('should clear product cache', async () => {
            // Add something to cache
            await dynamicRemarketingService._prepareProductData('night-tour', mockTourData, {});

            let cacheStats = dynamicRemarketingService.getCacheStats();
            expect(cacheStats.size).toBeGreaterThan(0);

            // Clear cache
            dynamicRemarketingService.clearCache();

            cacheStats = dynamicRemarketingService.getCacheStats();
            expect(cacheStats.size).toBe(0);
        });
    });

    describe('getStatus', () => {
        test('should return service status', () => {
            const status = dynamicRemarketingService.getStatus();

            expect(status).toMatchObject({
                businessType: 'travel',
                currency: 'JPY',
                country: 'JP',
                eventTypes: expect.any(Object),
                cacheSize: expect.any(Number),
                cacheExpiry: expect.any(Number)
            });
        });
    });

    describe('_getPageType', () => {
        test('should return correct page types for events', () => {
            expect(dynamicRemarketingService._getPageType('view_item')).toBe('product');
            expect(dynamicRemarketingService._getPageType('view_item_list')).toBe('category');
            expect(dynamicRemarketingService._getPageType('add_to_cart')).toBe('cart');
            expect(dynamicRemarketingService._getPageType('begin_checkout')).toBe('checkout');
            expect(dynamicRemarketingService._getPageType('purchase')).toBe('purchase');
            expect(dynamicRemarketingService._getPageType('view_search_results')).toBe('searchresults');
            expect(dynamicRemarketingService._getPageType('unknown')).toBe('other');
        });
    });
});