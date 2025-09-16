/**
 * Google Tag Manager Conversion Configuration Service
 * Handles Google Ads conversion tracking setup and configuration
 */

interface ConversionLabels {
    purchase: string;
    begin_checkout: string;
    view_item: string;
    add_payment_info?: string;
}

interface TransactionData {
    value?: number;
    currency?: string;
    transaction_id?: string;
    tour_id?: string;
    tour_name?: string;
    booking_date?: string;
    payment_provider?: string;
    user_data?: any;
    items?: any[];
}

interface CheckoutData {
    value?: number;
    currency?: string;
    tour_id?: string;
    tour_name?: string;
}

interface ItemData {
    value?: number;
    currency?: string;
    tour_id?: string;
    tour_name?: string;
    item_category?: string;
}

interface PaymentData {
    value?: number;
    currency?: string;
    payment_provider?: string;
    tour_id?: string;
}

interface ConversionConfig {
    conversionId: string;
    conversionLabel: string;
    conversionValue: number;
    currencyCode: string;
    transactionId?: string;
    enhancedConversions: boolean;
    customParameters: Record<string, any>;
}

interface DataLayerEvent {
    event: string;
    event_category: string;
    event_label: string;
    conversion_id: number;
    conversion_label: string;
    value: number;
    currency: string;
    'Transaction Value': number;
    'Currency Code': string;
    'Transaction ID'?: string;
    enhanced_conversion_data?: any;
    custom_parameters: Record<string, any>;
    transaction_id?: string;
    items?: any[];
}

interface DebugInfo {
    conversionId: string;
    conversionLabels: ConversionLabels;
    enhancedConversionsEnabled: boolean;
    configurationValid: boolean;
}

class GTMConversionConfig {
    private conversionId: string;
    private conversionLabels: ConversionLabels;
    private enhancedConversionsEnabled: boolean;

    constructor() {
        this.conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID || '';
        this.conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');
        this.enhancedConversionsEnabled = process.env.REACT_APP_ENHANCED_CONVERSIONS_ENABLED === 'true';

        // Validate configuration
        this.validateConfiguration();
    }

    /**
     * Validate that all required conversion configuration is present
     */
    validateConfiguration(): boolean {
        if (!this.conversionId) {
            console.error('GTM Conversion Config: Missing REACT_APP_GOOGLE_ADS_CONVERSION_ID');
            return false;
        }

        if (!this.conversionLabels.purchase) {
            console.error('GTM Conversion Config: Missing purchase conversion label');
            return false;
        }

        if (!this.conversionLabels.begin_checkout) {
            console.error('GTM Conversion Config: Missing begin_checkout conversion label');
            return false;
        }

        if (!this.conversionLabels.view_item) {
            console.error('GTM Conversion Config: Missing view_item conversion label');
            return false;
        }

        return true;
    }

    /**
     * Get conversion configuration for purchase events
     */
    getPurchaseConversionConfig(transactionData: TransactionData): ConversionConfig {
        return {
            conversionId: this.conversionId,
            conversionLabel: this.conversionLabels.purchase,
            conversionValue: transactionData.value || 0,
            currencyCode: transactionData.currency || 'JPY',
            transactionId: transactionData.transaction_id,
            enhancedConversions: this.enhancedConversionsEnabled,
            customParameters: {
                tour_id: transactionData.tour_id,
                tour_name: transactionData.tour_name,
                booking_date: transactionData.booking_date,
                payment_provider: transactionData.payment_provider
            }
        };
    }

    /**
     * Get conversion configuration for begin_checkout events
     */
    getBeginCheckoutConversionConfig(checkoutData: CheckoutData): ConversionConfig {
        return {
            conversionId: this.conversionId,
            conversionLabel: this.conversionLabels.begin_checkout,
            conversionValue: checkoutData.value || 0,
            currencyCode: checkoutData.currency || 'JPY',
            enhancedConversions: this.enhancedConversionsEnabled,
            customParameters: {
                tour_id: checkoutData.tour_id,
                tour_name: checkoutData.tour_name,
                checkout_step: 'begin_checkout'
            }
        };
    }

