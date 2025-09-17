/**
 * Reporting Service for Performance Monitor
 */

import type { PerformanceError } from './types';
import { PERFORMANCE_CONFIG } from './constants';
import { storageService } from '../shared/storageService';
import privacyManager from '../privacyManager';

export class ReportingService {
    private intervals: NodeJS.Timeout[] = [];

    /**
     * Start periodic error reporting
     */
    startPeriodicReporting(): void {
        if (!storageService.getPageVisibility()) return;

        const reportingInterval = setInterval(() => {
            if (storageService.getPageVisibility()) {
                this.reportErrors();
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        this.intervals.push(reportingInterval);
    }

    /**
     * Report errors to external service (if configured)
     */
    private reportErrors(): void {
        // Don't report errors if page is hidden or privacy doesn't allow
        if (!storageService.getPageVisibility() || !privacyManager.canTrackAnalytics()) {
            return;
        }

        // This would be implemented with actual error reporting logic
        // For now, we'll just log that reporting would happen
        console.log('Error reporting would occur here');
    }

    /**
     * Log error batch for debugging
     */
    logErrorBatch(errors: PerformanceError[]): void {
        if (!storageService.getPageVisibility()) return;

        try {
            console.group('Error Batch Report');
            errors.forEach(error => {
                console.error(`[${error.type}] ${error.data.message || 'Unknown error'}`, error);
            });
            console.groupEnd();
        } catch (error) {
            console.warn('Error logging batch failed:', error);
        }
    }

    /**
     * Process error batch for reporting
     */
    processErrorBatch(errors: PerformanceError[]): void {
        if (errors.length === 0) return;

        // Batch errors for reporting
        const batch = errors.slice(0, PERFORMANCE_CONFIG.ERROR_BATCH_SIZE);

        // Mark as reported
        batch.forEach(error => {
            error.reported = true;
        });

        console.log(`Processing ${batch.length} errors for reporting`);

        // Log the errors (in a real implementation, this would send to an external service)
        this.logErrorBatch(batch);
    }

    /**
     * Stop periodic reporting
     */
    stopPeriodicReporting(): void {
        this.intervals.forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervals = [];
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        this.stopPeriodicReporting();
    }
}

export const reportingService = new ReportingService();