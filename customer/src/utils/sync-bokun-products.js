/**
 * Utility script to sync Bokun product details including cutoff times
 * Run this manually or set up as a scheduled task
 * 
 * Usage (from customer directory):
 * node -r dotenv/config src/utils/sync-bokun-products.js
 */

// Load environment variables
require('dotenv').config();

// Import the service (CommonJS style for Node.js)
const { bokunProductSyncService } = require('../services/bokun/product-sync-service.js');

async function syncProducts() {
    console.log('🔄 Starting Bokun product sync...');
    console.log('This will fetch booking cutoff times from Bokun for all active products');
    console.log('');

    try {
        await bokunProductSyncService.syncAllProducts();
        console.log('');
        console.log('✅ Sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ Sync failed:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Run the sync
syncProducts();
