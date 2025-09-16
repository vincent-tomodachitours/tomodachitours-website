/**
 * Parallel Tracking Validator
 * Compares old vs new conversion tracking data to ensure migration accuracy
 */

import migrationFeatureFlags from './migrationFeatureFlags';

interface ConversionData {
    event?: string;
    eventName?: string;
    transaction_id?: string;
    transactionId?: string;
    value?: number;
    currency?: string;
    timestamp?: number;
    [key: string]: any;
}

interface TrackingData {
    system: 'legacy' | 'gtm';
    timestamp: number;
    conversionData: ConversionData;
    success: boolean;
    trackingId: string;
    validationReason?: string;
    validatedAt?: number;
}

interface TrackingEntry {
    legacy?: TrackingData;
    gtm?: TrackingData;
}

interface Discrepancy {
    type: 'success_mismatch' | 'value_mismatch' | 'currency_mismatch' | 'timing_difference';
    legacy?: any;
    gtm?: any;
    difference?: number;
    severity: 'high' | 'medium' | 'low';
}

interface ComparisonResult {
    trackingId: string;
    timestamp: number;
    legacy: {
        success: boolean;
        conversionType?: string;
        value?: number;
        currency?: string;
    };
    gtm: {
        success: boolean;
        conversionType?: string;
        value?: number;
        currency?: string;
        validationReason?: string;
    };
    discrepancies: Discrepancy[];
    hasDiscrepancies: boolean;
    severity: 'high' | 'medium' | 'low' | 'none';
}

interface ValidationSummary {
    totalComparisons: number;
    successfulComparisons: number;
    discrepancyRate: string;
    severityBreakdown: {
        high: number;
        medium: number;
        low: number;
    };
    commonDiscrepancies: Array<{
        type: string;
        count: number;
    }>;
}

interface ValidationReport {
    summary: ValidationSummary;
    recentComparisons: ComparisonResult[];
    migrationStatus: any;
    validationEnabled: boolean;
}

interface StoredValidationData {
    comparisonResults: ComparisonResult[];
    lastUpdated: number;
}

declare global {
    interface Window {
        dataLayer?: any[];
        gtag?: (...args: any[]) => void;
    }
}

class ParallelTrackingValidator {
    private validationData: Map<string, TrackingEntry> = new Map();
    private comparisonResults: ComparisonResult[] = [];
    public validationEnabled: boolean;

    constructor() {
        this.validationEnabled = migrationFeatureFlags.getMigrationStatus().flags.conversionValidationEnabled;

        // Initialize validation storage
        this.initializeValidationStorage();
    }

    /**
     * Initialize validation data storage
     */
    private initializeValidationStorage(): void {
        // Load existing validation data from localStorage (browser only)
        if (typeof localStorage === 'undefined') return;

        const stored = localStorage.getItem('parallel_tracking_validation');
        if (stored) {
            try {
                const data: StoredValidationData = JSON.parse(stored);
                this.comparisonResults = data.comparisonResults || [];
            } catch (error) {
                console.warn('[ParallelValidator] Failed to load stored validation data:', error);
            }
        }
    }

    /**
     * Track conversion attempt from legacy system
     */
    trackLegacyConversion(conversionData: ConversionData): void {
        if (!this.validationEnabled) return;

        const trackingId = this.generateTrackingId(conversionData);

        const legacyTracking: TrackingData = {
            system: 'legacy',
            timestamp: Date.now(),
            conversionData: { ...conversionData },
            success: true, // Assume success unless we detect failure
            trackingId
        };

        this.storeTrackingData(trackingId, 'legacy', legacyTracking);

        migrationFeatureFlags.trackMigrationEvent('legacy_conversion_tracked', {
            trackingId,
            conversionType: conversionData.event || conversionData.eventName,
            value: conversionData.value
        });
    }

    /**
     * Track conversion attempt from GTM system
     */
    trackGTMConversion(conversionData: ConversionData): void {
        if (!this.validationEnabled) return;

        const trackingId = this.generateTrackingId(conversionData);

        const gtmTracking: TrackingData = {
            system: 'gtm',
            timestamp: Date.now(),
            conversionData: { ...conversionData },
            success: true, // Will be updated based on GTM validation
            trackingId
        };

        this.storeTrackingData(trackingId, 'gtm', gtmTracking);

        migrationFeatureFlags.trackMigrationEvent('gtm_conversion_tracked', {
            trackingId,
            conversionType: conversionData.event,
            value: conversionData.value
        });

        // Validate GTM firing after short delay
        setTimeout(() => {
            this.validateGTMFiring(trackingId, conversionData);
        }, 2000);
    }

