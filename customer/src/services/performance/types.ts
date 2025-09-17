/**
 * Type definitions for Performance Monitor Service
 */

export const ERROR_TYPES = {
    SCRIPT_LOAD_FAILURE: 'script_load_failure',
    TRACKING_FAILURE: 'tracking_failure',
    VALIDATION_ERROR: 'validation_error',
    NETWORK_ERROR: 'network_error',
    PRIVACY_ERROR: 'privacy_error',
    CONFIGURATION_ERROR: 'configuration_error'
} as const;

export const METRIC_TYPES = {
    SCRIPT_LOAD_TIME: 'script_load_time',
    TRACKING_CALL_TIME: 'tracking_call_time',
    VALIDATION_TIME: 'validation_time',
    ERROR_RATE: 'error_rate',
    SUCCESS_RATE: 'success_rate',
    SERVICE_INITIALIZATION_TIME: 'service_initialization_time',
    PURCHASE_TRACKING_TIME: 'purchase_tracking_time',
    CHECKOUT_TRACKING_TIME: 'checkout_tracking_time',
    VIEW_ITEM_TRACKING_TIME: 'view_item_tracking_time',
    ADD_TO_CART_TRACKING_TIME: 'add_to_cart_tracking_time'
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];
export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];

export interface PerformanceError {
    id: string;
    type: ErrorType;
    timestamp: number;
    data: Record<string, any>;
    userAgent: string;
    url: string;
    retryCount: number;
    reported?: boolean;
}

export interface PerformanceMetric {
    id: string;
    type: MetricType;
    timestamp: number;
    data: Record<string, any>;
}

export interface ScriptLoadData {
    url: string;
    loadTime: number;
    timestamp: number;
}

export interface TrackingCallData {
    eventType: string;
    callTime: number;
    timestamp: number;
}

export interface PerformanceSummary {
    totalMetrics: number;
    recentMetrics: number;
    totalErrors: number;
    recentErrors: number;
    errorRate: number;
    scriptLoadTimes: ScriptLoadData[];
    trackingCallTimes: TrackingCallData[];
}