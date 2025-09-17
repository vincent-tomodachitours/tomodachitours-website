/**
 * Constants and configurations for Performance Monitor Service
 */

export const PERFORMANCE_CONFIG = {
    // Script load timeout (milliseconds)
    SCRIPT_LOAD_TIMEOUT: 10000,
    // Maximum retry attempts for failed tracking calls
    MAX_RETRIES: 3,
    // Retry delay multiplier (exponential backoff)
    RETRY_DELAY_BASE: 1000,
    // Performance metrics collection interval
    METRICS_COLLECTION_INTERVAL: 30000,
    // Error reporting batch size
    ERROR_BATCH_SIZE: 10,
    // Maximum errors to store locally
    MAX_STORED_ERRORS: 100,
    // Performance data retention period (7 days)
    DATA_RETENTION_PERIOD: 7 * 24 * 60 * 60 * 1000
};

export const STORAGE_KEYS = {
    PERFORMANCE_METRICS: 'performance_metrics',
    ERROR_LOG: 'tracking_error_log',
    SCRIPT_LOAD_TIMES: 'script_load_times',
    TRACKING_FAILURES: 'tracking_failures'
};

export const TRACKING_DOMAINS = [
    'googletagmanager.com',
    'google-analytics.com',
    'googleadservices.com',
    'doubleclick.net'
];

export const TRACKING_KEYWORDS = [
    'gtag', 'analytics', 'google-analytics', 'googletagmanager',
    'conversion', 'remarketing', 'attribution', 'gclid'
];

// Re-export ERROR_TYPES and METRIC_TYPES from types for convenience
export { ERROR_TYPES, METRIC_TYPES } from './types';