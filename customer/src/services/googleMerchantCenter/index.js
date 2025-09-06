/**
 * Google Merchant Center Integration
 * Main export file for all Merchant Center services
 */

import productFeedService from './productFeedService.js';
import dynamicRemarketingService from './dynamicRemarketingService.js';
import shoppingConversionService from './shoppingConversionService.js';
import feedAutomationService from './feedAutomationService.js';

// Export individual services
export {
    productFeedService,
    dynamicRemarketingService,
    shoppingConversionService,
    feedAutomationService
};

// Export combined service interface
export const googleMerchantCenter = {
    // Product Feed Management
    productFeed: productFeedService,

    // Dynamic Remarketing
    remarketing: dynamicRemarketingService,

    // Shopping Campaign Conversions
    shopping: shoppingConversionService,

    // Feed Automation
    automation: feedAutomationService,

    /**
     * Initialize all Merchant Center services
     * @param {Object} config - Configuration options
     */
    async initialize(config = {}) {
        console.log('Google Merchant Center: Initializing services...');

        try {
            // Start feed automation if enabled
            if (config.enableAutomation !== false) {
                feedAutomationService.start(config.automationOptions);
            }

            // Validate Shopping campaign setup
            if (config.validateSetup) {
                const tours = ['night-tour', 'morning-tour', 'uji-tour', 'gion-tour'];
                const validationResults = {};

                for (const tourKey of tours) {
                    validationResults[tourKey] = await shoppingConversionService.validateShoppingSetup(tourKey);
                }

                console.log('Google Merchant Center: Setup validation results:', validationResults);
            }

            console.log('Google Merchant Center: Services initialized successfully');
            return { success: true, config };

        } catch (error) {
            console.error('Google Merchant Center: Initialization failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get status of all services
     */
    getStatus() {
        return {
            productFeed: {
                available: true,
                lastGenerated: null
            },
            remarketing: dynamicRemarketingService.getStatus(),
            shopping: shoppingConversionService.getStatus(),
            automation: feedAutomationService.getStatistics()
        };
    },

    /**
     * Generate and submit complete product feed
     * @param {Object} options - Feed generation options
     */
    async generateAndSubmitFeed(options = {}) {
        try {
            console.log('Google Merchant Center: Generating and submitting product feed...');

            // Generate feed
            const feedData = await productFeedService.generateJSONFeed(options);

            // Validate feed
            const validation = productFeedService.validateFeed(feedData.products);
            if (!validation.valid) {
                throw new Error(`Feed validation failed: ${validation.errors.join(', ')}`);
            }

            // Submit to external systems
            const submissionResult = await feedAutomationService.submitFeedToExternalSystems(feedData, options);

            return {
                success: submissionResult.success,
                feedData,
                validation,
                submission: submissionResult
            };

        } catch (error) {
            console.error('Google Merchant Center: Feed generation/submission failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Track complete Shopping campaign interaction
     * @param {string} eventType - Event type (view_item, add_to_cart, purchase, etc.)
     * @param {string} tourKey - Tour identifier
     * @param {Object} eventData - Event data
     * @param {Object} shoppingData - Shopping campaign data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    async trackShoppingEvent(eventType, tourKey, eventData, shoppingData = {}, customerData = null) {
        try {
            let success = false;

            switch (eventType) {
                case 'view_item':
                    success = await shoppingConversionService.trackShoppingViewItem(tourKey, eventData, shoppingData);
                    break;

                case 'add_to_cart':
                    success = await shoppingConversionService.trackShoppingAddToCart(tourKey, eventData, shoppingData);
                    break;

                case 'purchase':
                    success = await shoppingConversionService.trackShoppingPurchase(tourKey, eventData, shoppingData, customerData);
                    break;



                default:
                    console.warn(`Google Merchant Center: Unknown event type: ${eventType}`);
                    return false;
            }

            return success;

        } catch (error) {
            console.error(`Google Merchant Center: Error tracking ${eventType}:`, error);
            return false;
        }
    }
};

// Default export
export default googleMerchantCenter;