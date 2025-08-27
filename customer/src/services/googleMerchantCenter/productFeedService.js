/**
 * Google Merchant Center Product Feed Service
 * Generates product feeds for tour offerings with accurate pricing and availability
 * Supports XML and JSON feed formats for Shopping campaigns
 */

import { fetchTours } from '../toursService.js';
import { checkAvailability, getAvailableTimeSlots } from '../toursService.js';

class ProductFeedService {
    constructor() {
        this.baseUrl = process.env.REACT_APP_BASE_URL || 'https://tomodachitours.com';
        this.merchantId = process.env.REACT_APP_GOOGLE_MERCHANT_ID;
        this.feedTitle = 'Tomodachi Tours - Kyoto Walking Tours';
        this.feedDescription = 'Authentic Kyoto walking tours with local guides';
        this.currency = 'JPY';
        this.country = 'JP';
        this.language = 'en';

        // Product categories for Google Shopping
        this.productCategories = {
            'night-tour': 'Arts & Entertainment > Events & Attractions > Tours',
            'morning-tour': 'Arts & Entertainment > Events & Attractions > Tours',
            'uji-tour': 'Arts & Entertainment > Events & Attractions > Cultural Tours',
            'gion-tour': 'Arts & Entertainment > Events & Attractions > Walking Tours'
        };

        // Brand information
        this.brand = 'Tomodachi Tours';
        this.mpn = 'TOMODACHI'; // Manufacturer Part Number prefix
    }

    /**
     * Generate complete product feed in XML format
     * @param {Object} options - Feed generation options
     * @returns {Promise<string>} - XML feed content
     */
    async generateXMLFeed(options = {}) {
        try {
            const tours = await fetchTours();
            const products = await this._generateProductsFromTours(tours, options);

            const xmlFeed = this._buildXMLFeed(products, options);

            console.log(`Product feed generated with ${products.length} products`);
            return xmlFeed;

        } catch (error) {
            console.error('Error generating XML product feed:', error);
            throw error;
        }
    }

    /**
     * Generate complete product feed in JSON format
     * @param {Object} options - Feed generation options
     * @returns {Promise<Object>} - JSON feed content
     */
    async generateJSONFeed(options = {}) {
        try {
            const tours = await fetchTours();
            const products = await this._generateProductsFromTours(tours, options);

            const jsonFeed = {
                version: '1.0',
                title: this.feedTitle,
                description: this.feedDescription,
                link: this.baseUrl,
                updated: new Date().toISOString(),
                products: products
            };

            console.log(`JSON product feed generated with ${products.length} products`);
            return jsonFeed;

        } catch (error) {
            console.error('Error generating JSON product feed:', error);
            throw error;
        }
    }

    /**
     * Generate products from tour data
     * @private
     */
    async _generateProductsFromTours(tours, options = {}) {
        const products = [];
        const includeAvailability = options.includeAvailability !== false;
        const daysAhead = options.daysAhead || 30; // Generate products for next 30 days

        for (const [tourKey, tourData] of Object.entries(tours)) {
            try {
                // Generate base product for the tour
                const baseProduct = await this._createBaseProduct(tourKey, tourData);

                if (includeAvailability && tourData['time-slots']?.length > 0) {
                    // Generate products for each available date/time combination
                    const dateProducts = await this._generateDateSpecificProducts(
                        tourKey,
                        tourData,
                        baseProduct,
                        daysAhead
                    );
                    products.push(...dateProducts);
                } else {
                    // Add base product without specific dates
                    products.push(baseProduct);
                }

            } catch (error) {
                console.error(`Error generating product for tour ${tourKey}:`, error);
                // Continue with other tours
            }
        }

        return products;
    }

