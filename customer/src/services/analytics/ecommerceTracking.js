// Enhanced ecommerce tracking functions - GTM Migration

import { getShouldTrack, getShouldTrackMarketing, isTestEnvironment } from './config.js';
import { getTourCategory, getTourDuration, getTourLocation, getPriceRange, getUserEngagementLevel, storeUserInteraction } from './helpers.js';
import { storeCartData, clearCartData } from './cartTracking.js';
import gtmService from '../gtmService.js';
import bookingFlowManager from '../bookingFlowManager.js';
import tourSpecificTracking from '../tourSpecificTracking/index.js';
import attributionService from '../attributionService.js';
import remarketingManager from '../remarketingManager.js';
import dynamicRemarketingService from '../dynamicRemarketingService.js';

// Enhanced ecommerce events for tour bookings
export const trackPurchase = (transactionData) => {
    if (!getShouldTrack() || !transactionData) return;

    try {
        // Get attribution data (skip in test environment)
        const attributionData = isTestEnvironment ? {} : attributionService.getAttributionForAnalytics();

        // Enhanced transaction data for better tracking
        const enhancedData = {
            tour_category: getTourCategory(transactionData.tourId),
            tour_duration: getTourDuration(transactionData.tourId),
            tour_location: getTourLocation(transactionData.tourId),
            price_range: getPriceRange(transactionData.value)
        };

        // Build GTM dataLayer event structure
        const gtmEventData = {
            transaction_id: transactionData.transactionId,
            value: transactionData.value,
            currency: 'JPY',
            items: [{
                item_id: transactionData.tourId,
                item_name: transactionData.tourName,
                item_category: 'Tour',
                item_category2: enhancedData.tour_category,
                item_category3: enhancedData.tour_location,
                item_variant: enhancedData.tour_duration,
                quantity: transactionData.quantity || 1,
                price: transactionData.price
            }],
            // Enhanced parameters for GTM
            tour_type: enhancedData.tour_category,
            tour_location: enhancedData.tour_location,
            price_range: enhancedData.price_range,
            purchase_timestamp: Date.now(),
            // Tour data for GA4 configuration
            tourData: {
                tourId: transactionData.tourId,
                tourName: transactionData.tourName,
                tourCategory: enhancedData.tour_category,
                tourLocation: enhancedData.tour_location,
                tourDuration: enhancedData.tour_duration,
                bookingDate: transactionData.bookingDate,
                paymentProvider: transactionData.paymentProvider,
                priceRange: enhancedData.price_range
            }
        };

        // Add attribution data if available and not in test environment
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            Object.assign(gtmEventData, {
                ...attributionData,
                custom_parameter_1: attributionData.first_source,
                custom_parameter_2: attributionData.touchpoints
            });
        }

        // Prepare customer data for enhanced conversions
        let customerData = null;
        if (transactionData.customerData) {
            customerData = {
                email: transactionData.customerData.email,
                phone: transactionData.customerData.phone,
                first_name: transactionData.customerData.firstName,
                last_name: transactionData.customerData.lastName
            };
        }

        // Track purchase conversion through GTM service
        const conversionSuccess = gtmService.trackPurchaseConversion(gtmEventData, customerData);

        if (!conversionSuccess) {
            console.warn('GTM purchase conversion tracking failed, attempting fallback');
        }

        // Clear cart data after successful purchase
        clearCartData();

        // Store purchase completion for analysis
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            storeUserInteraction('purchase', {
                ...transactionData,
                tour_category: enhancedData.tour_category,
                purchase_timestamp: Date.now()
            });
        }

        // Process purchase completion for remarketing audience exclusion (only if marketing consent given)
        if (getShouldTrackMarketing()) {
            try {
                remarketingManager.processPurchaseCompletion(transactionData);
            } catch (error) {
                console.warn('Remarketing purchase processing failed:', error);
            }
        }

        // Track tour-specific conversion with enhanced segmentation (only if marketing consent given)
        if (getShouldTrackMarketing() && !isTestEnvironment) {
            try {
                tourSpecificTracking.trackTourSpecificConversion(
                    transactionData.tourId,
                    'purchase',
                    {
                        value: transactionData.value,
                        currency: 'JPY',
                        transaction_id: transactionData.transactionId,
                        quantity: transactionData.quantity || 1
                    },
                    {
                        tour_focus: transactionData.tourId,
                        conversion_source: attributionData?.source || 'direct'
                    }
                );
            } catch (error) {
                console.warn('Tour-specific purchase tracking failed:', error);
            }
        }

    } catch (error) {
        console.error('Purchase tracking failed:', error);

        // Fallback: attempt to track with booking flow manager if available
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();
            if (bookingState) {
                bookingFlowManager.trackPurchase(transactionData);
            }
        } catch (fallbackError) {
            console.error('Fallback purchase tracking also failed:', fallbackError);
        }
    }
};

