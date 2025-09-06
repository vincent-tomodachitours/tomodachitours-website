/**
 * Shopping Campaign Conversion Service
 * Handles product-specific conversion tracking for Google Shopping campaigns
 * Integrates with Google Ads conversion tracking and enhanced conversions
 */

import gtmService from '../gtmService.js';
import dynamicRemarketingService from './dynamicRemarketingService.js';
import { getTour } from '../toursService.js';

class ShoppingConversionService {
    constructor() {
        this.currency = 'JPY';
        this.merchantId = process.env.REACT_APP_GOOGLE_MERCHANT_ID;

        // Shopping-specific conversion labels
        this.conversionLabels = {
            purchase: process.env.REACT_APP_SHOPPING_PURCHASE_LABEL || 'shopping_purchase',
            add_to_cart: process.env.REACT_APP_SHOPPING_ADD_TO_CART_LABEL || 'shopping_add_to_cart',
            view_item: process.env.REACT_APP_SHOPPING_VIEW_ITEM_LABEL || 'shopping_view_item'
        };

        // Product category mapping for Shopping campaigns
        this.productCategories = {
            'night-tour': {
                category: 'Arts & Entertainment > Events & Attractions > Tours',
                subcategory: 'Night Tours',
                location: 'Fushimi Inari, Kyoto'
            },
            'morning-tour': {
                category: 'Arts & Entertainment > Events & Attractions > Tours',
                subcategory: 'Morning Tours',
                location: 'Arashiyama & Fushimi Inari, Kyoto'
            },
            'uji-tour': {
                category: 'Arts & Entertainment > Events & Attractions > Cultural Tours',
                subcategory: 'Cultural Experience Tours',
                location: 'Uji, Kyoto'
            },
            'gion-tour': {
                category: 'Arts & Entertainment > Events & Attractions > Walking Tours',
                subcategory: 'Historical Walking Tours',
                location: 'Gion District, Kyoto'
            }
        };
    }

    /**
     * Track Shopping campaign purchase conversion
     * @param {string} tourKey - Tour identifier
     * @param {Object} transactionData - Transaction data
     * @param {Object} shoppingData - Shopping campaign specific data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    async trackShoppingPurchase(tourKey, transactionData, shoppingData = {}, customerData = null) {
        try {
            // Get tour data
            const tourData = await getTour(tourKey);
            if (!tourData) {
                console.error(`Shopping Conversion: Tour data not found for ${tourKey}`);
                return false;
            }

            // Prepare product-specific conversion data
            const productConversionData = await this._prepareProductConversionData(
                tourKey,
                tourData,
                transactionData,
                shoppingData
            );

            // Track standard purchase conversion with product data
            const standardConversionSuccess = await this._trackStandardShoppingConversion(
                'purchase',
                productConversionData,
                customerData
            );

            // Track dynamic remarketing purchase
            const remarketingSuccess = await dynamicRemarketingService.trackPurchase(
                tourKey,
                transactionData,
                tourData
            );

            // Track Shopping-specific conversion event
            const shoppingConversionSuccess = await this._trackShoppingSpecificConversion(
                'purchase',
                tourKey,
                productConversionData,
                shoppingData
            );

            // Log conversion tracking results
            console.log('Shopping Conversion Tracking Results:', {
                standardConversion: standardConversionSuccess,
                remarketing: remarketingSuccess,
                shoppingSpecific: shoppingConversionSuccess,
                tourKey,
                transactionId: transactionData.transaction_id
            });

            return standardConversionSuccess && remarketingSuccess && shoppingConversionSuccess;

        } catch (error) {
            console.error('Shopping Conversion: Error tracking purchase:', error);
            return false;
        }
    }

    /**
     * Track Shopping campaign add to cart conversion
     * @param {string} tourKey - Tour identifier
     * @param {Object} cartData - Cart data
     * @param {Object} shoppingData - Shopping campaign specific data
     */
    async trackShoppingAddToCart(tourKey, cartData, shoppingData = {}) {
        try {
            // Get tour data
            const tourData = await getTour(tourKey);
            if (!tourData) {
                console.error(`Shopping Conversion: Tour data not found for ${tourKey}`);
                return false;
            }

            // Prepare product-specific conversion data
            const productConversionData = await this._prepareProductConversionData(
                tourKey,
                tourData,
                cartData,
                shoppingData
            );

            // Track standard add to cart conversion
            const standardConversionSuccess = await this._trackStandardShoppingConversion(
                'add_to_cart',
                productConversionData
            );

            // Track dynamic remarketing add to cart
            const remarketingSuccess = await dynamicRemarketingService.trackAddToCart(
                tourKey,
                cartData,
                tourData
            );

            // Track Shopping-specific conversion event
            const shoppingConversionSuccess = await this._trackShoppingSpecificConversion(
                'add_to_cart',
                tourKey,
                productConversionData,
                shoppingData
            );

            console.log('Shopping Add to Cart Tracking Results:', {
                standardConversion: standardConversionSuccess,
                remarketing: remarketingSuccess,
                shoppingSpecific: shoppingConversionSuccess,
                tourKey
            });

            return standardConversionSuccess && remarketingSuccess && shoppingConversionSuccess;

        } catch (error) {
            console.error('Shopping Conversion: Error tracking add to cart:', error);
            return false;
        }
    }

