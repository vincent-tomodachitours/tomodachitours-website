// Google Ads Conversion Tracking Service
// Integrates with existing analytics.js to provide Google Ads conversion tracking

/* global gtag */

import privacyManager from './privacyManager.js';
import performanceMonitor, { ERROR_TYPES } from './performanceMonitor.js';
import dataValidator from './dataValidator.js';

// GTM-only tracking - no direct gtag calls
window.dataLayer = window.dataLayer || [];

// Google Ads configuration
const GOOGLE_ADS_CONVERSION_ID = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
const GOOGLE_ADS_CONVERSION_LABELS = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS
    ? JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS)
    : {};

// Tour-specific conversion labels for enhanced tracking
const TOUR_SPECIFIC_CONVERSION_LABELS = process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS
    ? JSON.parse(process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS)
    : {
        // Default tour-specific labels (should be configured in environment)
        'gion_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'gion_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'gion_view': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'gion_cart': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'morning_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'morning_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'morning_view': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'morning_cart': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'night_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'night_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'night_view': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'night_cart': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'uji_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'uji_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'uji_view': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'uji_cart': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'tour_performance': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'segment_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'segment_begin_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'segment_view_item': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'segment_add_to_cart': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'cross_tour_purchase': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'cross_tour_begin_checkout': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'cross_tour_view_item': 'XXXXXXXXX/XXXXXXXXXXXXX',
        'cross_tour_add_to_cart': 'XXXXXXXXX/XXXXXXXXXXXXX'
    };

const isProduction = process.env.NODE_ENV === 'production';

// Helper function to check if Google Ads tracking should be enabled
const shouldTrack = () => {
    const analyticsEnabled = isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    const hasMarketingConsent = privacyManager.canTrackMarketing();
    return analyticsEnabled && hasMarketingConsent;
};

/**
 * Execute tracking call with retry logic and error handling
 * @param {Function} trackingFunction - Function to execute
 * @param {string} actionName - Name of the tracking action
 * @param {Object} data - Data being tracked
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} Success status
 */
const executeTrackingWithRetry = async (trackingFunction, actionName, data, maxRetries = 3) => {
    let retryCount = 0;

    while (retryCount <= maxRetries) {
        try {
            // Check if gtag is available
            if (typeof gtag !== 'function') {
                throw new Error('gtag function not available');
            }

            // Execute the tracking function
            await trackingFunction();

            // If we get here, the call was successful
            return true;

        } catch (error) {
            retryCount++;

            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                action: actionName,
                error: error.message,
                retryCount: retryCount,
                maxRetries: maxRetries,
                data: data
            });

            // If we've exhausted retries, return false
            if (retryCount > maxRetries) {
                console.error(`Failed to execute tracking after ${maxRetries} retries:`, error);
                return false;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));

            console.log(`Retrying tracking call for ${actionName} (attempt ${retryCount}/${maxRetries})`);
        }
    }

    return false;
};

/**
 * Validate tracking prerequisites
 * @param {string} actionName - Name of the tracking action
 * @returns {Object} Validation result
 */
// eslint-disable-next-line no-unused-vars
const validateTrackingPrerequisites = (actionName) => {
    const result = {
        isValid: true,
        errors: []
    };

    // Check if tracking is enabled
    if (!shouldTrack()) {
        result.isValid = false;
        result.errors.push('Tracking disabled due to privacy settings or environment');
    }

    // Check if Google Ads is configured
    if (!GOOGLE_ADS_CONVERSION_ID) {
        result.isValid = false;
        result.errors.push('Google Ads conversion ID not configured');
    }

    // Check if gtag is available
    if (typeof gtag !== 'function') {
        result.isValid = false;
        result.errors.push('gtag function not available');
    }

    // Check if action has a conversion label
    if (actionName && !GOOGLE_ADS_CONVERSION_LABELS[actionName]) {
        result.isValid = false;
        result.errors.push(`No conversion label configured for action: ${actionName}`);
    }

    return result;
};