    /**
     * Create base product from tour data
     * @private
     */
    async _createBaseProduct(tourKey, tourData) {
        const productId = `tour_${tourKey}`;
        const tourUrl = `${this.baseUrl}/tours/${tourKey}`;
        const imageUrl = this._getTourImageUrl(tourKey);

        return {
            id: productId,
            title: tourData['tour-title'],
            description: this._sanitizeDescription(tourData['tour-description']),
            link: tourUrl,
            image_link: imageUrl,
            availability: 'in stock',
            price: `${tourData['tour-price']} ${this.currency}`,
            brand: this.brand,
            mpn: `${this.mpn}_${tourKey.toUpperCase()}`,
            condition: 'new',
            google_product_category: this.productCategories[tourKey] || this.productCategories['night-tour'],
            product_type: 'Tours > Walking Tours > Kyoto',
            custom_label_0: tourKey,
            custom_label_1: tourData['tour-duration'],
            custom_label_2: `${tourData.reviews || 0} reviews`,
            custom_label_3: `Max ${tourData['max-participants']} people`,
            custom_label_4: 'English Guide',

            // Additional attributes for tours
            service_type: 'tour',
            location: 'Kyoto, Japan',
            duration: tourData['tour-duration'],
            max_participants: tourData['max-participants'],
            language: 'English',
            meeting_point: tourData['meeting-point'] || 'Kyoto Station',

            // SEO and marketing attributes
            promotion_id: options.promotionId || null,
            sale_price: options.salePrice ? `${options.salePrice} ${this.currency}` : null,
            sale_price_effective_date: options.salePriceEffectiveDate || null,

            // Shipping (not applicable for tours, but required by some feeds)
            shipping: [{
                country: this.country,
                service: 'Standard',
                price: '0 JPY'
            }],

            // Additional identifiers
            item_group_id: `tour_group_${tourKey}`,
            adult: 'yes', // Tours are for adults
            age_group: 'adult',
            gender: 'unisex'
        };
    }

    /**
     * Generate date-specific products for tours with time slots
     * @private
     */
    async _generateDateSpecificProducts(tourKey, tourData, baseProduct, daysAhead) {
        const products = [];
        const today = new Date();

        for (let i = 1; i <= daysAhead; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            try {
                // Get available time slots for this date
                const availableSlots = await getAvailableTimeSlots(tourKey, dateString);

                for (const slot of availableSlots) {
                    if (slot.availableSpots > 0) {
                        const dateSpecificProduct = {
                            ...baseProduct,
                            id: `${baseProduct.id}_${dateString}_${slot.time.replace(':', '')}`,
                            title: `${baseProduct.title} - ${this._formatDate(date)} at ${slot.time}`,
                            custom_label_0: `${tourKey}_${dateString}`,
                            custom_label_1: `${slot.time} - ${tourData['tour-duration']}`,
                            custom_label_2: `${slot.availableSpots} spots available`,

                            // Date-specific attributes
                            tour_date: dateString,
                            tour_time: slot.time,
                            available_spots: slot.availableSpots,
                            booking_url: `${baseProduct.link}?date=${dateString}&time=${slot.time}`,

                            // Update availability based on spots
                            availability: slot.availableSpots > 0 ? 'in stock' : 'out of stock',

                            // Update link to include date and time
                            link: `${baseProduct.link}?date=${dateString}&time=${slot.time}`
                        };

                        products.push(dateSpecificProduct);
                    }
                }
            } catch (error) {
                console.error(`Error generating products for ${tourKey} on ${dateString}:`, error);
                // Continue with next date
            }
        }

        // If no date-specific products were generated, return base product
        return products.length > 0 ? products : [baseProduct];
    }

    /**
     * Build XML feed from products
     * @private
     */
    _buildXMLFeed(products, options = {}) {
        const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${this.feedTitle}</title>
<link>${this.baseUrl}</link>
<description>${this.feedDescription}</description>
<language>${this.language}</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

        const xmlItems = products.map(product => this._buildXMLItem(product)).join('\n');

        const xmlFooter = `
</channel>
</rss>`;

        return xmlHeader + '\n' + xmlItems + xmlFooter;
    }

    /**
     * Build XML item from product
     * @private
     */
    _buildXMLItem(product) {
        return `
<item>
<g:id>${this._escapeXML(product.id)}</g:id>
<g:title>${this._escapeXML(product.title)}</g:title>
<g:description>${this._escapeXML(product.description)}</g:description>
<g:link>${this._escapeXML(product.link)}</g:link>
<g:image_link>${this._escapeXML(product.image_link)}</g:image_link>
<g:availability>${product.availability}</g:availability>
<g:price>${product.price}</g:price>
<g:brand>${this._escapeXML(product.brand)}</g:brand>
<g:mpn>${this._escapeXML(product.mpn)}</g:mpn>
<g:condition>${product.condition}</g:condition>
<g:google_product_category>${this._escapeXML(product.google_product_category)}</g:google_product_category>
<g:product_type>${this._escapeXML(product.product_type)}</g:product_type>
<g:custom_label_0>${this._escapeXML(product.custom_label_0)}</g:custom_label_0>
<g:custom_label_1>${this._escapeXML(product.custom_label_1)}</g:custom_label_1>
<g:custom_label_2>${this._escapeXML(product.custom_label_2)}</g:custom_label_2>
<g:custom_label_3>${this._escapeXML(product.custom_label_3)}</g:custom_label_3>
<g:custom_label_4>${this._escapeXML(product.custom_label_4)}</g:custom_label_4>
${product.sale_price ? `<g:sale_price>${product.sale_price}</g:sale_price>` : ''}
${product.sale_price_effective_date ? `<g:sale_price_effective_date>${product.sale_price_effective_date}</g:sale_price_effective_date>` : ''}
<g:shipping>
<g:country>${this.country}</g:country>
<g:service>Standard</g:service>
<g:price>0 JPY</g:price>
</g:shipping>
</item>`;
    }