    /**
     * Track Shopping campaign view item conversion
     * @param {string} tourKey - Tour identifier
     * @param {Object} viewData - View data
     * @param {Object} shoppingData - Shopping campaign specific data
     */
    async trackShoppingViewItem(tourKey, viewData = {}, shoppingData = {}) {
        try {
            // Get tour data
            const tourData = await getTour(tourKey);
            if (!tourData) {
                console.error(`Shopping Conversion: Tour data not found for ${tourKey}`);
                return false;
            }

            // Prepare product-specific conversion data
            const productConversionData = await this._prepareProductConversionData(
                tourKey,
                tourData,
                viewData,
                shoppingData
            );

            // Track standard view item conversion
            const standardConversionSuccess = await this._trackStandardShoppingConversion(
                'view_item',
                productConversionData
            );

            // Track dynamic remarketing view item
            const remarketingSuccess = await dynamicRemarketingService.trackViewItem(
                tourKey,
                tourData,
                viewData
            );

            // Track Shopping-specific conversion event
            const shoppingConversionSuccess = await this._trackShoppingSpecificConversion(
                'view_item',
                tourKey,
                productConversionData,
                shoppingData
            );

            console.log('Shopping View Item Tracking Results:', {
                standardConversion: standardConversionSuccess,
                remarketing: remarketingSuccess,
                shoppingSpecific: shoppingConversionSuccess,
                tourKey
            });

            return standardConversionSuccess && remarketingSuccess && shoppingConversionSuccess;

        } catch (error) {
            console.error('Shopping Conversion: Error tracking view item:', error);
            return false;
        }
    }



    /**
     * Prepare product-specific conversion data
     * @private
     */
    async _prepareProductConversionData(tourKey, tourData, eventData, shoppingData) {
        const productCategory = this.productCategories[tourKey] || this.productCategories['night-tour'];

        // Calculate values
        const quantity = eventData.participants || eventData.quantity || 1;
        const unitPrice = tourData['tour-price'];
        const totalValue = eventData.amount || (unitPrice * quantity);

        // Generate product ID
        const productId = eventData.booking_date && eventData.booking_time
            ? `tour_${tourKey}_${eventData.booking_date}_${eventData.booking_time.replace(':', '')}`
            : `tour_${tourKey}`;

        return {
            // Product identification
            product_id: productId,
            item_id: productId,
            item_name: tourData['tour-title'],
            item_category: productCategory.category,
            item_category2: productCategory.subcategory,
            item_category3: productCategory.location,
            item_brand: 'Tomodachi Tours',

            // Pricing
            price: unitPrice,
            quantity: quantity,
            value: totalValue,
            currency: this.currency,

            // Shopping campaign specific
            merchant_id: this.merchantId,
            campaign_id: shoppingData.campaign_id,
            ad_group_id: shoppingData.ad_group_id,

            // Tour specific attributes
            tour_type: tourKey,
            tour_duration: tourData['tour-duration'],
            max_participants: tourData['max-participants'],
            location: productCategory.location,

            // Booking details
            booking_date: eventData.booking_date || eventData.date,
            booking_time: eventData.booking_time || eventData.time,

            // Attribution
            gclid: shoppingData.gclid || eventData.gclid,
            gbraid: shoppingData.gbraid || eventData.gbraid,
            wbraid: shoppingData.wbraid || eventData.wbraid,

            // Transaction details
            transaction_id: eventData.transaction_id,
            payment_method: eventData.payment_method,
            coupon_code: eventData.coupon_code || eventData.couponCode,
            discount_amount: eventData.discount_amount || eventData.discountAmount || 0
        };
    }