/**
 * Initialize Google Ads conversion tracking via GTM
 * GTM will handle all Google Ads configuration
 */
export const initializeGoogleAdsTracking = () => {
    if (!shouldTrack() || !GOOGLE_ADS_CONVERSION_ID) {
        console.log('Google Ads tracking disabled or not configured');
        return;
    }

    // Send initialization event to GTM
    window.dataLayer.push({
        event: 'google_ads_init',
        google_ads_conversion_id: GOOGLE_ADS_CONVERSION_ID,
        conversion_labels: GOOGLE_ADS_CONVERSION_LABELS
    });

    console.log('Google Ads conversion tracking initialized via GTM');
};

/**
 * Track a conversion event to Google Ads with error handling and validation
 * @param {string} conversionAction - The conversion action (purchase, begin_checkout, etc.)
 * @param {Object} conversionData - The conversion data
 * @param {Object} options - Additional options for retry and validation
 */
export const trackGoogleAdsConversion = async (conversionAction, conversionData = {}, options = {}) => {
    const startTime = performance.now();

    try {
        // Privacy and configuration checks
        if (!shouldTrack() || !GOOGLE_ADS_CONVERSION_ID) {
            performanceMonitor.handleError(ERROR_TYPES.PRIVACY_ERROR, {
                action: conversionAction,
                message: 'Tracking disabled or not configured',
                shouldTrack: shouldTrack(),
                hasConversionId: !!GOOGLE_ADS_CONVERSION_ID
            });
            return false;
        }

        // Validate conversion action
        if (!conversionAction || typeof conversionAction !== 'string') {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: conversionAction,
                message: 'Invalid conversion action',
                type: typeof conversionAction
            });
            return false;
        }

        // Check for conversion label
        const conversionLabel = GOOGLE_ADS_CONVERSION_LABELS[conversionAction];
        if (!conversionLabel) {
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                action: conversionAction,
                message: 'No Google Ads conversion label found',
                availableLabels: Object.keys(GOOGLE_ADS_CONVERSION_LABELS)
            });
            return false;
        }

        // Prepare conversion configuration
        const conversionConfig = {
            send_to: `${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
            ...conversionData
        };

        // Validate conversion data
        const validationResult = dataValidator.validateGoogleAdsConversion(conversionConfig);
        if (!validationResult.isValid) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: conversionAction,
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                originalData: conversionData
            });
            return false;
        }

        // Use sanitized data
        const sanitizedConfig = validationResult.sanitizedData;

        // Execute tracking with retry logic
        const success = await executeTrackingWithRetry(
            () => gtag('event', 'conversion', sanitizedConfig),
            conversionAction,
            sanitizedConfig,
            options.maxRetries || 3
        );

        if (success) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.recordMetric('tracking_call_time', {
                action: conversionAction,
                trackingTime: trackingTime,
                timestamp: Date.now()
            });

            console.log(`Google Ads conversion tracked: ${conversionAction}`, sanitizedConfig);
            return true;
        }

        return false;

    } catch (error) {
        const trackingTime = performance.now() - startTime;
        performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
            action: conversionAction,
            error: error.message,
            stack: error.stack,
            trackingTime: trackingTime,
            conversionData: conversionData
        });
        return false;
    }
};

/**
 * Track a purchase conversion with transaction details and enhanced attribution
 * @param {Object} transactionData - Transaction data from the purchase
 * @param {Object} options - Additional options for retry and validation
 * @returns {Promise<boolean>} Success status
 */
export const trackGoogleAdsPurchase = async (transactionData, options = {}) => {
    const startTime = performance.now();

    try {
        // Validate transaction data first
        const validationResult = dataValidator.validateTransaction(transactionData);
        if (!validationResult.isValid) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: 'purchase',
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                originalData: transactionData
            });
            return false;
        }

        const sanitizedTransaction = validationResult.sanitizedData;

        const conversionData = {
            value: sanitizedTransaction.value,
            currency: sanitizedTransaction.currency || 'JPY',
            transaction_id: sanitizedTransaction.transactionId,
            // Enhanced parameters for better tracking
            tour_id: sanitizedTransaction.tourId,
            tour_name: sanitizedTransaction.tourName,
            tour_category: sanitizedTransaction.tour_category || 'Tour',
            tour_location: sanitizedTransaction.tour_location,
            quantity: sanitizedTransaction.quantity || 1,
            // Attribution data
            attribution_source: sanitizedTransaction.attribution?.source,
            attribution_medium: sanitizedTransaction.attribution?.medium,
            attribution_campaign: sanitizedTransaction.attribution?.campaign,
            gclid: sanitizedTransaction.attribution?.gclid,
            // Purchase context
            first_source: sanitizedTransaction.attribution?.first_source,
            touchpoints: sanitizedTransaction.attribution?.touchpoints,
            conversion_path_length: sanitizedTransaction.attribution?.attribution_chain?.length || 1
        };

        const success = await trackGoogleAdsConversion('purchase', conversionData, options);

        if (success) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.recordMetric('purchase_tracking_time', {
                trackingTime: trackingTime,
                transactionValue: sanitizedTransaction.value,
                timestamp: Date.now()
            });
        }

        return success;

    } catch (error) {
        const trackingTime = performance.now() - startTime;
        performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
            action: 'purchase',
            error: error.message,
            stack: error.stack,
            trackingTime: trackingTime,
            transactionData: transactionData
        });
        return false;
    }
};

/**
 * Track begin checkout conversion with enhanced attribution data
 * @param {Object} tourData - Tour data when checkout begins
 * @param {Object} options - Additional options for retry and validation
 * @returns {Promise<boolean>} Success status
 */
export const trackGoogleAdsBeginCheckout = async (tourData, options = {}) => {
    const startTime = performance.now();

    try {
        // Validate tour data first
        const validationResult = dataValidator.validateTour(tourData);
        if (!validationResult.isValid) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: 'begin_checkout',
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                originalData: tourData
            });
            return false;
        }

        const sanitizedTour = validationResult.sanitizedData;

        const conversionData = {
            value: sanitizedTour.price,
            currency: 'JPY',
            // Enhanced parameters
            tour_id: sanitizedTour.tourId,
            tour_name: sanitizedTour.tourName,
            tour_category: sanitizedTour.tour_category || 'Tour',
            tour_location: sanitizedTour.tour_location,
            // Attribution data
            attribution_source: sanitizedTour.attribution?.source,
            attribution_medium: sanitizedTour.attribution?.medium,
            attribution_campaign: sanitizedTour.attribution?.campaign,
            gclid: sanitizedTour.attribution?.gclid,
            // Checkout context
            checkout_step: 1,
            funnel_stage: 'begin_checkout'
        };

        const success = await trackGoogleAdsConversion('begin_checkout', conversionData, options);

        if (success) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.recordMetric('checkout_tracking_time', {
                trackingTime: trackingTime,
                tourId: sanitizedTour.tourId,
                timestamp: Date.now()
            });
        }

        return success;

    } catch (error) {
        const trackingTime = performance.now() - startTime;
        performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
            action: 'begin_checkout',
            error: error.message,
            stack: error.stack,
            trackingTime: trackingTime,
            tourData: tourData
        });
        return false;
    }
};

/**
 * Track view item conversion for remarketing with enhanced data
 * @param {Object} tourData - Tour data when item is viewed
 * @param {Object} options - Additional options for retry and validation
 * @returns {Promise<boolean>} Success status
 */
export const trackGoogleAdsViewItem = async (tourData, options = {}) => {
    const startTime = performance.now();

    try {
        // Validate tour data first
        const validationResult = dataValidator.validateTour(tourData);
        if (!validationResult.isValid) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: 'view_item',
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                originalData: tourData
            });
            return false;
        }

        const sanitizedTour = validationResult.sanitizedData;

        const conversionData = {
            value: sanitizedTour.price,
            currency: 'JPY',
            // Enhanced remarketing parameters
            tour_id: sanitizedTour.tourId,
            tour_name: sanitizedTour.tourName,
            tour_category: sanitizedTour.tour_category || 'Tour',
            tour_location: sanitizedTour.tour_location,
            tour_duration: sanitizedTour.tour_duration,
            price_range: sanitizedTour.price_range,
            user_engagement_level: sanitizedTour.user_engagement_level,
            // Attribution data
            attribution_source: sanitizedTour.attribution?.source,
            attribution_medium: sanitizedTour.attribution?.medium,
            attribution_campaign: sanitizedTour.attribution?.campaign,
            gclid: sanitizedTour.attribution?.gclid
        };

        const success = await trackGoogleAdsConversion('view_item', conversionData, options);

        if (success) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.recordMetric('view_item_tracking_time', {
                trackingTime: trackingTime,
                tourId: sanitizedTour.tourId,
                timestamp: Date.now()
            });
        }

        return success;

    } catch (error) {
        const trackingTime = performance.now() - startTime;
        performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
            action: 'view_item',
            error: error.message,
            stack: error.stack,
            trackingTime: trackingTime,
            tourData: tourData
        });
        return false;
    }
};

/**
 * Track add to cart conversion (when user selects a tour) with enhanced data
 * @param {Object} tourData - Tour data when added to cart
 * @param {Object} options - Additional options for retry and validation
 * @returns {Promise<boolean>} Success status
 */
export const trackGoogleAdsAddToCart = async (tourData, options = {}) => {
    const startTime = performance.now();

    try {
        // Validate tour data first
        const validationResult = dataValidator.validateTour(tourData);
        if (!validationResult.isValid) {
            performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                action: 'add_to_cart',
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                originalData: tourData
            });
            return false;
        }

        const sanitizedTour = validationResult.sanitizedData;

        const conversionData = {
            value: sanitizedTour.price,
            currency: 'JPY',
            // Enhanced parameters
            tour_id: sanitizedTour.tourId,
            tour_name: sanitizedTour.tourName,
            tour_category: sanitizedTour.tour_category || 'Tour',
            tour_location: sanitizedTour.tour_location,
            quantity: 1,
            // Attribution data
            attribution_source: sanitizedTour.attribution?.source,
            attribution_medium: sanitizedTour.attribution?.medium,
            attribution_campaign: sanitizedTour.attribution?.campaign,
            gclid: sanitizedTour.attribution?.gclid
        };

        const success = await trackGoogleAdsConversion('add_to_cart', conversionData, options);

        if (success) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.recordMetric('add_to_cart_tracking_time', {
                trackingTime: trackingTime,
                tourId: sanitizedTour.tourId,
                timestamp: Date.now()
            });
        }

        return success;

    } catch (error) {
        const trackingTime = performance.now() - startTime;
        performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
            action: 'add_to_cart',
            error: error.message,
            stack: error.stack,
            trackingTime: trackingTime,
            tourData: tourData
        });
        return false;
    }
};

/**
 * Track custom conversion with flexible parameters
 * @param {string} conversionAction - The conversion action name
 * @param {Object} customData - Custom conversion data
 */
export const trackCustomGoogleAdsConversion = (conversionAction, customData = {}) => {
    if (!shouldTrack()) return;

    // Check if this is a tour-specific conversion action
    const tourSpecificLabel = TOUR_SPECIFIC_CONVERSION_LABELS[conversionAction];
    if (tourSpecificLabel) {
        const conversionConfig = {
            send_to: `${GOOGLE_ADS_CONVERSION_ID}/${tourSpecificLabel}`,
            ...customData
        };

        gtag('event', 'conversion', conversionConfig);
        console.log(`Tour-specific Google Ads conversion tracked: ${conversionAction}`, conversionConfig);
        return;
    }

    // Fall back to regular conversion tracking
    trackGoogleAdsConversion(conversionAction, customData);
};

/**
 * Track tour-specific conversion with enhanced parameters
 * @param {string} tourId - Tour identifier (gion-tour, morning-tour, etc.)
 * @param {string} conversionAction - Base conversion action (purchase, begin_checkout, etc.)
 * @param {Object} conversionData - Conversion data with tour-specific parameters
 */
export const trackTourSpecificGoogleAdsConversion = (tourId, conversionAction, conversionData = {}) => {
    if (!shouldTrack() || !tourId || !conversionAction) return;

    // Map tour IDs to prefixes for conversion labels
    const tourPrefixes = {
        'gion-tour': 'gion',
        'morning-tour': 'morning',
        'night-tour': 'night',
        'uji-tour': 'uji'
    };

    const tourPrefix = tourPrefixes[tourId];
    if (!tourPrefix) {
        console.warn(`Unknown tour ID for conversion tracking: ${tourId}`);
        return;
    }

    // Create tour-specific conversion action
    const tourSpecificAction = `${tourPrefix}_${conversionAction}`;
    const tourSpecificLabel = TOUR_SPECIFIC_CONVERSION_LABELS[tourSpecificAction];

    if (!tourSpecificLabel) {
        console.warn(`No tour-specific conversion label found for: ${tourSpecificAction}`);
        // Fall back to regular conversion tracking
        trackGoogleAdsConversion(conversionAction, conversionData);
        return;
    }

    const conversionConfig = {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${tourSpecificLabel}`,
        ...conversionData
    };

    gtag('event', 'conversion', conversionConfig);
    console.log(`Tour-specific Google Ads conversion tracked: ${tourSpecificAction}`, conversionConfig);
};

