/**
 * Conversion Service for GTM
 * Handles conversion tracking with optimization and validation
 */

import type { ConversionData, CustomerData, PricingContext } from './types';
import { GTM_EVENTS, CONVERSION_TYPES, FALLBACK_CONFIG } from './constants';
import { eventService } from './eventService';

import GTMConversionConfig from '../gtmConversionConfig';
import gtmGA4Config from '../gtm';
import conversionValueOptimizer from '../conversionValueOptimizer';

export class ConversionService {
    private conversionConfig: any;
    private ga4Config: any;

    constructor() {
        this.conversionConfig = new GTMConversionConfig();
        this.ga4Config = gtmGA4Config;
    }

    /**
     * Track Google Ads conversion with proper configuration and dynamic pricing
     */
    trackConversion(
        conversionType: string,
        eventData: ConversionData = {},
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        try {
            // Optimize conversion value with dynamic pricing
            let optimizedEventData = { ...eventData };

            if (eventData.value && (eventData.originalPrice || pricingContext.originalPrice)) {
                optimizedEventData = this.optimizeConversionValue(eventData, pricingContext);
            }

            // Validate conversion event data
            if (!this.conversionConfig.validateConversionEvent(conversionType, optimizedEventData)) {
                console.warn(`GTM: Invalid conversion event data for ${conversionType}`);
                return false;
            }

            // Get conversion configuration based on type
            const conversionConfig = this.getConversionConfig(conversionType, optimizedEventData);
            if (!conversionConfig) {
                console.error(`GTM: Unknown conversion type: ${conversionType}`);
                return false;
            }

            // Prepare event data with customer data if provided
            const enhancedEventData = {
                ...optimizedEventData,
                ...(customerData && { user_data: customerData })
            };

            // Generate dataLayer event for Google Ads conversion
            const conversionEvent = eventService.isDebugMode() ?
                this.conversionConfig.debugConversionEvent(conversionType, enhancedEventData, conversionConfig) :
                this.conversionConfig.generateConversionDataLayerEvent(conversionType, enhancedEventData, conversionConfig);

            // Push conversion event to dataLayer
            eventService.pushEvent(GTM_EVENTS.GOOGLE_ADS_CONVERSION, conversionEvent);

            // Also push the standard ecommerce event for GA4
            eventService.pushEvent(conversionType, enhancedEventData);

            if (eventService.isDebugMode()) {
                console.log(`GTM: Conversion tracked - ${conversionType}:`, conversionEvent);
            }

            return true;

        } catch (error) {
            console.error(`GTM: Failed to track conversion ${conversionType}:`, error);
            return false;
        }
    }

