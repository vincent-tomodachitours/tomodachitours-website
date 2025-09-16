// Campaign Optimization Constants
// Shared constants for campaign optimization

export interface SeasonalFactor {
    months: number[];
    demandMultiplier: number;
    competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
    recommendedBudgetIncrease: number;
    topTours: string[];
}

export interface OptimizationThresholds {
    minConversions: number;
    minImpressions: number;
    roasTarget: number;
    conversionRateTarget: number;
    costPerConversionTarget: number;
    confidenceLevel: number;
    qualityScoreTarget: number;
    ctrTarget: number;
}

export interface TourType {
    name: string;
    averagePrice: number;
    duration: number;
    seasonality: string;
    targetAudience: string;
}

export interface DeviceBenchmark {
    expectedConversionRate: number;
    expectedRoas: number;
    trafficShare: number;
}

export interface TimePatterns {
    highPerformanceHours: number[];
    lowPerformanceHours: number[];
    weekendMultiplier: number;
    weekdayMultiplier: number;
    holidayMultiplier: number;
}

export interface AudienceSegment {
    name: string;
    expectedRoas: number;
    preferredTours: string[];
    seasonality: string;
}

export interface KeywordCategory {
    expectedCtr: number;
    expectedConversionRate: number;
    expectedRoas: number;
    bidStrategy: 'conservative' | 'moderate' | 'aggressive';
}

