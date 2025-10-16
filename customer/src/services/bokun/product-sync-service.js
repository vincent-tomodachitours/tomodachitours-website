/**
 * Bokun Product Sync Service
 * Fetches and caches product details including booking cutoff times from Bokun
 */

const { SecureBokunAPI } = require('./secure-api-client');
const { supabase } = require('../../lib/supabase');

export class BokunProductSyncService {
    constructor() {
        this.api = new SecureBokunAPI();
        this.SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
        this.DEFAULT_CUTOFF_HOURS = 24; // Fallback to 24 hours
    }

    /**
     * Get booking cutoff hours for a tour type
     * Returns cached value if available, otherwise fetches from Bokun
     */
    async getBookingCutoff(tourType) {
        try {
            // Get bokun product mapping
            const { data: bokunProduct, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('local_tour_type', tourType)
                .eq('is_active', true)
                .single();

            if (error || !bokunProduct) {
                console.warn(`No Bokun product found for ${tourType}, using default cutoff`);
                return this.DEFAULT_CUTOFF_HOURS;
            }

            // Check if we need to sync (no sync yet or sync is old)
            const needsSync = !bokunProduct.last_product_sync_at || 
                (Date.now() - new Date(bokunProduct.last_product_sync_at).getTime()) > this.SYNC_INTERVAL;

            if (needsSync) {
                console.log(`Syncing product details for ${tourType} from Bokun`);
                await this.syncProductDetails(bokunProduct.bokun_product_id, tourType);
                
                // Fetch updated data
                const { data: updatedProduct } = await supabase
                    .from('bokun_products')
                    .select('booking_cutoff_hours')
                    .eq('local_tour_type', tourType)
                    .single();

                return updatedProduct?.booking_cutoff_hours || this.DEFAULT_CUTOFF_HOURS;
            }

            // Return cached cutoff
            return bokunProduct.booking_cutoff_hours || this.DEFAULT_CUTOFF_HOURS;

        } catch (error) {
            console.error('Error getting booking cutoff:', error);
            return this.DEFAULT_CUTOFF_HOURS;
        }
    }

    /**
     * Sync product details from Bokun API
     */
    async syncProductDetails(bokunProductId, tourType) {
        try {
            console.log(`Fetching product details from Bokun for product ${bokunProductId}`);
            
            const productDetails = await this.api.getProduct(bokunProductId);

            if (!productDetails) {
                console.warn('No product details returned from Bokun');
                return;
            }

            console.log('Bokun product details received:', {
                id: productDetails.id,
                title: productDetails.title,
                hasBookingSettings: !!productDetails.bookingSettings
            });

            // Extract booking cutoff from Bokun response
            // Bokun stores this in different possible fields depending on configuration
            const cutoffHours = this.extractCutoffHours(productDetails);

            console.log(`Extracted cutoff hours for ${tourType}: ${cutoffHours}`);

            // Update database
            const { error } = await supabase
                .from('bokun_products')
                .update({
                    booking_cutoff_hours: cutoffHours,
                    last_product_sync_at: new Date().toISOString()
                })
                .eq('bokun_product_id', bokunProductId);

            if (error) {
                console.error('Error updating product cutoff in database:', error);
            } else {
                console.log(`✅ Updated cutoff for ${tourType}: ${cutoffHours} hours`);
            }

        } catch (error) {
            console.error('Error syncing product details:', error);
            
            // Update last_sync timestamp even on error to prevent constant retries
            await supabase
                .from('bokun_products')
                .update({
                    last_product_sync_at: new Date().toISOString()
                })
                .eq('bokun_product_id', bokunProductId);
        }
    }

    /**
     * Extract cutoff hours from Bokun product details
     * Bokun may store this in various fields depending on configuration
     */
    extractCutoffHours(productDetails) {
        // Try different possible locations for cutoff time in Bokun response
        
        // 1. Check bookingSettings.cutOffMinutes (most common)
        if (productDetails.bookingSettings?.cutOffMinutes) {
            const hours = Math.ceil(productDetails.bookingSettings.cutOffMinutes / 60);
            console.log(`Found cutOffMinutes: ${productDetails.bookingSettings.cutOffMinutes} (${hours} hours)`);
            return hours;
        }

        // 2. Check bookingSettings.advanceBookingMinimum
        if (productDetails.bookingSettings?.advanceBookingMinimum) {
            const hours = Math.ceil(productDetails.bookingSettings.advanceBookingMinimum / 60);
            console.log(`Found advanceBookingMinimum: ${productDetails.bookingSettings.advanceBookingMinimum} (${hours} hours)`);
            return hours;
        }

        // 3. Check bookingSettings.bookingCutoff (if it's in hours)
        if (productDetails.bookingSettings?.bookingCutoff) {
            console.log(`Found bookingCutoff: ${productDetails.bookingSettings.bookingCutoff}`);
            return productDetails.bookingSettings.bookingCutoff;
        }

        // 4. Check top-level cutOffMinutes
        if (productDetails.cutOffMinutes) {
            const hours = Math.ceil(productDetails.cutOffMinutes / 60);
            console.log(`Found top-level cutOffMinutes: ${productDetails.cutOffMinutes} (${hours} hours)`);
            return hours;
        }

        console.log('No cutoff time found in Bokun product, using default');
        return this.DEFAULT_CUTOFF_HOURS;
    }

    /**
     * Force sync all products
     * Useful for initial setup or manual refresh
     */
    async syncAllProducts() {
        try {
            const { data: products, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching products for sync:', error);
                return;
            }

            console.log(`Syncing ${products.length} products from Bokun`);

            for (const product of products) {
                await this.syncProductDetails(product.bokun_product_id, product.local_tour_type);
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('✅ All products synced');

        } catch (error) {
            console.error('Error syncing all products:', error);
        }
    }

    /**
     * Get cutoff for multiple tour types at once
     */
    async getBookingCutoffs(tourTypes) {
        const cutoffs = {};
        
        for (const tourType of tourTypes) {
            cutoffs[tourType] = await this.getBookingCutoff(tourType);
        }

        return cutoffs;
    }
}

// Create singleton instance
const bokunProductSyncService = new BokunProductSyncService();

// Export for both CommonJS and ES modules
module.exports = { BokunProductSyncService, bokunProductSyncService };
if (typeof exports !== 'undefined') {
    exports.BokunProductSyncService = BokunProductSyncService;
    exports.bokunProductSyncService = bokunProductSyncService;
}
