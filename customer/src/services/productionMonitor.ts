/**
 * Production Monitoring and Alerting Service
 * Handles production-specific monitoring, alerting, and health checks for Google Ads tracking
 * Requirements: 1.2, 4.1, 7.1, 6.2
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./monitoring/
 */

// Re-export the new service for backward compatibility
export { default } from './monitoring';
export type {
    AlertSeverity,
    HealthStatus,
    Alert,
    PerformanceMetrics,
    DashboardData,
    HealthStatusResponse
} from './monitoring';

export { ALERT_SEVERITY, HEALTH_STATUS, PRODUCTION_CONFIG } from './monitoring';