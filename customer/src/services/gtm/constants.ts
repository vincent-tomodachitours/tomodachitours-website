/**
 * Constants and configurations for GTM GA4 Service
 */

import type { CustomDimensions } from './types';

export const DEFAULT_GA4_MEASUREMENT_ID = 'G-5GVJBRE1SY';

export const BUSINESS_CONFIG = {
    BUSINESS_TYPE: 'tour_operator',
    LOCATION: 'kyoto_japan',
    CURRENCY: 'JPY',
    INDUSTRY: 'travel_tourism'
};

export const DEFAULT_CUSTOM_DIMENSIONS: CustomDimensions = {
    tour_id: 'custom_dimension_1',
    tour_name: 'custom_dimension_2',
    tour_category: 'custom_dimension_3',
    tour_location: 'custom_dimension_4',
    tour_duration: 'custom_dimension_5',
    booking_date: 'custom_dimension_6',
    payment_provider: 'custom_dimension_7',
    price_range: 'custom_dimension_8',
    user_engagement_level: 'custom_dimension_9',
    conversion_source: 'custom_dimension_10'
};

export const CUSTOM_DIMENSION_CONFIGS = [
    {
        parameter_name: 'tour_id',
        display_name: 'Tour ID',
        description: 'Unique identifier for the tour product',
        scope: 'EVENT'
    },
    {
        parameter_name: 'tour_name',
        display_name: 'Tour Name',
        description: 'Name of the tour product',
        scope: 'EVENT'
    },
    {
        parameter_name: 'tour_category',
        display_name: 'Tour Category',
        description: 'Category of the tour (morning, evening, etc.)',
        scope: 'EVENT'
    },
    {
        parameter_name: 'tour_location',
        display_name: 'Tour Location',
        description: 'Location where the tour takes place',
        scope: 'EVENT'
    },
    {
        parameter_name: 'tour_duration',
        display_name: 'Tour Duration',
        description: 'Duration of the tour in hours',
        scope: 'EVENT'
    },
    {
        parameter_name: 'booking_date',
        display_name: 'Booking Date',
        description: 'Date when the tour is booked for',
        scope: 'EVENT'
    },
    {
        parameter_name: 'payment_provider',
        display_name: 'Payment Provider',
        description: 'Payment method used (Stripe, PayJP, etc.)',
        scope: 'EVENT'
    },
    {
        parameter_name: 'price_range',
        display_name: 'Price Range',
        description: 'Price range category of the tour',
        scope: 'EVENT'
    },
    {
        parameter_name: 'user_engagement_level',
        display_name: 'User Engagement Level',
        description: 'Level of user engagement with the site',
        scope: 'USER'
    },
    {
        parameter_name: 'conversion_source',
        display_name: 'Conversion Source',
        description: 'Source that led to the conversion',
        scope: 'EVENT'
    }
];

export const GTM_EVENTS = {
    CONFIG: 'gtm_ga4_config',
    INITIALIZE: 'gtm_ga4_initialize',
    PURCHASE_CONFIG: 'gtm_ga4_purchase_config',
    BEGIN_CHECKOUT_CONFIG: 'gtm_ga4_begin_checkout_config',
    VIEW_ITEM_CONFIG: 'gtm_ga4_view_item_config',
    ADD_PAYMENT_INFO_CONFIG: 'gtm_ga4_add_payment_info_config',
    CUSTOM_DIMENSIONS_CONFIG: 'gtm_ga4_custom_dimensions_config',
    DEBUG_MODE: 'gtm_ga4_debug_mode'
};

export const GA4_EVENTS = {
    PURCHASE: 'purchase', // Direct to GA4 via gtag
    PURCHASE_CONVERSION: 'purchase_conversion', // To GTM dataLayer for Google Ads
    BEGIN_CHECKOUT: 'begin_checkout',
    VIEW_ITEM: 'view_item',
    ADD_PAYMENT_INFO: 'add_payment_info',
    TOUR_VIEW_SPECIFIC: 'tour_view_specific'
};