    /**
     * Track standard Shopping conversion through GTM
     * @private
     */
    async _trackStandardShoppingConversion(conversionType, productData, customerData = null) {
        try {
            // Prepare conversion event data
            const conversionEventData = {
                event_category: 'ecommerce',
                event_label: `shopping_${conversionType}`,
                value: productData.value,
                currency: productData.currency,

                // Product data
                items: [{
                    item_id: productData.item_id,
                    item_name: productData.item_name,
                    item_category: productData.item_category,
                    item_category2: productData.item_category2,
                    item_category3: productData.item_category3,
                    item_brand: productData.item_brand,
                    price: productData.price,
                    quantity: productData.quantity
                }],

                // Shopping specific data
                merchant_id: productData.merchant_id,
                campaign_id: productData.campaign_id,
                ad_group_id: productData.ad_group_id,

                // Attribution data
                gclid: productData.gclid,
                gbraid: productData.gbraid,
                wbraid: productData.wbraid,

                // Transaction data (for purchase)
                transaction_id: productData.transaction_id,
                coupon: productData.coupon_code,

                // Customer data for enhanced conversions
                ...(customerData && { user_data: customerData })
            };

            // Track through GTM service
            const success = gtmService.trackConversion(
                conversionType,
                conversionEventData,
                customerData,
                {
                    campaign: productData.campaign_id,
                    adGroup: productData.ad_group_id,
                    gclid: productData.gclid,
                    productId: productData.product_id,
                    productName: productData.item_name,
                    productCategory: productData.item_category
                }
            );

            return success;

        } catch (error) {
            console.error('Shopping Conversion: Error tracking standard conversion:', error);
            return false;
        }
    }

    /**
     * Track Shopping-specific conversion event
     * @private
     */
    async _trackShoppingSpecificConversion(conversionType, tourKey, productData, shoppingData) {
        try {
            // Shopping conversion tracking removed

            // Shopping conversion tracking removed

            return true;

        } catch (error) {
            console.error('Shopping Conversion: Error tracking Shopping-specific conversion:', error);
            return false;
        }
    }

    /**
     * Get Shopping campaign performance data
     * @param {string} tourKey - Tour identifier (optional)
     * @param {Object} dateRange - Date range for performance data
     */
    getShoppingPerformanceData(tourKey = null, dateRange = {}) {
        // This would typically integrate with Google Ads API
        // For now, return placeholder structure
        return {
            tourKey,
            dateRange,
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
        };
    }

    /**
     * Validate Shopping campaign setup
     * @param {string} tourKey - Tour identifier
     */
    async validateShoppingSetup(tourKey) {
        try {
            const tourData = await getTour(tourKey);
            const validation = {
                valid: true,
                errors: [],
                warnings: []
            };

            // Check tour data
            if (!tourData) {
                validation.errors.push(`Tour data not found for ${tourKey}`);
                validation.valid = false;
            }

            // Check merchant ID
            if (!this.merchantId) {
                validation.errors.push('Google Merchant ID not configured');
                validation.valid = false;
            }

            // Check conversion labels
            Object.entries(this.conversionLabels).forEach(([type, label]) => {
                if (!label || label.includes('placeholder')) {
                    validation.warnings.push(`Conversion label for ${type} appears to be placeholder`);
                }
            });

            // Check product category mapping
            if (!this.productCategories[tourKey]) {
                validation.warnings.push(`Product category mapping not found for ${tourKey}`);
            }

            return validation;

        } catch (error) {
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: []
            };
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            merchantId: this.merchantId,
            currency: this.currency,
            conversionLabels: this.conversionLabels,
            productCategories: Object.keys(this.productCategories),
            gtmServiceStatus: gtmService.getStatus()
        };
    }
}

// Create singleton instance
const shoppingConversionService = new ShoppingConversionService();

export default shoppingConversionService;