    /**
     * Get conversion configuration for view_item events
     */
    getViewItemConversionConfig(itemData: ItemData): ConversionConfig {
        return {
            conversionId: this.conversionId,
            conversionLabel: this.conversionLabels.view_item,
            conversionValue: itemData.value || 0,
            currencyCode: itemData.currency || 'JPY',
            enhancedConversions: this.enhancedConversionsEnabled,
            customParameters: {
                tour_id: itemData.tour_id,
                tour_name: itemData.tour_name,
                item_category: itemData.item_category || 'tour'
            }
        };
    }

    /**
     * Get conversion configuration for add_payment_info events
     */
    getAddPaymentInfoConversionConfig(paymentData: PaymentData): ConversionConfig {
        return {
            conversionId: this.conversionId,
            conversionLabel: this.conversionLabels.add_payment_info || this.conversionLabels.begin_checkout,
            conversionValue: paymentData.value || 0,
            currencyCode: paymentData.currency || 'JPY',
            enhancedConversions: this.enhancedConversionsEnabled,
            customParameters: {
                payment_provider: paymentData.payment_provider,
                tour_id: paymentData.tour_id
            }
        };
    }

    /**
     * Generate GTM dataLayer event for Google Ads conversion
     */
    generateConversionDataLayerEvent(eventType: string, eventData: TransactionData, conversionConfig: ConversionConfig): DataLayerEvent {
        const baseEvent: DataLayerEvent = {
            event: 'google_ads_conversion',
            event_category: 'ecommerce',
            event_label: eventType,

            // Google Ads conversion parameters
            conversion_id: parseInt(conversionConfig.conversionId.replace('AW-', ''), 10),
            conversion_label: conversionConfig.conversionLabel,
            value: conversionConfig.conversionValue,
            currency: conversionConfig.currencyCode,

            // Add explicit variables that GTM expects
            'Transaction Value': conversionConfig.conversionValue,
            'Currency Code': conversionConfig.currencyCode,
            'Transaction ID': eventData.transaction_id,

            // Enhanced conversion data (if enabled)
            ...(conversionConfig.enhancedConversions && eventData.user_data && {
                enhanced_conversion_data: eventData.user_data
            }),

            // Custom parameters
            custom_parameters: conversionConfig.customParameters,

            // Transaction data
            ...(eventData.transaction_id && { transaction_id: eventData.transaction_id }),
            ...(eventData.items && { items: eventData.items })
        };

        return baseEvent;
    }

    /**
     * Validate conversion event data before sending
     */
    validateConversionEvent(eventType: string, eventData: TransactionData): boolean {
        const requiredFields: Record<string, string[]> = {
            purchase: ['value', 'currency', 'transaction_id'],
            begin_checkout: ['value', 'currency'],
            view_item: ['tour_id'],
            add_payment_info: ['value', 'currency']
        };

        const required = requiredFields[eventType] || [];
        const missing = required.filter(field => !eventData[field as keyof TransactionData]);

        if (missing.length > 0) {
            console.warn(`GTM Conversion: Missing required fields for ${eventType}:`, missing);
            return false;
        }

        return true;
    }

    /**
     * Get debug information for conversion tracking
     */
    getDebugInfo(): DebugInfo {
        return {
            conversionId: this.conversionId,
            conversionLabels: this.conversionLabels,
            enhancedConversionsEnabled: this.enhancedConversionsEnabled,
            configurationValid: this.validateConfiguration()
        };
    }

    /**
     * Debug function to log what's being sent to GTM
     */
    debugConversionEvent(eventType: string, eventData: TransactionData, conversionConfig: ConversionConfig): DataLayerEvent {
        const event = this.generateConversionDataLayerEvent(eventType, eventData, conversionConfig);
        console.log('🔍 GTM Conversion Debug:', {
            eventType,
            originalEventData: eventData,
            conversionConfig,
            finalDataLayerEvent: event
        });
        return event;
    }
}

export default GTMConversionConfig;