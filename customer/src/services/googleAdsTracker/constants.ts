/**
 * Constants and configurations for Google Ads Tracker Service
 */

import type { GoogleAdsConversionLabels, TourSpecificConversionLabels } from './types';

// Google Ads configuration
export const GOOGLE_ADS_CONVERSION_ID: string | undefined = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;

export const GOOGLE_ADS_CONVERSION_LABELS: GoogleAdsConversionLabels = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS
    ? JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS)
    : {};

// Tour-specific conversion labels for enhanced tracking
export const TOUR_SPECIFIC_CONVERSION_LABELS: TourSpecificConversionLabels = process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS
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

export const TOUR_PREFIXES: Record<string, string> = {
    'gion-tour': 'gion',
    'morning-tour': 'morning',
    'night-tour': 'night',
    'uji-tour': 'uji'
};

export const TRACKING_CONFIG = {
    DEFAULT_CURRENCY: 'JPY',
    DEFAULT_MAX_RETRIES: 3,
    DEFAULT_TIMEOUT: 5000,
    RETRY_DELAY_BASE: 1000,
    MAX_RETRY_DELAY: 10000
};

export const CONVERSION_ACTIONS = {
    PURCHASE: 'purchase',
    BEGIN_CHECKOUT: 'begin_checkout',
    VIEW_ITEM: 'view_item',
    ADD_TO_CART: 'add_to_cart'
} as const;