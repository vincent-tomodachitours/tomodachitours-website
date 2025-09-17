/**
 * Validation Service for Production Monitoring
 * Handles conversion tracking validation and monitoring
 */

import type { ConversionData } from './types';
import { ALERT_SEVERITY } from './types';
import { alertService } from './alertService';

export class ValidationService {
    /**
     * Setup conversion tracking validation
     */
    setupConversionValidation(): void {
        // Validate conversion events
        if (typeof window !== 'undefined' && window.gtag) {
            const originalGtag = window.gtag;
            window.gtag = (...args: any[]) => {
                try {
                    // Validate conversion events
                    if (args[0] === 'event' && args[1] === 'conversion') {
                        this.validateConversionEvent(args[2]);
                    }

                    return originalGtag.apply(this, args);
                } catch (error) {
                    alertService.handleAlert({
                        type: 'conversion_validation_error',
                        severity: ALERT_SEVERITY.HIGH,
                        message: `Conversion validation failed: ${(error as Error).message}`,
                        data: { args, error: (error as Error).stack }
                    });

                    throw error;
                }
            };
        }

        console.log('Conversion validation setup completed');
    }

    /**
     * Validate conversion event
     */
    private validateConversionEvent(conversionData: ConversionData): void {
        const issues: string[] = [];

        // Check required fields
        if (!conversionData.send_to) {
            issues.push('Missing send_to parameter');
        }

        if (!conversionData.value && conversionData.value !== 0) {
            issues.push('Missing value parameter');
        }

        if (!conversionData.currency) {
            issues.push('Missing currency parameter');
        }

        // Check for placeholder values
        if (conversionData.send_to && conversionData.send_to.includes('XXXXXXXXX')) {
            issues.push('Placeholder conversion label detected');
        }

        if (issues.length > 0) {
            alertService.handleAlert({
                type: 'conversion_validation_failed',
                severity: ALERT_SEVERITY.HIGH,
                message: `Conversion event validation failed: ${issues.join(', ')}`,
                data: { conversionData, issues }
            });
        }
    }

    /**
     * Validate tracking configuration
     */
    validateTrackingConfiguration(): boolean {
        const issues: string[] = [];

        // Check environment variables
        if (!process.env.REACT_APP_GA_MEASUREMENT_ID) {
            issues.push('GA4 measurement ID not configured');
        }

        if (!process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID) {
            issues.push('Google Ads conversion ID not configured');
        }

        if (!process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS) {
            issues.push('Google Ads conversion labels not configured');
        }

        // Check for placeholder values
        const placeholders = ['XXXXXXXXXX', 'XXXXXXXXX'];
        const envVars = [
            process.env.REACT_APP_GA_MEASUREMENT_ID,
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
            process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS
        ];

        envVars.forEach((value, index) => {
            if (value && placeholders.some(placeholder => value.includes(placeholder))) {
                const varNames = ['GA4 measurement ID', 'Google Ads conversion ID', 'conversion labels'];
                issues.push(`${varNames[index]} contains placeholder values`);
            }
        });

        if (issues.length > 0) {
            alertService.handleAlert({
                type: 'configuration_validation_failed',
                severity: ALERT_SEVERITY.CRITICAL,
                message: `Configuration validation failed: ${issues.join(', ')}`,
                data: { issues }
            });
            return false;
        }

        return true;
    }

    /**
     * Validate runtime environment
     */
    validateRuntimeEnvironment(): boolean {
        const issues: string[] = [];

        // Check if we're in production
        if (process.env.NODE_ENV !== 'production' &&
            process.env.REACT_APP_ENVIRONMENT !== 'production') {
            return true; // Skip validation in non-production
        }

        // Check if gtag is available
        if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
            issues.push('gtag function not available');
        }

        // Check if dataLayer is available
        if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) {
            issues.push('dataLayer not available');
        }

        if (issues.length > 0) {
            alertService.handleAlert({
                type: 'runtime_validation_failed',
                severity: ALERT_SEVERITY.CRITICAL,
                message: `Runtime validation failed: ${issues.join(', ')}`,
                data: { issues }
            });
            return false;
        }

        return true;
    }
}

export const validationService = new ValidationService();