    /**
     * Generate unique tracking ID for conversion comparison
     */
    private generateTrackingId(conversionData: ConversionData): string {
        const key = [
            conversionData.transaction_id || conversionData.transactionId,
            conversionData.event || conversionData.eventName,
            conversionData.timestamp || Date.now()
        ].join('_');

        return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    /**
     * Store tracking data for comparison
     */
    private storeTrackingData(trackingId: string, system: 'legacy' | 'gtm', data: TrackingData): void {
        if (!this.validationData.has(trackingId)) {
            this.validationData.set(trackingId, {});
        }

        const trackingEntry = this.validationData.get(trackingId)!;
        trackingEntry[system] = data;

        // Check if we have both systems tracked for comparison
        if (trackingEntry.legacy && trackingEntry.gtm) {
            this.compareTrackingData(trackingId);
        }
    }

    /**
     * Validate GTM tag firing using dataLayer inspection
     */
    private validateGTMFiring(trackingId: string, conversionData: ConversionData): void {
        if (!window.dataLayer) {
            this.updateGTMTrackingSuccess(trackingId, false, 'dataLayer not available');
            return;
        }

        // Look for the event in dataLayer
        const eventFound = window.dataLayer.some(item => {
            return item.event === conversionData.event &&
                item.transaction_id === conversionData.transaction_id;
        });

        if (eventFound) {
            this.updateGTMTrackingSuccess(trackingId, true, 'Event found in dataLayer');
        } else {
            this.updateGTMTrackingSuccess(trackingId, false, 'Event not found in dataLayer');
        }
    }

    /**
     * Update GTM tracking success status
     */
    private updateGTMTrackingSuccess(trackingId: string, success: boolean, reason: string): void {
        const trackingEntry = this.validationData.get(trackingId);
        if (trackingEntry && trackingEntry.gtm) {
            trackingEntry.gtm.success = success;
            trackingEntry.gtm.validationReason = reason;
            trackingEntry.gtm.validatedAt = Date.now();

            // Re-run comparison if legacy data exists
            if (trackingEntry.legacy) {
                this.compareTrackingData(trackingId);
            }
        }
    }

    /**
     * Compare tracking data between legacy and GTM systems
     */
    private compareTrackingData(trackingId: string): void {
        const trackingEntry = this.validationData.get(trackingId);
        if (!trackingEntry?.legacy || !trackingEntry?.gtm) {
            return;
        }

        const legacy = trackingEntry.legacy;
        const gtm = trackingEntry.gtm;

        const comparison: ComparisonResult = {
            trackingId,
            timestamp: Date.now(),
            legacy: {
                success: legacy.success,
                conversionType: legacy.conversionData.event || legacy.conversionData.eventName,
                value: legacy.conversionData.value,
                currency: legacy.conversionData.currency
            },
            gtm: {
                success: gtm.success,
                conversionType: gtm.conversionData.event,
                value: gtm.conversionData.value,
                currency: gtm.conversionData.currency,
                validationReason: gtm.validationReason
            },
            discrepancies: [],
            hasDiscrepancies: false,
            severity: 'none'
        };

        // Check for discrepancies
        if (legacy.success !== gtm.success) {
            comparison.discrepancies.push({
                type: 'success_mismatch',
                legacy: legacy.success,
                gtm: gtm.success,
                severity: 'high'
            });
        }

        if (legacy.conversionData.value !== gtm.conversionData.value) {
            comparison.discrepancies.push({
                type: 'value_mismatch',
                legacy: legacy.conversionData.value,
                gtm: gtm.conversionData.value,
                severity: 'medium'
            });
        }

        if (legacy.conversionData.currency !== gtm.conversionData.currency) {
            comparison.discrepancies.push({
                type: 'currency_mismatch',
                legacy: legacy.conversionData.currency,
                gtm: gtm.conversionData.currency,
                severity: 'low'
            });
        }

        // Calculate timing difference
        const timingDiff = Math.abs(gtm.timestamp - legacy.timestamp);
        if (timingDiff > 5000) { // More than 5 seconds difference
            comparison.discrepancies.push({
                type: 'timing_difference',
                difference: timingDiff,
                severity: 'low'
            });
        }

        comparison.hasDiscrepancies = comparison.discrepancies.length > 0;
        comparison.severity = this.calculateOverallSeverity(comparison.discrepancies);

        this.comparisonResults.push(comparison);

        // Store results
        this.saveValidationResults();

        // Track comparison result
        migrationFeatureFlags.trackMigrationEvent('parallel_tracking_comparison', {
            trackingId,
            hasDiscrepancies: comparison.hasDiscrepancies,
            severity: comparison.severity,
            discrepancyCount: comparison.discrepancies.length
        });

        // Alert on high severity discrepancies
        if (comparison.severity === 'high') {
            this.alertHighSeverityDiscrepancy(comparison);
        }
    }

    /**
     * Calculate overall severity from discrepancies
     */
    private calculateOverallSeverity(discrepancies: Discrepancy[]): 'high' | 'medium' | 'low' | 'none' {
        if (discrepancies.some(d => d.severity === 'high')) {
            return 'high';
        }
        if (discrepancies.some(d => d.severity === 'medium')) {
            return 'medium';
        }
        if (discrepancies.length > 0) {
            return 'low';
        }
        return 'none';
    }

    /**
     * Alert on high severity discrepancies
     */
    private alertHighSeverityDiscrepancy(comparison: ComparisonResult): void {
        console.error('[ParallelValidator] High severity discrepancy detected:', comparison);

        // Track critical error
        if (window.gtag) {
            window.gtag('event', 'parallel_tracking_error', {
                event_category: 'migration',
                event_label: 'high_severity_discrepancy',
                value: 1
            });
        }

        // Consider emergency rollback if too many high severity issues
        const recentHighSeverity = this.comparisonResults
            .filter(r => r.timestamp > Date.now() - 300000) // Last 5 minutes
            .filter(r => r.severity === 'high');

        if (recentHighSeverity.length >= 3) {
            migrationFeatureFlags.emergencyRollback('Multiple high severity tracking discrepancies detected');
        }
    }

    /**
     * Save validation results to localStorage
     */
    private saveValidationResults(): void {
        try {
            const dataToSave: StoredValidationData = {
                comparisonResults: this.comparisonResults.slice(-50), // Keep last 50 results
                lastUpdated: Date.now()
            };

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('parallel_tracking_validation', JSON.stringify(dataToSave));
            }
        } catch (error) {
            console.warn('[ParallelValidator] Failed to save validation results:', error);
        }
    }

