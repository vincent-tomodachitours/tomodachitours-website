/**
 * Conversion Service for Google Ads Tracker
 * Handles specific conversion types with validation and performance monitoring
 */

import type {
    ConversionData,
    TransactionData,
    TrackingData,
    TrackingOptions,
    EnhancedConversionData,
    CrossDeviceConversionData,
    ServerSideConversionData
} from './types';
import { CONVERSION_ACTIONS, TRACKING_CONFIG, TOUR_PREFIXES, TOUR_SPECIFIC_CONVERSION_LABELS, GOOGLE_ADS_CONVERSION_ID } from './constants';
import { trackingService } from './trackingService';
import { configurationService } from './configurationService';
import performanceMonitor, { ERROR_TYPES } from '../performance';
import dataValidator from '../dataValidator';

export class ConversionService {
    /**
     * Track a purchase conversion with transaction details and enhanced attribution
     */
    async trackPurchase(
        transactionData: TransactionData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        const startTime = performance.now();

        try {
            // Validate transaction data first
            const validationResult = dataValidator.validateTransaction(transactionData) as any;
            if (!validationResult.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: CONVERSION_ACTIONS.PURCHASE,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    originalData: transactionData
                });
                return false;
            }

            const sanitizedTransaction = validationResult.sanitizedData;

            const conversionData: ConversionData = {
                value: sanitizedTransaction.value,
                currency: sanitizedTransaction.currency || TRACKING_CONFIG.DEFAULT_CURRENCY,
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
                gclid: sanitizedTransaction.attribution?.gclid
            };

