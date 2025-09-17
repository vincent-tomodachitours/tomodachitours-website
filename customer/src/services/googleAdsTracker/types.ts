/**
 * Type definitions for Google Ads Tracker Service
 */

export interface GoogleAdsConversionLabels {
    [key: string]: string;
}

export interface TourSpecificConversionLabels {
    [key: string]: string;
}

export interface TrackingOptions {
    maxRetries?: number;
    timeout?: number;
    debug?: boolean;
}

export interface EnhancedConversionData {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    gclid?: string;
    device_id?: string;
    user_agent?: string;
    conversion_environment?: any;
}

export interface CrossDeviceConversionData {
    customer_email_hash?: string;
    customer_phone_hash?: string;
    gclid?: string;
    device_id?: string;
    user_agent?: string;
    original_device_type?: string;
    conversion_device_type?: string;
    time_to_conversion?: number;
    value: number;
    currency?: string;
    transaction_id?: string;
    tour_id?: string;
    tour_name?: string;
}

export interface ServerSideConversionData {
    value: number;
    currency?: string;
    transaction_id?: string;
    gclid?: string;
    conversion_date_time?: string;
    enhanced_conversion_data?: any;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
}

export interface GoogleAdsConfig {
    conversionId?: string;
    conversionLabels: GoogleAdsConversionLabels;
    isEnabled: boolean;
}

export interface ConversionData {
    value?: number;
    currency?: string;
    transaction_id?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    tour_location?: string;
    quantity?: number;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    gclid?: string;
}

export interface TransactionData {
    value: number;
    currency?: string;
    transactionId: string;
    tourId?: string;
    tourName?: string;
    tour_category?: string;
    tour_location?: string;
    quantity?: number;
    attribution?: {
        source?: string;
        medium?: string;
        campaign?: string;
        gclid?: string;
    };
}

export interface TrackingData {
    tourId: string;
    tourName?: string;
    price: number;
    tour_category?: string;
    tour_location?: string;
    attribution?: {
        source?: string;
        medium?: string;
        campaign?: string;
        gclid?: string;
    };
}

declare global {
    interface Window {
        dataLayer?: any[];
        gtag?: (...args: any[]) => void;
    }
}