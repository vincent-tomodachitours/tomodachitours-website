/**
 * Type definitions for GTM GA4 Configuration Service
 */

export interface CustomDimensions {
    tour_id: string;
    tour_name: string;
    tour_category: string;
    tour_location: string;
    tour_duration: string;
    booking_date: string;
    payment_provider: string;
    price_range: string;
    user_engagement_level: string;
    conversion_source: string;
}

export interface EnhancedEcommerceConfig {
    currency: string;
    send_to: string;
    enhanced_ecommerce: boolean;
    custom_map: CustomDimensions;
}

export interface TourData {
    tourId?: string;
    tourName?: string;
    tourCategory?: string;
    tourLocation?: string;
    tourDuration?: string;
    bookingDate?: string;
    paymentProvider?: string;
    priceRange?: string;
}

export interface TransactionData {
    transactionId?: string;
    transaction_id?: string;
    value?: number;
    currency?: string;
    items?: any[];
    userData?: any;
    tour_id?: string;
    tour_name?: string;
    booking_date?: string;
    payment_provider?: string;
    quantity?: number;
}

export interface CheckoutData {
    value?: number;
    currency?: string;
    items?: any[];
    userData?: any;
    tour_id?: string;
    tour_name?: string;
    booking_date?: string;
    payment_provider?: string;
    quantity?: number;
}

export interface ItemData {
    value?: number;
    items?: any[];
}

export interface PaymentData {
    value?: number;
    paymentProvider?: string;
}

export interface TourViewData {
    tour_id: string;
    tour_name?: string;
    tour_category?: string;
    tour_location?: string;
    tour_duration?: string;
    tour_price?: number;
    price_range?: string;
}

export interface ValidationResults {
    ga4ConfigurationValid: boolean;
    ecommerceEventsValid: boolean;
    customDimensionsValid: boolean;
    dataLayerValid: boolean;
    measurementIdValid: boolean;
    errors: string[];
}

export interface TestResults {
    success: boolean;
    errors: string[];
}

export interface Status {
    isInitialized: boolean;
    measurementId: string;
    debugMode: boolean;
    customDimensions: CustomDimensions;
    enhancedEcommerceEnabled: boolean;
    dataLayerLength: number;
}

export interface GA4EventData {
    event: string;
    [key: string]: any;
}

export interface TagConfig {
    tag_name: string;
    event_name: string;
    measurement_id: string;
    enhanced_ecommerce: boolean;
    parameters: Record<string, any>;
    trigger: string;
}

declare global {
    interface Window {
        dataLayer?: any[];
    }
}