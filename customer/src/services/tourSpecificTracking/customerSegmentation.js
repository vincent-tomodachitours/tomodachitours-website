// Customer segmentation logic for tour-specific tracking
// Handles customer classification and behavior analysis

// Customer segmentation categories
export const CUSTOMER_SEGMENTS = {
    FIRST_TIME_VISITOR: 'first_time_visitor',
    RETURNING_VISITOR: 'returning_visitor',
    HIGH_ENGAGEMENT: 'high_engagement',
    BUDGET_CONSCIOUS: 'budget_conscious',
    PREMIUM_SEEKER: 'premium_seeker',
    CULTURAL_ENTHUSIAST: 'cultural_enthusiast',
    NATURE_LOVER: 'nature_lover',
    MULTI_TOUR_INTERESTED: 'multi_tour_interested'
};

/**
 * Get customer segmentation data based on user behavior and preferences
 * @param {Object} userData - User interaction data
 * @returns {Object} Customer segment information
 */
export const getCustomerSegmentation = (userData = {}) => {
    const segments = [];
    const interactions = getUserInteractionHistory();
    const tourViews = interactions.filter(i => i.type === 'tour_view');
    const uniqueTours = new Set(tourViews.map(i => i.data.tourId));

    // First time vs returning visitor
    if (interactions.length === 0 || isFirstSession()) {
        segments.push(CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR);
    } else {
        segments.push(CUSTOMER_SEGMENTS.RETURNING_VISITOR);
    }

    // Engagement level
    if (interactions.length > 10 || hasHighEngagementSignals()) {
        segments.push(CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT);
    }

    // Price sensitivity
    const viewedPrices = tourViews.map(i => i.data.price).filter(Boolean);
    if (viewedPrices.length > 0) {
        const avgPrice = viewedPrices.reduce((a, b) => a + b, 0) / viewedPrices.length;
        if (avgPrice < 6000) {
            segments.push(CUSTOMER_SEGMENTS.BUDGET_CONSCIOUS);
        } else if (avgPrice > 12000) {
            segments.push(CUSTOMER_SEGMENTS.PREMIUM_SEEKER);
        }
    }

    // Tour interest patterns
    const culturalTours = tourViews.filter(i =>
        ['gion-tour', 'night-tour', 'uji-tour'].includes(i.data.tourId)
    );
    const natureTours = tourViews.filter(i =>
        ['morning-tour'].includes(i.data.tourId)
    );

    if (culturalTours.length > natureTours.length) {
        segments.push(CUSTOMER_SEGMENTS.CULTURAL_ENTHUSIAST);
    } else if (natureTours.length > 0) {
        segments.push(CUSTOMER_SEGMENTS.NATURE_LOVER);
    }

    // Multi-tour interest
    if (uniqueTours.size > 2) {
        segments.push(CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED);
    }

    return {
        primary_segment: segments[0] || CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR,
        all_segments: segments,
        segment_score: calculateSegmentScore(segments, interactions),
        tour_affinity: calculateTourAffinity(tourViews)
    };
};

/**
 * Calculate segment score for campaign optimization
 * @param {Array} segments - Customer segments
 * @param {Array} interactions - User interactions
 * @returns {number} Segment score (0-100)
 */
export const calculateSegmentScore = (segments, interactions) => {
    let score = 50; // Base score

    // Adjust based on segments
    if (segments.includes(CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT)) score += 20;
    if (segments.includes(CUSTOMER_SEGMENTS.RETURNING_VISITOR)) score += 15;
    if (segments.includes(CUSTOMER_SEGMENTS.PREMIUM_SEEKER)) score += 10;
    if (segments.includes(CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED)) score += 15;

    // Adjust based on interaction count
    score += Math.min(interactions.length * 2, 20);

    return Math.min(Math.max(score, 0), 100);
};

/**
 * Calculate tour affinity scores
 * @param {Array} tourViews - Tour view interactions
 * @returns {Object} Tour affinity scores
 */
export const calculateTourAffinity = (tourViews) => {
    const affinityScores = {
        'gion-tour': 0,
        'morning-tour': 0,
        'night-tour': 0,
        'uji-tour': 0
    };

    tourViews.forEach(view => {
        if (affinityScores.hasOwnProperty(view.data.tourId)) {
            affinityScores[view.data.tourId] += 1;
        }
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(affinityScores));
    if (maxScore > 0) {
        Object.keys(affinityScores).forEach(tourId => {
            affinityScores[tourId] = (affinityScores[tourId] / maxScore) * 100;
        });
    }

    return affinityScores;
};

/**
 * Get segment value multiplier for conversion optimization
 * @param {string} segment - Customer segment
 * @returns {number} Value multiplier
 */
export const getSegmentValueMultiplier = (segment) => {
    const multipliers = {
        [CUSTOMER_SEGMENTS.PREMIUM_SEEKER]: 1.5,
        [CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT]: 1.3,
        [CUSTOMER_SEGMENTS.RETURNING_VISITOR]: 1.2,
        [CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED]: 1.4,
        [CUSTOMER_SEGMENTS.CULTURAL_ENTHUSIAST]: 1.1,
        [CUSTOMER_SEGMENTS.NATURE_LOVER]: 1.1,
        [CUSTOMER_SEGMENTS.BUDGET_CONSCIOUS]: 0.8,
        [CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR]: 1.0
    };
    return multipliers[segment] || 1.0;
};

/**
 * Get segment conversion probability for bidding optimization
 * @param {string} segment - Customer segment
 * @returns {number} Conversion probability (0-1)
 */
export const getSegmentConversionProbability = (segment) => {
    const probabilities = {
        [CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT]: 0.15,
        [CUSTOMER_SEGMENTS.RETURNING_VISITOR]: 0.12,
        [CUSTOMER_SEGMENTS.PREMIUM_SEEKER]: 0.10,
        [CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED]: 0.08,
        [CUSTOMER_SEGMENTS.CULTURAL_ENTHUSIAST]: 0.06,
        [CUSTOMER_SEGMENTS.NATURE_LOVER]: 0.06,
        [CUSTOMER_SEGMENTS.BUDGET_CONSCIOUS]: 0.04,
        [CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR]: 0.03
    };
    return probabilities[segment] || 0.03;
};

// Helper functions

const getUserInteractionHistory = () => {
    try {
        const interactions = sessionStorage.getItem('user_interactions');
        return interactions ? JSON.parse(interactions) : [];
    } catch (error) {
        return [];
    }
};

const isFirstSession = () => {
    return !sessionStorage.getItem('returning_visitor');
};

const hasHighEngagementSignals = () => {
    const engagementSignals = [
        sessionStorage.getItem('scroll_depth_75'),
        sessionStorage.getItem('contact_form_viewed'),
        sessionStorage.getItem('multiple_tours_viewed')
    ];
    return engagementSignals.filter(Boolean).length >= 2;
};