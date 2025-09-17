/**
 * Event Tracking Service for GTM GA4
 * Reuses patterns from existing event tracking services
 */

import type {
    TourData,
    TransactionData,
    CheckoutData,
    ItemData,
    PaymentData,
    TourViewData
} from './types';
import { GA4_EVENTS, BUSINESS_CONFIG } from './constants';
import { dataLayerService } from './dataLayerService';
import { configurationService } from './configurationService';

export class EventTrackingService {
    private debugMode: boolean = false;

    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Track GA4 ecommerce event with enhanced data
     */
    trackGA4EcommerceEvent(eventName: string, eventData: any, tourData: TourData = {}): boolean {
        try {
            const enhancedEventData = {
                event: eventName,
                ...eventData,
                // Add custom tour parameters
                tour_id: tourData.tourId,
                tour_name: tourData.tourName,
                tour_category: tourData.tourCategory,
                tour_location: tourData.tourLocation,
                tour_duration: tourData.tourDuration,
                booking_date: tourData.bookingDate,
                payment_provider: tourData.paymentProvider,
                price_range: tourData.priceRange,
                // GA4 specific parameters
                send_to: configurationService.getMeasurementId(),
                enhanced_ecommerce: true
            };

            return dataLayerService.pushEvent(enhancedEventData);
        } catch (error) {
            console.error(`GTM GA4 Events: Failed to track ${eventName} event:`, error);
            return false;
        }
    }

    /**
     * Track GA4 purchase event with proper ecommerce structure
     * Single event sent to GTM dataLayer - GTM handles forwarding to both GA4 and Google Ads
     */
    trackGA4Purchase(transactionData: TransactionData, tourData: TourData = {}): boolean {
        if (!transactionData) {
            console.warn('GTM GA4 Events: Transaction data is required for purchase tracking');
            return false;
        }

        // Validate critical purchase data
        if (!transactionData.value || transactionData.value <= 0) {
            console.error('GTM GA4 Events: Invalid purchase value:', transactionData.value);
            return false;
        }

        const transactionId = transactionData.transactionId || transactionData.transaction_id;
        if (!transactionId) {
            console.error('GTM GA4 Events: Transaction ID is required for purchase tracking');
            return false;
        }

        try {
            // Prepare items array with proper structure and consistent values
            const items = transactionData.items || [{
                item_id: tourData.tourId || transactionData.tour_id || 'tour-booking',
                item_name: tourData.tourName || transactionData.tour_name || 'Tour Booking',
                item_category: 'tour',
                quantity: transactionData.quantity || 1,
                price: transactionData.value // Ensure price matches transaction value
            }];

            // Create standard GA4 purchase event with proper ecommerce structure
            const purchaseEvent = {
                event: 'purchase',
                ecommerce: {
                    transaction_id: transactionId, // Use validated transaction ID
                    value: transactionData.value,
                    currency: transactionData.currency || BUSINESS_CONFIG.CURRENCY,
                    items: items
                },
                // Custom parameters for tour business
                tour_id: tourData.tourId || transactionData.tour_id,
                tour_name: tourData.tourName || transactionData.tour_name,
                tour_category: tourData.tourCategory,
                tour_location: tourData.tourLocation,
                tour_duration: tourData.tourDuration,
                booking_date: tourData.bookingDate || transactionData.booking_date,
                payment_provider: tourData.paymentProvider || transactionData.payment_provider,
                price_range: tourData.priceRange,
                // Enhanced conversion data (if available)
                ...(transactionData.userData && { user_data: transactionData.userData })
            };

            const success = dataLayerService.pushEvent(purchaseEvent);

            if (success && this.debugMode) {
                console.log('✅ Standard GA4 purchase event sent to GTM dataLayer:', purchaseEvent);
                console.log('ℹ️ GTM will handle forwarding to both GA4 and Google Ads');
            }

            return success;

        } catch (error) {
            console.error('GTM GA4 Events: Failed to track purchase event:', error);
            return false;
        }
    }

    /**
     * Track GA4 begin checkout event
     */
    trackGA4BeginCheckout(checkoutData: CheckoutData, tourData: TourData = {}): boolean {
        if (!checkoutData) {
            console.warn('GTM GA4 Events: Checkout data is required for begin checkout tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent(GA4_EVENTS.BEGIN_CHECKOUT, {
            value: checkoutData.value,
            currency: BUSINESS_CONFIG.CURRENCY,
            items: checkoutData.items || [],
            checkout_step: 1,
            checkout_option: 'tour_booking'
        }, tourData);
    }

    /**
     * Track GA4 view item event
     */
    trackGA4ViewItem(itemData: ItemData, tourData: TourData = {}): boolean {
        if (!itemData) {
            console.warn('GTM GA4 Events: Item data is required for view item tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent(GA4_EVENTS.VIEW_ITEM, {
            value: itemData.value,
            currency: BUSINESS_CONFIG.CURRENCY,
            items: itemData.items || [],
            item_category: 'tour',
            content_type: 'product'
        }, tourData);
    }

    /**
     * Track GA4 add payment info event
     */
    trackGA4AddPaymentInfo(paymentData: PaymentData, tourData: TourData = {}): boolean {
        if (!paymentData) {
            console.warn('GTM GA4 Events: Payment data is required for add payment info tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent(GA4_EVENTS.ADD_PAYMENT_INFO, {
            value: paymentData.value,
            currency: BUSINESS_CONFIG.CURRENCY,
            payment_type: paymentData.paymentProvider,
            checkout_step: 2,
            checkout_option: 'payment_info'
        }, tourData);
    }

    /**
     * Track specific tour view event with detailed tour information
     */
    trackGA4SpecificTourView(tourViewData: TourViewData): boolean {
        if (!tourViewData || !tourViewData.tour_id) {
            console.warn('GTM GA4 Events: Tour ID is required for specific tour view tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent(GA4_EVENTS.TOUR_VIEW_SPECIFIC, {
            tour_id: tourViewData.tour_id,
            tour_name: tourViewData.tour_name,
            tour_category: tourViewData.tour_category,
            tour_location: tourViewData.tour_location,
            tour_duration: tourViewData.tour_duration,
            tour_price: tourViewData.tour_price,
            currency: BUSINESS_CONFIG.CURRENCY,
            value: tourViewData.tour_price,
            content_type: 'tour',
            item_category: 'Tour',
            custom_parameter_tour_id: tourViewData.tour_id,
            custom_parameter_tour_name: tourViewData.tour_name
        }, {
            tourId: tourViewData.tour_id,
            tourName: tourViewData.tour_name,
            tourCategory: tourViewData.tour_category,
            tourLocation: tourViewData.tour_location,
            tourDuration: tourViewData.tour_duration,
            priceRange: tourViewData.price_range
        });
    }

    /**
     * Track custom event with tour data
     */
    trackCustomEvent(eventName: string, eventData: Record<string, any>, tourData: TourData = {}): boolean {
        return this.trackGA4EcommerceEvent(eventName, eventData, tourData);
    }
}

export const eventTrackingService = new EventTrackingService();