/**
 * Set conversion linker for cross-domain tracking
 * This helps with attribution across different domains
 */
export const enableConversionLinker = () => {
    if (!shouldTrack() || !GOOGLE_ADS_CONVERSION_ID) {
        return;
    }

    gtag('config', GOOGLE_ADS_CONVERSION_ID, {
        conversion_linker: true
    });
};

/**
 * Track enhanced conversion with cross-device data
 * @param {string} conversionAction - Conversion action
 * @param {Object} conversionData - Conversion data
 * @param {Object} enhancedData - Enhanced conversion data for cross-device tracking
 */
export const trackEnhancedConversion = (conversionAction, conversionData, enhancedData = {}) => {
    if (!shouldTrack()) return;

    const conversionLabel = GOOGLE_ADS_CONVERSION_LABELS[conversionAction];
    if (!conversionLabel) {
        console.warn(`No Google Ads conversion label found for action: ${conversionAction}`);
        return;
    }

    // Enhanced conversion configuration
    const enhancedConversionConfig = {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
        ...conversionData,
        // Enhanced conversion data for better cross-device attribution
        enhanced_conversion_data: {
            email: enhancedData.email,
            phone_number: enhancedData.phone_number,
            first_name: enhancedData.first_name,
            last_name: enhancedData.last_name,
            street: enhancedData.street,
            city: enhancedData.city,
            region: enhancedData.region,
            postal_code: enhancedData.postal_code,
            country: enhancedData.country
        },
        // Cross-device attribution data
        gclid: enhancedData.gclid,
        device_id: enhancedData.device_id,
        user_agent: enhancedData.user_agent || navigator.userAgent,
        conversion_environment: enhancedData.conversion_environment
    };

    gtag('event', 'conversion', enhancedConversionConfig);
    console.log(`Enhanced Google Ads conversion tracked: ${conversionAction}`, enhancedConversionConfig);
};