            const success = await trackingService.trackConversion(CONVERSION_ACTIONS.PURCHASE, conversionData, options);

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
                action: CONVERSION_ACTIONS.PURCHASE,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                trackingTime: trackingTime,
                transactionData: transactionData
            });
            return false;
        }
    }

    /**
     * Track begin checkout conversion with enhanced attribution data
     */
    async trackBeginCheckout(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        const startTime = performance.now();

        try {
            // Validate tour data first
            const validationResult = dataValidator.validateTour(tourData) as any;
            if (!validationResult.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: CONVERSION_ACTIONS.BEGIN_CHECKOUT,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    originalData: tourData
                });
                return false;
            }

            const sanitizedTour = validationResult.sanitizedData;

            const conversionData: ConversionData = {
                value: sanitizedTour.price,
                currency: TRACKING_CONFIG.DEFAULT_CURRENCY,
                // Enhanced parameters
                tour_id: sanitizedTour.tourId,
                tour_name: sanitizedTour.tourName,
                tour_category: sanitizedTour.tour_category || 'Tour',
                tour_location: sanitizedTour.tour_location,
                // Attribution data
                attribution_source: sanitizedTour.attribution?.source,
                attribution_medium: sanitizedTour.attribution?.medium,
                attribution_campaign: sanitizedTour.attribution?.campaign,
                gclid: sanitizedTour.attribution?.gclid
            };

            const success = await trackingService.trackConversion(CONVERSION_ACTIONS.BEGIN_CHECKOUT, conversionData, options);

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
                action: CONVERSION_ACTIONS.BEGIN_CHECKOUT,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                trackingTime: trackingTime,
                tourData: tourData
            });
            return false;
        }
    }

    /**
     * Track view item conversion for remarketing with enhanced data
     */
    async trackViewItem(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        const startTime = performance.now();

        try {
            // Validate tour data first
            const validationResult = dataValidator.validateTour(tourData) as any;
            if (!validationResult.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: CONVERSION_ACTIONS.VIEW_ITEM,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    originalData: tourData
                });
                return false;
            }

            const sanitizedTour = validationResult.sanitizedData;

            const conversionData: ConversionData = {
                value: sanitizedTour.price,
                currency: TRACKING_CONFIG.DEFAULT_CURRENCY,
                // Enhanced remarketing parameters
                tour_id: sanitizedTour.tourId,
                tour_name: sanitizedTour.tourName,
                tour_category: sanitizedTour.tour_category || 'Tour',
                tour_location: sanitizedTour.tour_location,
                // Attribution data
                attribution_source: sanitizedTour.attribution?.source,
                attribution_medium: sanitizedTour.attribution?.medium,
                attribution_campaign: sanitizedTour.attribution?.campaign,
                gclid: sanitizedTour.attribution?.gclid
            };

            const success = await trackingService.trackConversion(CONVERSION_ACTIONS.VIEW_ITEM, conversionData, options);

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
                action: CONVERSION_ACTIONS.VIEW_ITEM,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                trackingTime: trackingTime,
                tourData: tourData
            });
            return false;
        }
    }

    /**
     * Track add to cart conversion (when user selects a tour) with enhanced data
     */
    async trackAddToCart(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        const startTime = performance.now();

        try {
            // Validate tour data first
            const validationResult = dataValidator.validateTour(tourData) as any;
            if (!validationResult.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: CONVERSION_ACTIONS.ADD_TO_CART,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    originalData: tourData
                });
                return false;
            }

            const sanitizedTour = validationResult.sanitizedData;

            const conversionData: ConversionData = {
                value: sanitizedTour.price,
                currency: TRACKING_CONFIG.DEFAULT_CURRENCY,
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

            const success = await trackingService.trackConversion(CONVERSION_ACTIONS.ADD_TO_CART, conversionData, options);

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
                action: CONVERSION_ACTIONS.ADD_TO_CART,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                trackingTime: trackingTime,
                tourData: tourData
            });
            return false;
        }
    }

    /**
     * Track tour-specific conversion with enhanced parameters
     */
    async trackTourSpecificConversion(
        tourId: string,
        conversionAction: string,
        conversionData: Partial<ConversionData> = {}
    ): Promise<boolean> {
        if (!configurationService.shouldTrack() || !tourId || !conversionAction) {
            return false;
        }

        const tourPrefix = TOUR_PREFIXES[tourId];
        if (!tourPrefix) {
            console.warn(`Unknown tour ID for conversion tracking: ${tourId}`);
            return false;
        }

        // Create tour-specific conversion action
        const tourSpecificAction = `${tourPrefix}_${conversionAction}`;
        const tourSpecificLabel = TOUR_SPECIFIC_CONVERSION_LABELS[tourSpecificAction];

        if (!tourSpecificLabel) {
            console.warn(`No tour-specific conversion label found for: ${tourSpecificAction}`);
            // Fall back to regular conversion tracking
            return trackingService.trackConversion(conversionAction, conversionData);
        }

        const conversionConfig = {
            send_to: `${GOOGLE_ADS_CONVERSION_ID}/${tourSpecificLabel}`,
            ...conversionData
        };

        if (window.gtag) {
            window.gtag('event', 'conversion', conversionConfig);
            console.log(`Tour-specific Google Ads conversion tracked: ${tourSpecificAction}`, conversionConfig);
            return true;
        }

        return false;
    }

    /**
     * Track enhanced conversion with cross-device data
     */
    trackEnhancedConversion(
        conversionAction: string,
        conversionData: ConversionData,
        enhancedData: EnhancedConversionData = {}
    ): boolean {
        if (!configurationService.shouldTrack()) {
            return false;
        }

        const conversionLabel = configurationService.getConversionLabel(conversionAction);
        if (!conversionLabel) {
            console.warn(`No Google Ads conversion label found for action: ${conversionAction}`);
            return false;
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

        if (window.gtag) {
            window.gtag('event', 'conversion', enhancedConversionConfig);
            console.log(`Enhanced Google Ads conversion tracked: ${conversionAction}`, enhancedConversionConfig);
            return true;
        }

        return false;
    }

    /**
     * Track cross-device conversion
     */
    trackCrossDeviceConversion(crossDeviceData: CrossDeviceConversionData): boolean {
        if (!configurationService.shouldTrack()) {
            return false;
        }

        const enhancedData: EnhancedConversionData = {
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

        return this.trackEnhancedConversion(CONVERSION_ACTIONS.PURCHASE, {
            value: crossDeviceData.value,
            currency: crossDeviceData.currency || TRACKING_CONFIG.DEFAULT_CURRENCY,
            transaction_id: crossDeviceData.transaction_id,
            tour_id: crossDeviceData.tour_id,
            tour_name: crossDeviceData.tour_name
        }, enhancedData);
    }

    /**
     * Track server-side conversion for critical events
     */
    trackServerSideConversion(serverConversionData: ServerSideConversionData): boolean {
        if (!configurationService.shouldTrack()) {
            return false;
        }

        const purchaseLabel = configurationService.getConversionLabel(CONVERSION_ACTIONS.PURCHASE);
        if (!purchaseLabel) {
            return false;
        }

        // For server-side conversions, we need to ensure proper attribution
        const conversionConfig = {
            send_to: `${GOOGLE_ADS_CONVERSION_ID}/${purchaseLabel}`,
            value: serverConversionData.value,
            currency: serverConversionData.currency || TRACKING_CONFIG.DEFAULT_CURRENCY,
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

        if (window.gtag) {
            window.gtag('event', 'conversion', conversionConfig);
            console.log('Server-side Google Ads conversion tracked:', conversionConfig);
            return true;
        }

        return false;
    }

    /**
     * Track offline conversion (for phone bookings, etc.)
     */
    trackOfflineConversion(gclid: string, conversionData: ConversionData): boolean {
        if (!configurationService.shouldTrack() || !gclid) {
            return false;
        }

        const offlineConversionData: ConversionData = {
            ...conversionData,
            gclid: gclid
        };

        // Use enhanced conversion tracking for offline conversions
        return this.trackEnhancedConversion(CONVERSION_ACTIONS.PURCHASE, offlineConversionData, {
            gclid: gclid,
            email: (conversionData as any).customer_email_hash,
            phone_number: (conversionData as any).customer_phone_hash,
            first_name: (conversionData as any).customer_first_name_hash,
            last_name: (conversionData as any).customer_last_name_hash
        });
    }
}

export const conversionService = new ConversionService();