    /**
     * Track purchase conversion with enhanced data and dynamic pricing
     */
    trackPurchaseConversion(
        transactionData: ConversionData,
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        // Track Google Ads conversion with pricing optimization
        const conversionSuccess = this.trackConversion(CONVERSION_TYPES.PURCHASE, transactionData, customerData, pricingContext);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4Purchase(transactionData, (transactionData as any).tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track begin checkout conversion with dynamic pricing
     */
    trackBeginCheckoutConversion(
        checkoutData: ConversionData,
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        // Track Google Ads conversion with pricing optimization
        const conversionSuccess = this.trackConversion(CONVERSION_TYPES.BEGIN_CHECKOUT, checkoutData, customerData, pricingContext);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4BeginCheckout(checkoutData, (checkoutData as any).tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track view item conversion
     */
    trackViewItemConversion(itemData: ConversionData): boolean {
        // Track Google Ads conversion
        const conversionSuccess = this.trackConversion(CONVERSION_TYPES.VIEW_ITEM, itemData);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4ViewItem(itemData, (itemData as any).tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track add payment info conversion
     */
    trackAddPaymentInfoConversion(
        paymentData: ConversionData,
        customerData: CustomerData | null = null
    ): boolean {
        // Track Google Ads conversion
        const conversionSuccess = this.trackConversion(CONVERSION_TYPES.ADD_PAYMENT_INFO, paymentData, customerData);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4AddPaymentInfo(paymentData, (paymentData as any).tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track specific tour view with detailed tour information
     */
    trackSpecificTourView(tourViewData: Record<string, any>): boolean {
        // Track the specific tour view event in GA4
        const ga4Success = this.ga4Config.trackGA4SpecificTourView(tourViewData);

        if (eventService.isDebugMode()) {
            console.log('GTM: Specific tour view tracked:', tourViewData);
        }

        return ga4Success;
    }

    /**
     * Track direct Google Ads conversion (fallback)
     */
    trackDirectGoogleAdsConversion(conversionLabel: string, conversionData: ConversionData = {}): boolean {
        try {
            // Use direct gtag if available
            if (window.gtagConversion && conversionLabel) {
                const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID || FALLBACK_CONFIG.DEFAULT_CONVERSION_ID;
                const conversionConfig = {
                    send_to: `${conversionId}/${conversionLabel}`,
                    value: conversionData.value || 0,
                    currency: conversionData.currency || FALLBACK_CONFIG.DEFAULT_CURRENCY,
                    transaction_id: conversionData.transaction_id || ''
                };

                // Add enhanced conversion data if available
                if ((conversionData as any).user_data) {
                    (conversionConfig as any).user_data = (conversionData as any).user_data;
                }

                window.gtagConversion('event', 'conversion', conversionConfig);

                if (eventService.isDebugMode()) {
                    console.log('Direct Google Ads conversion tracked:', conversionConfig);
                }

                return true;
            } else {
                console.warn('Direct Google Ads tracking not available');
                return false;
            }
        } catch (error) {
            console.error('Direct Google Ads conversion tracking failed:', error);
            return false;
        }
    }

    /**
     * Track conversion with both GTM and direct Google Ads (for verification)
     */
    trackConversionWithFallback(
        conversionType: string,
        eventData: ConversionData = {},
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        // Track via GTM (primary method)
        const gtmSuccess = this.trackConversion(conversionType, eventData, customerData, pricingContext);

        // Also track directly for Google Ads verification
        const conversionLabel = this.getConversionLabel(conversionType);
        let directSuccess = false;

        if (conversionLabel) {
            const directConversionData = {
                value: eventData.value,
                currency: eventData.currency,
                transaction_id: eventData.transaction_id,
                user_data: customerData
            };

            directSuccess = this.trackDirectGoogleAdsConversion(conversionLabel, directConversionData as ConversionData);
        }

        if (eventService.isDebugMode()) {
            console.log(`Conversion tracking results - GTM: ${gtmSuccess}, Direct: ${directSuccess}`);
        }

        return gtmSuccess || directSuccess;
    }

    /**
     * Optimize conversion value with dynamic pricing
     */
    private optimizeConversionValue(eventData: ConversionData, pricingContext: PricingContext): ConversionData {
        const basePrice = pricingContext.basePrice || eventData.originalPrice || eventData.value || 0;
        const priceData = {
            basePrice: basePrice,
            quantity: pricingContext.quantity || 1,
            currency: eventData.currency || FALLBACK_CONFIG.DEFAULT_CURRENCY
        };

        const rawDiscountData = pricingContext.discount || eventData.discount || null;

        // Transform discount data to match DiscountData interface
        let discountData = null;
        if (rawDiscountData) {
            if (rawDiscountData.percentage) {
                discountData = {
                    type: 'percentage' as const,
                    value: rawDiscountData.percentage
                };
            } else if (rawDiscountData.amount) {
                discountData = {
                    type: 'fixed' as const,
                    value: rawDiscountData.amount
                };
            }
        }

        const optimizationResult = conversionValueOptimizer.calculateDynamicPrice(
            priceData,
            discountData,
            pricingContext.options || {}
        ) as any;

        if (optimizationResult.success) {
            const optimizedEventData = { ...eventData };

            // Use optimized pricing data
            optimizedEventData.value = optimizationResult.pricing.finalPrice;
            (optimizedEventData as any).original_value = optimizationResult.pricing.originalTotal;
            (optimizedEventData as any).discount_amount = optimizationResult.pricing.discountAmount;
            (optimizedEventData as any).discount_percentage = optimizationResult.pricing.discountPercentage;

            // Add Target ROAS optimization data
            const roasData = conversionValueOptimizer.getTargetROASData(
                { conversionValue: optimizedEventData.value, ...pricingContext },
                optimizationResult.pricing
            );

            if (roasData) {
                (optimizedEventData as any).roas_data = roasData;
            }

            if (eventService.isDebugMode()) {
                console.log('GTM: Conversion value optimized:', {
                    original: eventData.value,
                    optimized: optimizedEventData.value,
                    validation: optimizationResult.validation
                });
            }

            return optimizedEventData;
        } else {
            console.warn('GTM: Conversion value optimization failed:', optimizationResult.error);
            return eventData;
        }
    }

    /**
     * Get conversion configuration based on type
     */
    private getConversionConfig(conversionType: string, eventData: ConversionData): any {
        switch (conversionType) {
            case CONVERSION_TYPES.PURCHASE:
                return this.conversionConfig.getPurchaseConversionConfig(eventData);
            case CONVERSION_TYPES.BEGIN_CHECKOUT:
                return this.conversionConfig.getBeginCheckoutConversionConfig(eventData);
            case CONVERSION_TYPES.VIEW_ITEM:
                return this.conversionConfig.getViewItemConversionConfig(eventData);
            case CONVERSION_TYPES.ADD_PAYMENT_INFO:
                return this.conversionConfig.getAddPaymentInfoConversionConfig(eventData);
            default:
                return null;
        }
    }

    /**
     * Get conversion label for direct tracking
     */
    private getConversionLabel(conversionType: string): string | null {
        try {
            const conversionLabels = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;
            if (!conversionLabels) return null;

            const labels = JSON.parse(conversionLabels);
            return labels[conversionType] || null;
        } catch (error) {
            console.error('Failed to parse conversion labels:', error);
            return null;
        }
    }

    /**
     * Get conversion configuration debug info
     */
    getDebugInfo(): any {
        return this.conversionConfig.getDebugInfo();
    }
}

export const conversionService = new ConversionService();