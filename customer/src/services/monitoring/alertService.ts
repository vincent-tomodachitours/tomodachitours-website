/**
 * Alert Service for Production Monitoring
 * Reuses storage service and session management
 */

import type { Alert, WebhookPayload, MetricHistoryItem } from './types';
import { ALERT_SEVERITY } from './types';
import { PRODUCTION_CONFIG } from './constants';
import { storageService } from '../shared/storageService';
import { sessionService } from '../dynamicRemarketing/sessionService';

export class AlertService {
    private alertHistory: Alert[] = [];
    private metricsHistory: MetricHistoryItem[] = [];
    private activeAlerts: Map<string, Alert> = new Map();

    constructor() {
        this.loadStoredData();
    }

    /**
     * Handle alerts with enhanced data
     */
    handleAlert(alert: Alert): void {
        const alertId = this.generateAlertId();
        const sessionData = sessionService.getCurrentSessionData();

        const fullAlert: Alert = {
            id: alertId,
            timestamp: Date.now(),
            ...alert,
            data: {
                ...alert.data,
                sessionId: sessionData.sessionId,
                userId: sessionData.userId
            }
        };

        // Store alert
        this.storeAlert(fullAlert);

        // Log alert
        console.error(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`, alert.data);

        // Send alert to configured channels
        this.sendAlert(fullAlert);

        // Clean up old alerts
        this.cleanupOldAlerts();
    }

    /**
     * Store alert in memory and persistent storage
     */
    private storeAlert(alert: Alert): void {
        this.alertHistory.push(alert);
        this.activeAlerts.set(alert.id!, alert);

        // Store in persistent storage
        storageService.setItem('monitoring_alerts', this.alertHistory);
        storageService.setItem('monitoring_active_alerts', Array.from(this.activeAlerts.entries()));
    }

    /**
     * Handle performance metrics
     */
    handlePerformanceMetric(metric: any): void {
        // Store metric
        const metricItem: MetricHistoryItem = {
            timestamp: Date.now(),
            metric: metric
        };

        this.metricsHistory.push(metricItem);

        // Store in persistent storage periodically
        if (this.metricsHistory.length % 10 === 0) {
            storageService.setItem('monitoring_metrics', this.metricsHistory);
        }

        // Check for performance issues and create alerts
        this.checkPerformanceThresholds(metric);
    }

    /**
     * Check performance thresholds and create alerts
     */
    private checkPerformanceThresholds(metric: any): void {
        // Import metric types from performance service
        const METRIC_TYPES = {
            SCRIPT_LOAD_TIME: 'script_load_time',
            TRACKING_CALL_TIME: 'tracking_call_time'
        };

        if (metric.type === METRIC_TYPES.SCRIPT_LOAD_TIME &&
            metric.data.loadTime > PRODUCTION_CONFIG.SCRIPT_LOAD_TIME_THRESHOLD) {

            this.handleAlert({
                type: 'slow_script_loading',
                severity: ALERT_SEVERITY.MEDIUM,
                message: `Slow script loading detected: ${metric.data.loadTime}ms`,
                data: metric
            });
        }

        if (metric.type === METRIC_TYPES.TRACKING_CALL_TIME &&
            metric.data.callTime > PRODUCTION_CONFIG.TRACKING_CALL_TIME_THRESHOLD) {

            this.handleAlert({
                type: 'slow_tracking_call',
                severity: ALERT_SEVERITY.MEDIUM,
                message: `Slow tracking call detected: ${metric.data.callTime}ms`,
                data: metric
            });
        }
    }

    /**
     * Send alert to configured channels
     */
    private async sendAlert(alert: Alert): Promise<void> {
        try {
            // In a real implementation, this would send to actual alert channels
            // For now, we'll log and potentially send to a webhook

            if (process.env.REACT_APP_ALERT_WEBHOOK_URL) {
                await this.sendWebhookAlert(alert);
            }

            // Could also send email alerts, Slack notifications, etc.
            console.log(`Alert sent: ${alert.type} - ${alert.message}`);

        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    }

    /**
     * Send webhook alert
     */
    private async sendWebhookAlert(alert: Alert): Promise<void> {
        try {
            const webhookUrl = process.env.REACT_APP_ALERT_WEBHOOK_URL;
            if (!webhookUrl) return;

            const payload: WebhookPayload = {
                alert_type: alert.type,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp!,
                environment: 'production',
                service: 'google-ads-tracking',
                data: alert.data
            };

            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

        } catch (error) {
            console.error('Failed to send webhook alert:', error);
        }
    }

    /**
     * Get recent errors
     */
    getRecentErrors(timeWindow: number): Alert[] {
        const cutoff = Date.now() - timeWindow;
        return this.alertHistory.filter(alert =>
            alert.timestamp! > cutoff && alert.type.includes('error')
        );
    }

    /**
     * Get recent metrics
     */
    getRecentMetrics(timeWindow: number): MetricHistoryItem[] {
        const cutoff = Date.now() - timeWindow;
        return this.metricsHistory.filter(metric => metric.timestamp > cutoff);
    }

    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    /**
     * Get alert history
     */
    getAlertHistory(): Alert[] {
        return [...this.alertHistory];
    }

    /**
     * Clean up old alerts
     */
    private cleanupOldAlerts(): void {
        const cutoff = Date.now() - (PRODUCTION_CONFIG.ALERTS_RETENTION_DAYS * 24 * 60 * 60 * 1000);

        // Clean up alert history
        this.alertHistory = this.alertHistory.filter(alert => alert.timestamp! > cutoff);

        // Clean up active alerts (resolve old ones)
        this.activeAlerts.forEach((alert, alertId) => {
            if (alert.timestamp! < cutoff) {
                this.activeAlerts.delete(alertId);
            }
        });

        // Update persistent storage
        storageService.setItem('monitoring_alerts', this.alertHistory);
        storageService.setItem('monitoring_active_alerts', Array.from(this.activeAlerts.entries()));
    }

    /**
     * Load stored data on initialization
     */
    private loadStoredData(): void {
        try {
            // Load alert history
            const storedAlerts = storageService.getItem<Alert[]>('monitoring_alerts', []);
            if (storedAlerts) {
                this.alertHistory = storedAlerts;
            }

            // Load active alerts
            const storedActiveAlerts = storageService.getItem<[string, Alert][]>('monitoring_active_alerts', []);
            if (storedActiveAlerts) {
                this.activeAlerts = new Map(storedActiveAlerts);
            }

            // Load metrics history
            const storedMetrics = storageService.getItem<MetricHistoryItem[]>('monitoring_metrics', []);
            if (storedMetrics) {
                this.metricsHistory = storedMetrics;
            }

            console.log(`Loaded ${this.alertHistory.length} alerts and ${this.metricsHistory.length} metrics`);
        } catch (error) {
            console.error('Failed to load stored monitoring data:', error);
        }
    }

    /**
     * Generate unique alert ID
     */
    private generateAlertId(): string {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Clear all data
     */
    clearAllData(): void {
        this.alertHistory = [];
        this.metricsHistory = [];
        this.activeAlerts.clear();

        // Clear persistent storage
        storageService.removeItem('monitoring_alerts');
        storageService.removeItem('monitoring_active_alerts');
        storageService.removeItem('monitoring_metrics');

        console.log('All monitoring data cleared');
    }
}

export const alertService = new AlertService();