    /**
     * Get tour image URL
     * @private
     */
    _getTourImageUrl(tourKey) {
        const imageMap = {
            'night-tour': `${this.baseUrl}/static/media/fushimi-inari-night.webp`,
            'morning-tour': `${this.baseUrl}/static/media/arashiyama-bamboo.webp`,
            'uji-tour': `${this.baseUrl}/static/media/uji-matcha.webp`,
            'gion-tour': `${this.baseUrl}/static/media/gion-geisha.webp`
        };

        return imageMap[tourKey] || `${this.baseUrl}/static/media/kyoto-tour-default.webp`;
    }

    /**
     * Sanitize description for feed
     * @private
     */
    _sanitizeDescription(description) {
        if (!description) return '';

        return description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .substring(0, 5000); // Limit to 5000 characters
    }

    /**
     * Format date for display
     * @private
     */
    _formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Escape XML special characters
     * @private
     */
    _escapeXML(str) {
        if (!str) return '';

        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validate product feed data
     * @param {Array} products - Products to validate
     * @returns {Object} - Validation result
     */
    validateFeed(products) {
        const errors = [];
        const warnings = [];

        if (!products || products.length === 0) {
            errors.push('No products found in feed');
            return { valid: false, errors, warnings };
        }

        products.forEach((product, index) => {
            // Required fields validation
            const requiredFields = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price'];

            requiredFields.forEach(field => {
                if (!product[field]) {
                    errors.push(`Product ${index + 1}: Missing required field '${field}'`);
                }
            });

            // Price format validation
            if (product.price && !product.price.match(/^\d+(\.\d{2})?\s+[A-Z]{3}$/)) {
                warnings.push(`Product ${index + 1}: Price format may be invalid: ${product.price}`);
            }

            // URL validation
            if (product.link && !product.link.startsWith('http')) {
                errors.push(`Product ${index + 1}: Invalid link URL: ${product.link}`);
            }

            // Image URL validation
            if (product.image_link && !product.image_link.startsWith('http')) {
                errors.push(`Product ${index + 1}: Invalid image URL: ${product.image_link}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            productCount: products.length
        };
    }

    /**
     * Get feed statistics
     * @param {Array} products - Products to analyze
     * @returns {Object} - Feed statistics
     */
    getFeedStatistics(products) {
        if (!products || products.length === 0) {
            return { totalProducts: 0 };
        }

        const stats = {
            totalProducts: products.length,
            tourTypes: {},
            availabilityStatus: {},
            priceRange: { min: Infinity, max: 0 },
            averagePrice: 0
        };

        let totalPrice = 0;

        products.forEach(product => {
            // Count by tour type
            const tourType = product.custom_label_0?.split('_')[0] || 'unknown';
            stats.tourTypes[tourType] = (stats.tourTypes[tourType] || 0) + 1;

            // Count by availability
            stats.availabilityStatus[product.availability] =
                (stats.availabilityStatus[product.availability] || 0) + 1;

            // Price analysis
            const priceMatch = product.price?.match(/^(\d+(?:\.\d{2})?)/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                stats.priceRange.min = Math.min(stats.priceRange.min, price);
                stats.priceRange.max = Math.max(stats.priceRange.max, price);
                totalPrice += price;
            }
        });

        stats.averagePrice = totalPrice / products.length;

        if (stats.priceRange.min === Infinity) {
            stats.priceRange.min = 0;
        }

        return stats;
    }
}

// Create singleton instance
const productFeedService = new ProductFeedService();

export default productFeedService;