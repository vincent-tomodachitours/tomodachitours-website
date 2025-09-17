/**
 * Constants and configurations for Revenue Attribution Reporter Service
 */

import type { ExportFormat } from './types';

export const CACHE_CONFIG = {
    TIMEOUT: 5 * 60 * 1000, // 5 minutes cache
    MAX_ENTRIES: 100
};

export const EXPORT_FORMATS: ExportFormat[] = ['json', 'csv', 'xlsx'];

export const PERFORMANCE_THRESHOLDS = {
    ROAS: {
        EXCELLENT: 4,
        GOOD: 3,
        FAIR: 2,
        POOR: 1.5
    },
    PROFIT_MARGIN: {
        EXCELLENT: 40,
        GOOD: 30,
        FAIR: 20,
        POOR: 10
    },
    PERFORMANCE_SCORE: {
        TOP_PERFORMER: 80,
        GOOD_PERFORMER: 60
    }
};

export const ESTIMATION_CONSTANTS = {
    AD_SPEND_RATIO: 0.2, // 20% of revenue
    TOTAL_COSTS_RATIO: 0.5, // 50% of revenue
    BASE_CONVERSION_RATE: 0.03, // 3%
    LTV_MULTIPLIER: 2.5
};

export const KEYWORD_CLASSIFICATION = {
    HIGH_INTENT_WORDS: ['book', 'booking', 'reserve', 'buy', 'price'],
    MEDIUM_INTENT_WORDS: ['tour', 'guide', 'visit'],
    HIGH_VOLUME_INDICATORS: ['kyoto'],
    MEDIUM_VOLUME_INDICATORS: ['tour']
};

export const REPORT_TYPES = {
    CAMPAIGN: 'campaign_performance',
    KEYWORD: 'keyword_performance',
    PRODUCT: 'product_performance'
} as const;