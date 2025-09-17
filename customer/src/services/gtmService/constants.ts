/**
 * Constants and configurations for GTM Service
 */

export const GTM_CONFIG = {
    INITIALIZATION_TIMEOUT: 5000, // 5 seconds timeout
    SCRIPT_BASE_URL: 'https://www.googletagmanager.com/gtm.js',
    SERVICE_VERSION: '1.0.0'
};

export const GTM_EVENTS = {
    INITIALIZED: 'gtm_initialized',
    DEBUG_MODE: 'gtm_debug_mode',
    TAG_VALIDATION: 'tag_validation',
    SET_USER_PROPERTIES: 'set_user_properties',
    GOOGLE_ADS_CONVERSION: 'google_ads_conversion'
};

export const CONVERSION_TYPES = {
    PURCHASE: 'purchase',
    BEGIN_CHECKOUT: 'begin_checkout',
    VIEW_ITEM: 'view_item',
    ADD_PAYMENT_INFO: 'add_payment_info'
} as const;

export const FALLBACK_CONFIG = {
    DEFAULT_CURRENCY: 'JPY',
    DEFAULT_CONVERSION_ID: 'AW-17482092392'
};