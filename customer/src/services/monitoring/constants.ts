/**
 * Constants and configurations for Production Monitoring Service
 */

// Production monitoring configuration
export const PRODUCTION_CONFIG = {
    // Health check intervals
    HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
    DEEP_HEALTH_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes

    // Alert thresholds
    ERROR_RATE_THRESHOLD: 0.05, // 5% error rate
    SCRIPT_LOAD_TIME_THRESHOLD: 10000, // 10 seconds
    TRACKING_CALL_TIME_THRESHOLD: 2000, // 2 seconds
    CONVERSION_RATE_DROP_THRESHOLD: 0.3, // 30% drop in conversion rate

    // Monitoring endpoints
    HEALTH_CHECK_ENDPOINT: '/api/health/tracking',
    METRICS_ENDPOINT: '/api/metrics/tracking',
    ALERTS_ENDPOINT: '/api/alerts/tracking',

    // Alert channels
    ALERT_CHANNELS: {
        EMAIL: 'email',
        SLACK: 'slack',
        WEBHOOK: 'webhook'
    } as const,

    // Data retention
    METRICS_RETENTION_DAYS: 30,
    ALERTS_RETENTION_DAYS: 90
} as const;

export const REQUIRED_ENV_VARS = [
    'REACT_APP_GA_MEASUREMENT_ID',
    'REACT_APP_GOOGLE_ADS_CONVERSION_ID',
    'REACT_APP_GOOGLE_ADS_CONVERSION_LABELS'
];

export const REQUIRED_CONVERSION_LABELS = [
    'purchase',
    'begin_checkout',
    'view_item',
    'add_to_cart'
];

export const REQUIRED_TOUR_LABELS = [
    'gion_purchase',
    'morning_purchase',
    'night_purchase',
    'uji_purchase'
];

export const PLACEHOLDER_VALUES = ['XXXXXXXXXX', 'XXXXXXXXX'];