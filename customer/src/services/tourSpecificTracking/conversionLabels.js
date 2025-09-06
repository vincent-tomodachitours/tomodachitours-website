// Tour-specific conversion labels configuration
// Manages the mapping between tours and their specific Google Ads conversion labels

// Tour-specific conversion labels mapping
export const TOUR_SPECIFIC_CONVERSION_LABELS = {
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

/**
 * Get tour-specific conversion label for a given tour and action
 * @param {string} tourId - Tour identifier
 * @param {string} conversionAction - Conversion action
 * @returns {string|null} Tour-specific conversion label or null if not found
 */
export const getTourSpecificLabel = (tourId, conversionAction) => {
    const tourLabels = TOUR_SPECIFIC_CONVERSION_LABELS[tourId];
    return tourLabels ? tourLabels[conversionAction] : null;
};

/**
 * Check if a tour has specific conversion labels configured
 * @param {string} tourId - Tour identifier
 * @returns {boolean} True if tour has specific labels
 */
export const hasTourSpecificLabels = (tourId) => {
    return TOUR_SPECIFIC_CONVERSION_LABELS.hasOwnProperty(tourId);
};

/**
 * Get all available tour IDs with specific conversion labels
 * @returns {Array} Array of tour IDs
 */
export const getAvailableTourIds = () => {
    return Object.keys(TOUR_SPECIFIC_CONVERSION_LABELS);
};

/**
 * Get all conversion actions available for a specific tour
 * @param {string} tourId - Tour identifier
 * @returns {Array} Array of conversion actions
 */
export const getTourConversionActions = (tourId) => {
    const tourLabels = TOUR_SPECIFIC_CONVERSION_LABELS[tourId];
    return tourLabels ? Object.keys(tourLabels) : [];
};