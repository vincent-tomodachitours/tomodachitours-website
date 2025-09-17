/**
 * Type definitions for GTM Service
 */

export interface GTMInitializationOptions {
    auth?: string;
    preview?: string;
}

export interface DataLayerEvent {
    event: string;
    [key: string]: any;
    _timestamp: number;
}

export interface ConversionData {
    value?: number;
    currency?: string;
    transaction_id?: string;
    items?: Array<{
        item_id?: string;
        item_name?: string;
        item_category?: string;
        quantity?: number;
        price?: number;
    }>;
    originalPrice?: number;
    discount?: {
        amount?: number;
        percentage?: number;
        code?: string;
    };
}

export interface CustomerData {
    email?: string;
    phone?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    email_hash?: string | null;
    phone_hash?: string | null;
    address?: {
        first_name?: string;
        last_name?: string;
        street?: string;
        city?: string;
        region?: string;
        postal_code?: string;
        country?: string;
    };
}

export interface PricingContext {
    basePrice?: number;
    quantity?: number;
    currency?: string;
    originalPrice?: number;
    discount?: {
        amount?: number;
        percentage?: number;
        code?: string;
    };
    options?: Record<string, any>;
    campaign?: string;
    adGroup?: string;
    keyword?: string;
    gclid?: string;
}

export interface GTMStatus {
    isInitialized: boolean;
    containerId: string | null;
    fallbackMode: boolean;
    debugMode: boolean;
    dataLayerLength: number;
    conversionConfig: any;
    ga4Config: any;
}

declare global {
    interface Window {
        dataLayer?: any[];
        google_tag_manager?: Record<string, any>;
        gtag?: (...args: any[]) => void;
        gtagConversion?: (...args: any[]) => void;
    }
}