// Track when user starts booking process
export const trackBeginCheckout = (tourData) => {
    if (!getShouldTrack() || !tourData) return;

    try {
        // Get attribution data (skip in test environment)
        const attributionData = isTestEnvironment ? {} : attributionService.getAttributionForAnalytics();

        // Enhanced tour data for better tracking
        const enhancedData = {
            tour_category: getTourCategory(tourData.tourId),
            tour_duration: getTourDuration(tourData.tourId),
            tour_location: getTourLocation(tourData.tourId),
            price_range: getPriceRange(tourData.price)
        };

        // Build GTM dataLayer event structure
        const gtmEventData = {
            currency: 'JPY',
            value: tourData.price,
            items: [{
                item_id: tourData.tourId,
                item_name: tourData.tourName,
                item_category: 'Tour',
                item_category2: enhancedData.tour_category,
                item_category3: enhancedData.tour_location,
                item_variant: enhancedData.tour_duration,
                quantity: 1,
                price: tourData.price
            }],
            // Enhanced parameters for GTM
            tour_type: enhancedData.tour_category,
            tour_location: enhancedData.tour_location,
            price_range: enhancedData.price_range,
            checkout_step: 1,
            checkout_timestamp: Date.now(),
            // Tour data for GA4 configuration
            tourData: {
                tourId: tourData.tourId,
                tourName: tourData.tourName,
                tourCategory: enhancedData.tour_category,
                tourLocation: enhancedData.tour_location,
                tourDuration: enhancedData.tour_duration,
                bookingDate: tourData.bookingDate,
                paymentProvider: tourData.paymentProvider,
                priceRange: enhancedData.price_range
            }
        };

        // Add attribution data if available and not in test environment
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            Object.assign(gtmEventData, attributionData);
        }

        // Prepare customer data for enhanced conversions if available
        let customerData = null;
        if (tourData.customerData) {
            customerData = {
                email: tourData.customerData.email,
                phone: tourData.customerData.phone,
                first_name: tourData.customerData.firstName,
                last_name: tourData.customerData.lastName
            };
        }

        // Track begin checkout conversion through GTM service
        const conversionSuccess = gtmService.trackBeginCheckoutConversion(gtmEventData, customerData);

        if (!conversionSuccess) {
            console.warn('GTM begin checkout conversion tracking failed, attempting fallback');
        }

        // Store checkout initiation for funnel analysis
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            storeUserInteraction('begin_checkout', {
                ...tourData,
                tour_category: enhancedData.tour_category,
                checkout_timestamp: Date.now()
            });
        }

        // Track tour-specific begin checkout conversion (only if marketing consent given)
        if (getShouldTrackMarketing() && !isTestEnvironment) {
            try {
                tourSpecificTracking.trackTourSpecificConversion(
                    tourData.tourId,
                    'begin_checkout',
                    {
                        value: tourData.price,
                        currency: 'JPY'
                    },
                    {
                        tour_focus: tourData.tourId,
                        conversion_source: attributionData?.source || 'direct'
                    }
                );
            } catch (error) {
                console.warn('Tour-specific begin checkout tracking failed:', error);
            }

            // Add dynamic remarketing parameters for checkout events
            try {
                dynamicRemarketingService.addDynamicRemarketingParameters({
                    ...tourData,
                    eventType: 'begin_checkout'
                });
            } catch (error) {
                console.warn('Dynamic remarketing for begin checkout failed:', error);
            }
        }

    } catch (error) {
        console.error('Begin checkout tracking failed:', error);

        // Fallback: attempt to track with booking flow manager if available
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();
            if (bookingState) {
                bookingFlowManager.trackBeginCheckout({ customerData: tourData.customerData });
            }
        } catch (fallbackError) {
            console.error('Fallback begin checkout tracking also failed:', fallbackError);
        }
    }
};

