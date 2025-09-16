/**
 * Customer segmentation logic for tour-specific tracking
 * Handles customer classification and behavior analysis
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserInteraction {
    type: string;
    timestamp: number;
    data: {
        tourId?: string;
        price?: number;
        [key: string]: any;
    };
}

interface CustomerSegmentationResult {
    primary_segment: string;
    all_segments: string[];
    segment_score: number;
    tour_affinity: TourAffinityScores;
}

interface TourAffinityScores {
    'gion-tour': number;
    'morning-tour': number;
    'night-tour': number;
    'uji-tour': number;
}

// ============================================================================
// CUSTOMER SEGMENTS CONFIGURATION
// ============================================================================

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
} as const;

type CustomerSegment = typeof CUSTOMER_SEGMENTS[keyof typeof CUSTOMER_SEGMENTS];

// ============================================================================
// SEGMENTATION FUNCTIONS
// ============================================================================

/**
 * Get customer segmentation data based on user behavior and preferences
 * @param userData - User interaction data
 * @returns Customer segment information
 */
export const getCustomerSegmentation = (_userData: Record<string, any> = {}): CustomerSegmentationResult => {
    const segments: string[] = [];
    const interactions = getUserInteractionHistory();
    const tourViews = interactions.filter(i => i.type === 'tour_view');
    const uniqueTours = new Set(tourViews.map(i => i.data.tourId).filter(Boolean));

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
    const viewedPrices = tourViews
        .map(i => i.data.price)
        .filter((price): price is number => typeof price === 'number');

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
        ['gion-tour', 'night-tour', 'uji-tour'].includes(i.data.tourId || '')
    );
    const natureTours = tourViews.filter(i =>
        ['morning-tour'].includes(i.data.tourId || '')
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
 * @param segments - Customer segments
 * @param interactions - User interactions
 * @returns Segment score (0-100)
 */
export const calculateSegmentScore = (segments: string[], interactions: UserInteraction[]): number => {
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
 * @param tourViews - Tour view interactions
 * @returns Tour affinity scores
 */
export const calculateTourAffinity = (tourViews: UserInteraction[]): TourAffinityScores => {
    const affinityScores: TourAffinityScores = {
        'gion-tour': 0,
        'morning-tour': 0,
        'night-tour': 0,
        'uji-tour': 0
    };

    tourViews.forEach(view => {
        const tourId = view.data.tourId;
        if (tourId && Object.prototype.hasOwnProperty.call(affinityScores, tourId)) {
            affinityScores[tourId as keyof TourAffinityScores] += 1;
        }
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(affinityScores));
    if (maxScore > 0) {
        (Object.keys(affinityScores) as Array<keyof TourAffinityScores>).forEach(tourId => {
            affinityScores[tourId] = (affinityScores[tourId] / maxScore) * 100;
        });
    }

    return affinityScores;
};

/**
 * Get segment value multiplier for conversion optimization
 * @param segment - Customer segment
 * @returns Value multiplier
 */
export const getSegmentValueMultiplier = (segment: string): number => {
    const multipliers: Record<CustomerSegment, number> = {
        [CUSTOMER_SEGMENTS.PREMIUM_SEEKER]: 1.5,
        [CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT]: 1.3,
        [CUSTOMER_SEGMENTS.RETURNING_VISITOR]: 1.2,
        [CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED]: 1.4,
        [CUSTOMER_SEGMENTS.CULTURAL_ENTHUSIAST]: 1.1,
        [CUSTOMER_SEGMENTS.NATURE_LOVER]: 1.1,
        [CUSTOMER_SEGMENTS.BUDGET_CONSCIOUS]: 0.8,
        [CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR]: 1.0
    };
    return multipliers[segment as CustomerSegment] || 1.0;
};

/**
 * Get segment conversion probability for bidding optimization
 * @param segment - Customer segment
 * @returns Conversion probability (0-1)
 */
export const getSegmentConversionProbability = (segment: string): number => {
    const probabilities: Record<CustomerSegment, number> = {
        [CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT]: 0.15,
        [CUSTOMER_SEGMENTS.RETURNING_VISITOR]: 0.12,
        [CUSTOMER_SEGMENTS.PREMIUM_SEEKER]: 0.10,
        [CUSTOMER_SEGMENTS.MULTI_TOUR_INTERESTED]: 0.08,
        [CUSTOMER_SEGMENTS.CULTURAL_ENTHUSIAST]: 0.06,
        [CUSTOMER_SEGMENTS.NATURE_LOVER]: 0.06,
        [CUSTOMER_SEGMENTS.BUDGET_CONSCIOUS]: 0.04,
        [CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR]: 0.03
    };
    return probabilities[segment as CustomerSegment] || 0.03;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getUserInteractionHistory = (): UserInteraction[] => {
    try {
        if (typeof sessionStorage === 'undefined') return [];
        const interactions = sessionStorage.getItem('user_interactions');
        return interactions ? JSON.parse(interactions) : [];
    } catch (error) {
        return [];
    }
};

const isFirstSession = (): boolean => {
    if (typeof sessionStorage === 'undefined') return true;
    return !sessionStorage.getItem('returning_visitor');
};

const hasHighEngagementSignals = (): boolean => {
    if (typeof sessionStorage === 'undefined') return false;

    const engagementSignals = [
        sessionStorage.getItem('scroll_depth_75'),
        sessionStorage.getItem('contact_form_viewed'),
        sessionStorage.getItem('multiple_tours_viewed')
    ];
    return engagementSignals.filter(Boolean).length >= 2;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    UserInteraction,
    CustomerSegmentationResult,
    TourAffinityScores
};