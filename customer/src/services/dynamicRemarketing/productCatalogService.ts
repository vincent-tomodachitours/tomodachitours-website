/**
 * Product Catalog Service for Dynamic Remarketing
 */

import type { TourProduct, ProductCatalogData } from './types';
import { TOUR_PRODUCT_CATALOG, GOOGLE_PRODUCT_CATEGORY_MAP } from './constants';

export class ProductCatalogService {
    private productCatalog: Record<string, TourProduct>;

    constructor() {
        this.productCatalog = TOUR_PRODUCT_CATALOG;
    }

    /**
     * Get product by ID
     */
    getProduct(tourId: string): TourProduct | null {
        return this.productCatalog[tourId] || null;
    }

    /**
     * Get all products
     */
    getAllProducts(): Record<string, TourProduct> {
        return this.productCatalog;
    }

    /**
     * Get product catalog data for Google Ads
     */
    getProductCatalogData(tourId: string): ProductCatalogData | null {
        const product = this.productCatalog[tourId];

        if (!product) {
            console.warn(`Product not found in catalog: ${tourId}`);
            return null;
        }

        return {
            // Required fields for Google Ads product catalog
            id: product.id,
            title: product.title,
            description: product.description,
            price: `${product.price} ${product.currency}`,
            image_link: `${window.location.origin}${product.image_url}`,
            link: `${window.location.origin}/${product.id}`,

            // Additional fields for better targeting
            product_type: product.category,
            google_product_category: this.mapToGoogleProductCategory(product.category),
            custom_label_0: product.location,
            custom_label_1: product.duration,
            custom_label_2: product.difficulty,
            custom_label_3: product.time_of_day,
            custom_label_4: product.season,

            // Availability and inventory
            availability: 'in stock',
            condition: 'new',

            // Additional attributes
            brand: 'Tomodachi Tours',
            mpn: product.id,
            gtin: `TOMODACHI${product.id.toUpperCase()}`,

            // Tour-specific attributes
            tour_highlights: product.highlights.join(' | '),
            group_size: product.group_size,
            booking_url: `${window.location.origin}/checkout?tour=${product.id}`
        };
    }

    /**
     * Map tour category to Google product category
     */
    private mapToGoogleProductCategory(category: string): string {
        return GOOGLE_PRODUCT_CATEGORY_MAP[category] || 'Arts & Entertainment > Events & Attractions';
    }
}

export const productCatalogService = new ProductCatalogService();