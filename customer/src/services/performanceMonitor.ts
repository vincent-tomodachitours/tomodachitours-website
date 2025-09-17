/**
 * Performance Monitor Service
 * Handles performance monitoring, error tracking, and alerting for Google Ads analytics integration
 * Requirements: 1.1, 2.2, 4.3
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./performance/
 */

// Re-export the new service for backward compatibility
export { default } from './performance';
export type {
    PerformanceError,
    PerformanceMetric,
    PerformanceSummary,
    ScriptLoadData,
    TrackingCallData,
    ErrorType,
    MetricType
} from './performance';

export { ERROR_TYPES, METRIC_TYPES } from './performance';