// Track tour page views with enhanced data and remarketing
export const trackTourView = (tourData) => {
    if (!getShouldTrack() || !tourData) return;

    try {
        // Get attribution data (skip in test environment)
        const attributionData = isTestEnvironment ? {} : attributionService.getAttributionForAnalytics();

        // Enhanced tour data for better tracking
        const enhancedData = {
            tour_category: getTourCategory(tourData.tourId),
            tour_duration: getTourDuration(tourData.tourId),
            tour_location: getTourLocation(tourData.tourId),
            price_range: getPriceRange(tourData.price)
        };

        // Build GTM dataLayer event structure
        const gtmEventData = {
            currency: 'JPY',
            value: tourData.price,
            items: [{
                item_id: tourData.tourId,
                item_name: tourData.tourName,
                item_category: 'Tour',
                item_category2: enhancedData.tour_category,
                item_category3: enhancedData.tour_location,
                item_variant: enhancedData.tour_duration,
                price: tourData.price
            }],
            // Enhanced parameters for GTM
            tour_type: enhancedData.tour_category,
            tour_location: enhancedData.tour_location,
            price_range: enhancedData.price_range,
            user_engagement_level: getUserEngagementLevel(),
            view_timestamp: Date.now(),
            // Tour data for GA4 configuration
            tourData: {
                tourId: tourData.tourId,
                tourName: tourData.tourName,
                tourCategory: enhancedData.tour_category,
                tourLocation: enhancedData.tour_location,
                tourDuration: enhancedData.tour_duration,
                priceRange: enhancedData.price_range
            }
        };

        // Add attribution data if available and not in test environment
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            Object.assign(gtmEventData, attributionData);
        }

        // Track view item conversion through GTM service
        const conversionSuccess = gtmService.trackViewItemConversion(gtmEventData);

        if (!conversionSuccess) {
            console.warn('GTM view item conversion tracking failed, attempting fallback');
        }

        // Track specific tour view event for GA4 with tour details
        gtmService.trackSpecificTourView({
            tour_id: tourData.tourId,
            tour_name: tourData.tourName,
            tour_category: enhancedData.tour_category,
            tour_location: enhancedData.tour_location,
            tour_duration: enhancedData.tour_duration,
            tour_price: tourData.price,
            price_range: enhancedData.price_range
        });

        // Store tour view for cart abandonment tracking
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            storeUserInteraction('tour_view', {
                ...tourData,
                tour_category: enhancedData.tour_category,
                view_timestamp: Date.now()
            });
        }

        // Add user to remarketing audiences based on tour view (only if marketing consent given)
        if (getShouldTrackMarketing()) {
            try {
                remarketingManager.processTourView(tourData);
            } catch (error) {
                console.warn('Remarketing audience tagging failed:', error);
            }

            // Add dynamic remarketing parameters for tour-specific ads
            try {
                dynamicRemarketingService.addDynamicRemarketingParameters(tourData);
            } catch (error) {
                console.warn('Dynamic remarketing parameter addition failed:', error);
            }
        }

        // Track tour-specific view item conversion (only if marketing consent given)
        if (getShouldTrackMarketing() && !isTestEnvironment) {
            try {
                tourSpecificTracking.trackTourSpecificConversion(
                    tourData.tourId,
                    'view_item',
                    {
                        value: tourData.price,
                        currency: 'JPY'
                    },
                    {
                        tour_focus: tourData.tourId,
                        conversion_source: attributionData?.source || 'direct'
                    }
                );
            } catch (error) {
                console.warn('Tour-specific view item tracking failed:', error);
            }
        }

    } catch (error) {
        console.error('Tour view tracking failed:', error);

        // Fallback: attempt to track with booking flow manager if available
        try {
            const bookingState = bookingFlowManager.getCurrentBookingState();
            if (bookingState) {
                bookingFlowManager.trackViewItem(tourData);
            }
        } catch (fallbackError) {
            console.error('Fallback tour view tracking also failed:', fallbackError);
        }
    }
};