export interface GeographicPerformance {
    expectedRoas: number;
    competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export interface DefaultConfig {
    cacheTimeout: number;
    maxRecommendations: number;
    minDataPoints: number;
    confidenceThreshold: number;
    updateFrequency: number;
}

// Seasonal patterns for Kyoto tourism
export const SEASONAL_FACTORS: Record<string, SeasonalFactor> = {
    // Cherry blossom season (March-May)
    spring: {
        months: [2, 3, 4],
        demandMultiplier: 1.8,
        competitionLevel: 'high',
        recommendedBudgetIncrease: 0.4,
        topTours: ['gion', 'morning', 'cultural']
    },
    // Summer season (June-August)
    summer: {
        months: [5, 6, 7],
        demandMultiplier: 1.2,
        competitionLevel: 'medium',
        recommendedBudgetIncrease: 0.1,
        topTours: ['morning', 'cultural']
    },
    // Autumn foliage (September-November)
    autumn: {
        months: [8, 9, 10],
        demandMultiplier: 1.6,
        competitionLevel: 'high',
        recommendedBudgetIncrease: 0.3,
        topTours: ['morning', 'gion', 'uji']
    },
    // Winter season (December-February)
    winter: {
        months: [11, 0, 1],
        demandMultiplier: 0.8,
        competitionLevel: 'low',
        recommendedBudgetIncrease: -0.2,
        topTours: ['cultural', 'night']
    }
};

// Optimization thresholds
export const OPTIMIZATION_THRESHOLDS: OptimizationThresholds = {
    minConversions: 10,
    minImpressions: 1000,
    roasTarget: 3.0,
    conversionRateTarget: 2.0,
    costPerConversionTarget: 5000,
    confidenceLevel: 0.95,
    qualityScoreTarget: 7.0,
    ctrTarget: 2.0
};

// Priority levels for recommendations
export const PRIORITY_LEVELS = {
    CRITICAL: 100,
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50
} as const;

// Tour types and their characteristics
export const TOUR_TYPES: Record<string, TourType> = {
    gion: {
        name: 'Gion Cultural Tour',
        averagePrice: 12000,
        duration: 3,
        seasonality: 'high_spring_autumn',
        targetAudience: 'cultural_enthusiasts'
    },
    morning: {
        name: 'Morning Bamboo Tour',
        averagePrice: 8000,
        duration: 2.5,
        seasonality: 'consistent',
        targetAudience: 'nature_lovers'
    },
    night: {
        name: 'Night Photography Tour',
        averagePrice: 15000,
        duration: 4,
        seasonality: 'low_summer',
        targetAudience: 'photography_enthusiasts'
    },
    cultural: {
        name: 'Cultural Heritage Tour',
        averagePrice: 10000,
        duration: 3.5,
        seasonality: 'winter_friendly',
        targetAudience: 'history_buffs'
    },
    uji: {
        name: 'Uji Tea Experience',
        averagePrice: 9000,
        duration: 3,
        seasonality: 'autumn_peak',
        targetAudience: 'tea_enthusiasts'
    }
};

// Device performance benchmarks
export const DEVICE_BENCHMARKS: Record<string, DeviceBenchmark> = {
    mobile: {
        expectedConversionRate: 1.8,
        expectedRoas: 2.8,
        trafficShare: 0.6
    },
    desktop: {
        expectedConversionRate: 2.5,
        expectedRoas: 3.2,
        trafficShare: 0.3
    },
    tablet: {
        expectedConversionRate: 2.0,
        expectedRoas: 3.0,
        trafficShare: 0.1
    }
};

// Time-based performance patterns
export const TIME_PATTERNS: TimePatterns = {
    highPerformanceHours: [9, 10, 11, 19, 20, 21],
    lowPerformanceHours: [1, 2, 3, 4, 5, 6],
    weekendMultiplier: 1.3,
    weekdayMultiplier: 1.0,
    holidayMultiplier: 1.5
};

// Audience segments and their characteristics
export const AUDIENCE_SEGMENTS: Record<string, AudienceSegment> = {
    cultural_enthusiasts: {
        name: 'Cultural Enthusiasts',
        expectedRoas: 3.5,
        preferredTours: ['gion', 'cultural'],
        seasonality: 'spring_autumn'
    },
    photography_lovers: {
        name: 'Photography Lovers',
        expectedRoas: 3.2,
        preferredTours: ['night', 'morning'],
        seasonality: 'autumn'
    },
    budget_travelers: {
        name: 'Budget Travelers',
        expectedRoas: 2.5,
        preferredTours: ['morning', 'cultural'],
        seasonality: 'winter'
    },
    luxury_travelers: {
        name: 'Luxury Travelers',
        expectedRoas: 4.0,
        preferredTours: ['night', 'gion'],
        seasonality: 'spring'
    },
    nature_lovers: {
        name: 'Nature Lovers',
        expectedRoas: 3.0,
        preferredTours: ['morning', 'uji'],
        seasonality: 'spring_autumn'
    }
};

// Keyword categories and performance expectations
export const KEYWORD_CATEGORIES: Record<string, KeywordCategory> = {
    branded: {
        expectedCtr: 8.0,
        expectedConversionRate: 5.0,
        expectedRoas: 4.5,
        bidStrategy: 'aggressive'
    },
    generic_tours: {
        expectedCtr: 2.5,
        expectedConversionRate: 2.0,
        expectedRoas: 3.0,
        bidStrategy: 'moderate'
    },
    location_specific: {
        expectedCtr: 3.0,
        expectedConversionRate: 2.5,
        expectedRoas: 3.2,
        bidStrategy: 'moderate'
    },
    activity_specific: {
        expectedCtr: 2.8,
        expectedConversionRate: 2.2,
        expectedRoas: 3.1,
        bidStrategy: 'moderate'
    },
    competitor: {
        expectedCtr: 1.8,
        expectedConversionRate: 1.5,
        expectedRoas: 2.5,
        bidStrategy: 'conservative'
    }
};

// Geographic performance expectations
export const GEOGRAPHIC_PERFORMANCE: {
    domestic: Record<string, GeographicPerformance>;
    international: Record<string, GeographicPerformance>;
} = {
    domestic: {
        tokyo: { expectedRoas: 3.2, competitionLevel: 'high' },
        osaka: { expectedRoas: 3.0, competitionLevel: 'medium' },
        kyoto: { expectedRoas: 2.8, competitionLevel: 'very_high' },
        other: { expectedRoas: 2.5, competitionLevel: 'low' }
    },
    international: {
        usa: { expectedRoas: 3.5, competitionLevel: 'medium' },
        europe: { expectedRoas: 3.3, competitionLevel: 'medium' },
        australia: { expectedRoas: 3.1, competitionLevel: 'low' },
        asia: { expectedRoas: 2.9, competitionLevel: 'high' }
    }
};

// Optimization types
export const OPTIMIZATION_TYPES = {
    CONVERSION_VALUE: 'conversion_value',
    AUDIENCE_INSIGHTS: 'audience_insights',
    SEASONAL_TRACKING: 'seasonal_tracking',
    BID_RECOMMENDATIONS: 'bid_recommendations'
} as const;

// Recommendation types
export const RECOMMENDATION_TYPES = {
    BID_SCHEDULING: 'bid_scheduling',
    SEASONAL_OPTIMIZATION: 'seasonal_optimization',
    DEVICE_OPTIMIZATION: 'device_optimization',
    AUDIENCE_OPTIMIZATION: 'audience_optimization',
    KEYWORD_OPTIMIZATION: 'keyword_optimization',
    VALUE_IMPROVEMENT: 'value_improvement',
    BUDGET_ADJUSTMENT: 'budget_adjustment',
    QUALITY_IMPROVEMENT: 'quality_improvement'
} as const;

// Error codes for optimization
export const ERROR_CODES = {
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
    INVALID_CAMPAIGN_DATA: 'INVALID_CAMPAIGN_DATA',
    API_ERROR: 'API_ERROR',
    CALCULATION_ERROR: 'CALCULATION_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;

// Default configuration values
export const DEFAULT_CONFIG: DefaultConfig = {
    cacheTimeout: 3600000, // 1 hour in milliseconds
    maxRecommendations: 10,
    minDataPoints: 30,
    confidenceThreshold: 0.7,
    updateFrequency: 86400000 // 24 hours in milliseconds
};

export type OptimizationType = typeof OPTIMIZATION_TYPES[keyof typeof OPTIMIZATION_TYPES];
export type RecommendationType = typeof RECOMMENDATION_TYPES[keyof typeof RECOMMENDATION_TYPES];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];