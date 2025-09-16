/**
 * Tour-specific conversion labels configuration
 * Manages the mapping between tours and their specific Google Ads conversion labels
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ConversionAction = 'purchase' | 'begin_checkout' | 'view_item' | 'add_to_cart';

interface TourConversionLabels {
    purchase: string;
    begin_checkout: string;
    view_item: string;
    add_to_cart: string;
}

type TourId = 'gion-tour' | 'morning-tour' | 'night-tour' | 'uji-tour';

// ============================================================================
// CONVERSION LABELS CONFIGURATION
// ============================================================================

// Tour-specific conversion labels mapping
export const TOUR_SPECIFIC_CONVERSION_LABELS: Record<TourId, TourConversionLabels> = {
    'gion-tour': {
        purchase: 'gion_purchase',
        begin_checkout: 'gion_checkout',
        view_item: 'gion_view',
        add_to_cart: 'gion_cart'
    },
    'morning-tour': {
        purchase: 'morning_purchase',
        begin_checkout: 'morning_checkout',
        view_item: 'morning_view',
        add_to_cart: 'morning_cart'
    },
    'night-tour': {
        purchase: 'night_purchase',
        begin_checkout: 'night_checkout',
        view_item: 'night_view',
        add_to_cart: 'night_cart'
    },
    'uji-tour': {
        purchase: 'uji_purchase',
        begin_checkout: 'uji_checkout',
        view_item: 'uji_view',
        add_to_cart: 'uji_cart'
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get tour-specific conversion label for a given tour and action
 * @param tourId - Tour identifier
 * @param conversionAction - Conversion action
 * @returns Tour-specific conversion label or null if not found
 */
export const getTourSpecificLabel = (tourId: string, conversionAction: string): string | null => {
    const tourLabels = TOUR_SPECIFIC_CONVERSION_LABELS[tourId as TourId];
    return tourLabels ? tourLabels[conversionAction as ConversionAction] || null : null;
};

/**
 * Check if a tour has specific conversion labels configured
 * @param tourId - Tour identifier
 * @returns True if tour has specific labels
 */
export const hasTourSpecificLabels = (tourId: string): boolean => {
    return Object.prototype.hasOwnProperty.call(TOUR_SPECIFIC_CONVERSION_LABELS, tourId);
};

/**
 * Get all available tour IDs with specific conversion labels
 * @returns Array of tour IDs
 */
export const getAvailableTourIds = (): TourId[] => {
    return Object.keys(TOUR_SPECIFIC_CONVERSION_LABELS) as TourId[];
};

/**
 * Get all conversion actions available for a specific tour
 * @param tourId - Tour identifier
 * @returns Array of conversion actions
 */
export const getTourConversionActions = (tourId: string): ConversionAction[] => {
    const tourLabels = TOUR_SPECIFIC_CONVERSION_LABELS[tourId as TourId];
    return tourLabels ? Object.keys(tourLabels) as ConversionAction[] : [];
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ConversionAction, TourConversionLabels, TourId };