    /**
     * Get validation summary statistics
     */
    getValidationSummary(timeRange: number = 3600000): ValidationSummary { // Default 1 hour
        const cutoff = Date.now() - timeRange;
        const recentResults = this.comparisonResults.filter(r => r.timestamp > cutoff);

        const summary: ValidationSummary = {
            totalComparisons: recentResults.length,
            successfulComparisons: recentResults.filter(r => !r.hasDiscrepancies).length,
            discrepancyRate: '0',
            severityBreakdown: {
                high: recentResults.filter(r => r.severity === 'high').length,
                medium: recentResults.filter(r => r.severity === 'medium').length,
                low: recentResults.filter(r => r.severity === 'low').length
            },
            commonDiscrepancies: this.getCommonDiscrepancies(recentResults)
        };

        if (summary.totalComparisons > 0) {
            summary.discrepancyRate = ((summary.totalComparisons - summary.successfulComparisons) / summary.totalComparisons * 100).toFixed(2);
        }

        return summary;
    }

    /**
     * Get common discrepancy types
     */
    private getCommonDiscrepancies(results: ComparisonResult[]): Array<{ type: string; count: number }> {
        const discrepancyTypes: Record<string, number> = {};

        results.forEach(result => {
            result.discrepancies.forEach(discrepancy => {
                discrepancyTypes[discrepancy.type] = (discrepancyTypes[discrepancy.type] || 0) + 1;
            });
        });

        return Object.entries(discrepancyTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * Get detailed validation report
     */
    getValidationReport(): ValidationReport {
        return {
            summary: this.getValidationSummary(),
            recentComparisons: this.comparisonResults.slice(-10),
            migrationStatus: migrationFeatureFlags.getMigrationStatus(),
            validationEnabled: this.validationEnabled
        };
    }

    /**
     * Clear validation data
     */
    clearValidationData(): void {
        this.validationData.clear();
        this.comparisonResults = [];
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('parallel_tracking_validation');
        }

        migrationFeatureFlags.trackMigrationEvent('validation_data_cleared', {
            timestamp: Date.now()
        });
    }
}

// Create singleton instance
const parallelTrackingValidator = new ParallelTrackingValidator();

export default parallelTrackingValidator;