/**
 * Track cross-device conversion
 * @param {Object} crossDeviceData - Cross-device conversion data
 */
export const trackCrossDeviceConversion = (crossDeviceData) => {
    if (!shouldTrack()) return;

    const enhancedData = {
        email: crossDeviceData.customer_email_hash,
        phone_number: crossDeviceData.customer_phone_hash,
        gclid: crossDeviceData.gclid,
        device_id: crossDeviceData.device_id,
        user_agent: crossDeviceData.user_agent,
        conversion_environment: {
            original_device: crossDeviceData.original_device_type,
            conversion_device: crossDeviceData.conversion_device_type,
            time_to_conversion: crossDeviceData.time_to_conversion
        }
    };

    trackEnhancedConversion('purchase', {
        value: crossDeviceData.value,
        currency: crossDeviceData.currency || 'JPY',
        transaction_id: crossDeviceData.transaction_id,
        tour_id: crossDeviceData.tour_id,
        tour_name: crossDeviceData.tour_name,
        conversion_type: 'cross_device'
    }, enhancedData);
};

/**
 * Track server-side conversion for critical events
 * @param {Object} serverConversionData - Server-side conversion data
 */
export const trackServerSideConversion = (serverConversionData) => {
    if (!shouldTrack()) return;

    // For server-side conversions, we need to ensure proper attribution
    const conversionConfig = {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABELS.purchase}`,
        value: serverConversionData.value,
        currency: serverConversionData.currency || 'JPY',
        transaction_id: serverConversionData.transaction_id,

        // Server-side specific data
        gclid: serverConversionData.gclid,
        conversion_date_time: serverConversionData.conversion_date_time,
        conversion_source: 'server_side',

        // Enhanced conversion data
        enhanced_conversion_data: serverConversionData.enhanced_conversion_data,

        // Attribution data
        attribution_source: serverConversionData.attribution_source,
        attribution_medium: serverConversionData.attribution_medium,
        attribution_campaign: serverConversionData.attribution_campaign,

        // Tour-specific data
        tour_id: serverConversionData.tour_id,
        tour_name: serverConversionData.tour_name,
        tour_category: serverConversionData.tour_category
    };

    gtag('event', 'conversion', conversionConfig);
    console.log('Server-side Google Ads conversion tracked:', conversionConfig);
};

/**
 * Track offline conversion (for phone bookings, etc.)
 * @param {string} gclid - Google Click ID from the original ad click
 * @param {Object} conversionData - Offline conversion data
 */
export const trackOfflineConversion = (gclid, conversionData) => {
    if (!shouldTrack() || !gclid) return;

    const offlineConversionData = {
        gclid: gclid,
        conversion_source: 'offline',
        conversion_type: 'phone_booking',
        ...conversionData
    };

    // Use enhanced conversion tracking for offline conversions
    trackEnhancedConversion('purchase', offlineConversionData, {
        gclid: gclid,
        email: conversionData.customer_email_hash,
        phone_number: conversionData.customer_phone_hash,
        first_name: conversionData.customer_first_name_hash,
        last_name: conversionData.customer_last_name_hash
    });
};

/**
 * Get current Google Ads configuration
 * @returns {Object} Current configuration object
 */
export const getGoogleAdsConfig = () => {
    return {
        conversionId: GOOGLE_ADS_CONVERSION_ID,
        conversionLabels: GOOGLE_ADS_CONVERSION_LABELS,
        isEnabled: shouldTrack() && !!GOOGLE_ADS_CONVERSION_ID
    };
};

// Export all functions as default object
const googleAdsTracker = {
    initializeGoogleAdsTracking,
    trackGoogleAdsConversion,
    trackGoogleAdsPurchase,
    trackGoogleAdsBeginCheckout,
    trackGoogleAdsViewItem,
    trackGoogleAdsAddToCart,
    trackCustomGoogleAdsConversion,
    trackTourSpecificGoogleAdsConversion,
    enableConversionLinker,
    trackEnhancedConversion,
    trackCrossDeviceConversion,
    trackServerSideConversion,
    trackOfflineConversion,
    getGoogleAdsConfig
};

export default googleAdsTracker;