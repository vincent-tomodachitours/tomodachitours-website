/**
 * Dynamic Remarketing Service for Google Merchant Center
 * Implements product-level data tracking for Shopping campaigns
 * Integrates with GTM for dynamic remarketing events
 */

import gtmService from '../gtmService.js';
import { fetchTours, getTour } from '../toursService.js';

class DynamicRemarketingService {
    constructor() {
        this.businessType = 'travel'; // Google Ads business type for tours
        this.currency = 'JPY';
        this.country = 'JP';

        // Dynamic remarketing event types
        this.eventTypes = {
            VIEW_ITEM: 'view_item',
            VIEW_ITEM_LIST: 'view_item_list',
            SELECT_ITEM: 'select_item',
            ADD_TO_CART: 'add_to_cart',
            BEGIN_CHECKOUT: 'begin_checkout',
            PURCHASE: 'purchase',
            VIEW_SEARCH_RESULTS: 'view_search_results'
        };

        // Product data cache
        this.productCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Track view item event for dynamic remarketing
     * @param {string} tourKey - Tour identifier (e.g., 'night-tour')
     * @param {Object} tourData - Tour data
     * @param {Object} context - Additional context (date, time, etc.)
     */
    async trackViewItem(tourKey, tourData = null, context = {}) {
        try {
            // Get tour data if not provided
            if (!tourData) {
                tourData = await getTour(tourKey);
            }

            if (!tourData) {
                console.warn(`Dynamic Remarketing: Tour data not found for ${tourKey}`);
                return false;
            }

            // Prepare product data
            const productData = await this._prepareProductData(tourKey, tourData, context);

            // Prepare remarketing event data
            const eventData = {
                event_category: 'ecommerce',
                event_label: tourKey,
                value: tourData['tour-price'],
                currency: this.currency,

                // Dynamic remarketing specific data
                ecomm_prodid: productData.id,
                ecomm_pagetype: 'product',
                ecomm_totalvalue: tourData['tour-price'],

                // Enhanced ecommerce data
                items: [productData],

                // Custom parameters for tours
                tour_type: tourKey,
                tour_location: 'Kyoto',
                tour_duration: tourData['tour-duration'],
                max_participants: tourData['max-participants'],

                // Context data
                ...context
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.VIEW_ITEM, eventData);

            // Also push dynamic remarketing specific event
            this._pushDynamicRemarketingEvent('view_item', productData, eventData);

            console.log(`Dynamic Remarketing: Tracked view_item for ${tourKey}`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking view_item:', error);
            return false;
        }
    }

    /**
     * Track view item list event (e.g., tours page)
     * @param {Array} tourKeys - Array of tour identifiers
     * @param {Object} context - Additional context
     */
    async trackViewItemList(tourKeys = [], context = {}) {
        try {
            const tours = await fetchTours();
            const items = [];
            let totalValue = 0;

            // Prepare product data for each tour
            for (const tourKey of tourKeys) {
                const tourData = tours[tourKey];
                if (tourData) {
                    const productData = await this._prepareProductData(tourKey, tourData, context);
                    items.push(productData);
                    totalValue += tourData['tour-price'];
                }
            }

            if (items.length === 0) {
                console.warn('Dynamic Remarketing: No valid tours found for view_item_list');
                return false;
            }

            // Prepare event data
            const eventData = {
                event_category: 'ecommerce',
                event_label: 'tours_list',
                value: totalValue,
                currency: this.currency,

                // Dynamic remarketing data
                ecomm_prodid: items.map(item => item.item_id),
                ecomm_pagetype: 'category',
                ecomm_totalvalue: totalValue,

                // Enhanced ecommerce data
                items: items,
                item_list_name: context.listName || 'Tours',
                item_list_id: context.listId || 'tours_main',

                // Context data
                ...context
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.VIEW_ITEM_LIST, eventData);

            // Push dynamic remarketing event
            this._pushDynamicRemarketingEvent('view_item_list', items, eventData);

            console.log(`Dynamic Remarketing: Tracked view_item_list for ${items.length} tours`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking view_item_list:', error);
            return false;
        }
    }

    /**
     * Track add to cart event (begin booking process)
     * @param {string} tourKey - Tour identifier
     * @param {Object} bookingData - Booking data (date, time, participants)
     * @param {Object} tourData - Tour data
     */
    async trackAddToCart(tourKey, bookingData, tourData = null) {
        try {
            // Get tour data if not provided
            if (!tourData) {
                tourData = await getTour(tourKey);
            }

            if (!tourData) {
                console.warn(`Dynamic Remarketing: Tour data not found for ${tourKey}`);
                return false;
            }

            // Calculate total value based on participants
            const participants = bookingData.participants || 1;
            const totalValue = tourData['tour-price'] * participants;

            // Prepare product data
            const productData = await this._prepareProductData(tourKey, tourData, {
                quantity: participants,
                booking_date: bookingData.date,
                booking_time: bookingData.time
            });

            // Update quantity and price
            productData.quantity = participants;
            productData.price = totalValue;

            // Prepare event data
            const eventData = {
                event_category: 'ecommerce',
                event_label: tourKey,
                value: totalValue,
                currency: this.currency,

                // Dynamic remarketing data
                ecomm_prodid: productData.item_id,
                ecomm_pagetype: 'cart',
                ecomm_totalvalue: totalValue,

                // Enhanced ecommerce data
                items: [productData],

                // Booking specific data
                booking_date: bookingData.date,
                booking_time: bookingData.time,
                participants: participants
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.ADD_TO_CART, eventData);

            // Push dynamic remarketing event
            this._pushDynamicRemarketingEvent('add_to_cart', productData, eventData);

            console.log(`Dynamic Remarketing: Tracked add_to_cart for ${tourKey}`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking add_to_cart:', error);
            return false;
        }
    }

    /**
     * Track begin checkout event
     * @param {string} tourKey - Tour identifier
     * @param {Object} checkoutData - Checkout data
     * @param {Object} tourData - Tour data
     */
    async trackBeginCheckout(tourKey, checkoutData, tourData = null) {
        try {
            // Get tour data if not provided
            if (!tourData) {
                tourData = await getTour(tourKey);
            }

            if (!tourData) {
                console.warn(`Dynamic Remarketing: Tour data not found for ${tourKey}`);
                return false;
            }

            // Calculate total value
            const participants = checkoutData.participants || 1;
            const basePrice = tourData['tour-price'] * participants;
            const discountAmount = checkoutData.discountAmount || 0;
            const totalValue = basePrice - discountAmount;

            // Prepare product data
            const productData = await this._prepareProductData(tourKey, tourData, {
                quantity: participants,
                booking_date: checkoutData.date,
                booking_time: checkoutData.time,
                discount_amount: discountAmount
            });

            // Update product data with checkout info
            productData.quantity = participants;
            productData.price = totalValue;
            productData.discount = discountAmount;

            // Prepare event data
            const eventData = {
                event_category: 'ecommerce',
                event_label: tourKey,
                value: totalValue,
                currency: this.currency,

                // Dynamic remarketing data
                ecomm_prodid: productData.item_id,
                ecomm_pagetype: 'checkout',
                ecomm_totalvalue: totalValue,

                // Enhanced ecommerce data
                items: [productData],
                coupon: checkoutData.couponCode || undefined,

                // Checkout specific data
                booking_date: checkoutData.date,
                booking_time: checkoutData.time,
                participants: participants,
                payment_method: checkoutData.paymentMethod
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.BEGIN_CHECKOUT, eventData);

            // Push dynamic remarketing event
            this._pushDynamicRemarketingEvent('begin_checkout', productData, eventData);

            console.log(`Dynamic Remarketing: Tracked begin_checkout for ${tourKey}`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking begin_checkout:', error);
            return false;
        }
    }

    /**
     * Track purchase event
     * @param {string} tourKey - Tour identifier
     * @param {Object} transactionData - Transaction data
     * @param {Object} tourData - Tour data
     */
    async trackPurchase(tourKey, transactionData, tourData = null) {
        try {
            // Get tour data if not provided
            if (!tourData) {
                tourData = await getTour(tourKey);
            }

            if (!tourData) {
                console.warn(`Dynamic Remarketing: Tour data not found for ${tourKey}`);
                return false;
            }

            // Prepare product data
            const productData = await this._prepareProductData(tourKey, tourData, {
                quantity: transactionData.participants || 1,
                booking_date: transactionData.date,
                booking_time: transactionData.time,
                transaction_id: transactionData.transaction_id
            });

            // Update product data with transaction info
            productData.quantity = transactionData.participants || 1;
            productData.price = transactionData.amount;

            // Prepare event data
            const eventData = {
                event_category: 'ecommerce',
                event_label: tourKey,
                value: transactionData.amount,
                currency: this.currency,
                transaction_id: transactionData.transaction_id,

                // Dynamic remarketing data
                ecomm_prodid: productData.item_id,
                ecomm_pagetype: 'purchase',
                ecomm_totalvalue: transactionData.amount,

                // Enhanced ecommerce data
                items: [productData],
                coupon: transactionData.couponCode || undefined,

                // Transaction specific data
                booking_date: transactionData.date,
                booking_time: transactionData.time,
                participants: transactionData.participants,
                payment_method: transactionData.paymentMethod
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.PURCHASE, eventData);

            // Push dynamic remarketing event
            this._pushDynamicRemarketingEvent('purchase', productData, eventData);

            console.log(`Dynamic Remarketing: Tracked purchase for ${tourKey}`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking purchase:', error);
            return false;
        }
    }

    /**
     * Track search results view
     * @param {string} searchQuery - Search query
     * @param {Array} resultTourKeys - Array of tour keys in results
     * @param {Object} context - Additional context
     */
    async trackViewSearchResults(searchQuery, resultTourKeys = [], context = {}) {
        try {
            const tours = await fetchTours();
            const items = [];

            // Prepare product data for search results
            for (const tourKey of resultTourKeys) {
                const tourData = tours[tourKey];
                if (tourData) {
                    const productData = await this._prepareProductData(tourKey, tourData, {
                        search_query: searchQuery,
                        search_position: items.length + 1
                    });
                    items.push(productData);
                }
            }

            // Prepare event data
            const eventData = {
                event_category: 'search',
                event_label: searchQuery,
                search_term: searchQuery,

                // Dynamic remarketing data
                ecomm_prodid: items.map(item => item.item_id),
                ecomm_pagetype: 'searchresults',

                // Enhanced ecommerce data
                items: items,

                // Search specific data
                search_results_count: items.length,
                ...context
            };

            // Push to GTM dataLayer
            gtmService.pushEvent(this.eventTypes.VIEW_SEARCH_RESULTS, eventData);

            console.log(`Dynamic Remarketing: Tracked search results for "${searchQuery}"`);
            return true;

        } catch (error) {
            console.error('Dynamic Remarketing: Error tracking search results:', error);
            return false;
        }
    }

    /**
     * Prepare product data for remarketing events
     * @private
     */
    async _prepareProductData(tourKey, tourData, context = {}) {
        const cacheKey = `${tourKey}_${JSON.stringify(context)}`;

        // Check cache first
        if (this.productCache.has(cacheKey)) {
            const cached = this.productCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        // Generate product ID
        const productId = context.booking_date && context.booking_time
            ? `tour_${tourKey}_${context.booking_date}_${context.booking_time.replace(':', '')}`
            : `tour_${tourKey}`;

        // Prepare product data
        const productData = {
            item_id: productId,
            item_name: tourData['tour-title'],
            item_category: 'Tours',
            item_category2: 'Walking Tours',
            item_category3: 'Kyoto',
            item_brand: 'Tomodachi Tours',
            price: tourData['tour-price'],
            quantity: context.quantity || 1,
            currency: this.currency,

            // Tour specific attributes
            item_variant: tourKey,
            location_id: 'kyoto_japan',

            // Custom parameters
            tour_duration: tourData['tour-duration'],
            max_participants: tourData['max-participants'],
            reviews_count: tourData.reviews || 0,

            // Context specific data
            booking_date: context.booking_date || null,
            booking_time: context.booking_time || null,
            search_query: context.search_query || null,
            search_position: context.search_position || null,
            discount_amount: context.discount_amount || 0
        };

        // Cache the result
        this.productCache.set(cacheKey, {
            data: productData,
            timestamp: Date.now()
        });

        return productData;
    }

    /**
     * Push dynamic remarketing specific event to dataLayer
     * @private
     */
    _pushDynamicRemarketingEvent(eventType, productData, eventData) {
        try {
            // Prepare dynamic remarketing event
            const remarketingEvent = {
                event: 'dynamic_remarketing',
                event_name: eventType,
                business_type: this.businessType,

                // Product data for remarketing
                ecomm_prodid: Array.isArray(productData)
                    ? productData.map(p => p.item_id)
                    : [productData.item_id],
                ecomm_pagetype: this._getPageType(eventType),
                ecomm_totalvalue: eventData.value || 0,

                // Additional remarketing data
                custom_parameters: {
                    tour_location: 'kyoto',
                    business_country: this.country,
                    currency: this.currency
                }
            };

            // Push to dataLayer
            gtmService.pushEvent('dynamic_remarketing', remarketingEvent);

        } catch (error) {
            console.error('Dynamic Remarketing: Error pushing remarketing event:', error);
        }
    }

    /**
     * Get page type for dynamic remarketing
     * @private
     */
    _getPageType(eventType) {
        const pageTypeMap = {
            'view_item': 'product',
            'view_item_list': 'category',
            'add_to_cart': 'cart',
            'begin_checkout': 'checkout',
            'purchase': 'purchase',
            'view_search_results': 'searchresults'
        };

        return pageTypeMap[eventType] || 'other';
    }

    /**
     * Clear product cache
     */
    clearCache() {
        this.productCache.clear();
        console.log('Dynamic Remarketing: Product cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.productCache.size,
            entries: Array.from(this.productCache.keys())
        };
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            businessType: this.businessType,
            currency: this.currency,
            country: this.country,
            eventTypes: this.eventTypes,
            cacheSize: this.productCache.size,
            cacheExpiry: this.cacheExpiry
        };
    }
}

// Create singleton instance
const dynamicRemarketingService = new DynamicRemarketingService();

export default dynamicRemarketingService;