// Track add to cart events (when user selects a tour)
export const trackAddToCart = (tourData) => {
    if (!getShouldTrack() || !tourData) return;

    try {
        // Get attribution data
        const attributionData = isTestEnvironment ? {} : attributionService.getAttributionForAnalytics();

        // Enhanced tour data
        const enhancedData = {
            tour_category: getTourCategory(tourData.tourId),
            tour_duration: getTourDuration(tourData.tourId),
            tour_location: getTourLocation(tourData.tourId),
            price_range: getPriceRange(tourData.price)
        };

        // Build GTM dataLayer event structure
        const gtmEventData = {
            currency: 'JPY',
            value: tourData.price,
            items: [{
                item_id: tourData.tourId,
                item_name: tourData.tourName,
                item_category: 'Tour',
                item_category2: enhancedData.tour_category,
                item_category3: enhancedData.tour_location,
                item_variant: enhancedData.tour_duration,
                quantity: 1,
                price: tourData.price
            }],
            // Enhanced parameters for GTM
            tour_type: enhancedData.tour_category,
            tour_location: enhancedData.tour_location,
            price_range: enhancedData.price_range,
            add_to_cart_timestamp: Date.now()
        };

        // Add attribution data if available
        if (!isTestEnvironment && attributionData && Object.keys(attributionData).length > 0) {
            Object.assign(gtmEventData, attributionData);
        }

        // Track add to cart through GTM service (using pushEvent for add_to_cart)
        gtmService.pushEvent('add_to_cart', gtmEventData);

        // Enhanced tour data for storage
        const enhancedTourData = {
            ...tourData,
            ...enhancedData,
            add_to_cart_timestamp: Date.now()
        };

        // Store cart data for abandonment tracking
        storeCartData(enhancedTourData);
        storeUserInteraction('add_to_cart', enhancedTourData);

        // Track tour-specific add to cart conversion (only if marketing consent given)
        if (getShouldTrackMarketing() && !isTestEnvironment) {
            try {
                tourSpecificTracking.trackTourSpecificConversion(
                    tourData.tourId,
                    'add_to_cart',
                    {
                        value: tourData.price,
                        currency: 'JPY'
                    },
                    {
                        tour_focus: tourData.tourId,
                        conversion_source: attributionData?.source || 'direct'
                    }
                );
            } catch (error) {
                console.warn('Tour-specific add to cart tracking failed:', error);
            }

            // Add dynamic remarketing parameters for add to cart events
            try {
                dynamicRemarketingService.addDynamicRemarketingParameters({
                    ...tourData,
                    eventType: 'add_to_cart'
                });
            } catch (error) {
                console.warn('Dynamic remarketing for add to cart failed:', error);
            }
        }

    } catch (error) {
        console.error('Add to cart tracking failed:', error);
    }
};