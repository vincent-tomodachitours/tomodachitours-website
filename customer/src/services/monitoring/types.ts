/**
 * Type definitions for Production Monitoring Service
 */

// Alert severity levels
export const ALERT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
} as const;

// Health check status
export const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    UNKNOWN: 'unknown'
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];
export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

export interface HealthCheck {
    timestamp: number;
    status: HealthStatus;
    checks: Record<string, boolean | number>;
    issues: string[];
}

export interface DeepHealthCheck extends HealthCheck {
    performance: PerformanceMetrics;
}

export interface Alert {
    id?: string;
    type: string;
    severity: AlertSeverity;
    message: string;
    timestamp?: number;
    data?: any;
}

export interface PerformanceMetrics {
    totalErrors: number;
    recentErrors: number;
    errorRate: number;
    avgScriptLoadTime: number;
    avgTrackingCallTime: number;
    totalMetrics: number;
    recentMetrics: number;
}

export interface ConversionData {
    send_to?: string;
    value?: number;
    currency?: string;
    [key: string]: any;
}

export interface MetricHistoryItem {
    timestamp: number;
    metric: any;
}

export interface HealthStatusResponse {
    status: HealthStatus;
    lastCheck: HealthCheck | null;
    activeAlerts: Alert[];
    recentAlerts: Alert[];
}

export interface DashboardData {
    health: HealthStatusResponse;
    performance: PerformanceMetrics;
    alerts: {
        total: number;
        active: number;
        recent: number;
    };
    metrics: {
        total: number;
        recent: number;
    };
}

export interface WebhookPayload {
    alert_type: string;
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    environment: string;
    service: string;
    data?: any;
}