// Helper functions for enhanced remarketing data

export const getTourCategory = (tourId) => {
    const tourCategories = {
        'gion-tour': 'Cultural',
        'morning-tour': 'Nature',
        'night-tour': 'Cultural',
        'uji-tour': 'Cultural'
    };
    return tourCategories[tourId] || 'Tour';
};

export const getTourDuration = (tourId) => {
    const tourDurations = {
        'gion-tour': '3-hours',
        'morning-tour': '4-hours',
        'night-tour': '2-hours',
        'uji-tour': '5-hours'
    };
    return tourDurations[tourId] || 'half-day';
};

export const getTourLocation = (tourId) => {
    const tourLocations = {
        'gion-tour': 'Gion',
        'morning-tour': 'Arashiyama',
        'night-tour': 'Fushimi',
        'uji-tour': 'Uji'
    };
    return tourLocations[tourId] || 'Kyoto';
};

export const getPriceRange = (price) => {
    if (price < 5000) return 'budget';
    if (price < 10000) return 'mid-range';
    return 'premium';
};

export const getUserEngagementLevel = () => {
    // Calculate engagement level based on session data
    const interactions = getUserInteractions();
    if (interactions.length > 5) return 'high';
    if (interactions.length > 2) return 'medium';
    return 'low';
};

// User interaction storage for cart abandonment tracking
const USER_INTERACTIONS_KEY = 'user_interactions';

export const storeUserInteraction = (interactionType, data) => {
    try {
        const interactions = getUserInteractions();
        interactions.push({
            type: interactionType,
            data: data,
            timestamp: Date.now()
        });

        // Keep only last 20 interactions to prevent storage bloat
        const recentInteractions = interactions.slice(-20);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(USER_INTERACTIONS_KEY, JSON.stringify(recentInteractions));
        }
    } catch (error) {
        console.warn('Error storing user interaction:', error);
    }
};

export const getUserInteractions = () => {
    try {
        if (typeof sessionStorage === 'undefined') return [];

        const interactions = sessionStorage.getItem(USER_INTERACTIONS_KEY);
        return interactions ? JSON.parse(interactions) : [];
    } catch (error) {
        console.warn('Error retrieving user interactions:', error);
        return [];
    }
};