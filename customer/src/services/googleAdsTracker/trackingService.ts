/**
 * Tracking Service for Google Ads
 * Reuses performance monitoring and error handling patterns
 */

import type { ConversionData, TrackingOptions } from './types';
import { GOOGLE_ADS_CONVERSION_ID, TRACKING_CONFIG } from './constants';
import { configurationService } from './configurationService';
import performanceMonitor, { ERROR_TYPES } from '../performance';
import dataValidator from '../dataValidator';

export class TrackingService {
    /**
     * Execute tracking call with retry logic and error handling
     */
    async executeTrackingWithRetry(
        trackingFunction: () => void | Promise<void>,
        actionName: string,
        data: any,
        maxRetries: number = TRACKING_CONFIG.DEFAULT_MAX_RETRIES
    ): Promise<boolean> {
        let retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                // Check if gtag is available
                if (!configurationService.isGtagAvailable()) {
                    throw new Error('gtag function not available');
                }

                // Execute the tracking function
                await trackingFunction();

                // If we get here, the call was successful
                return true;

            } catch (error) {
                retryCount++;

                performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                    action: actionName,
                    error: error instanceof Error ? error.message : String(error),
                    retryCount: retryCount,
                    maxRetries: maxRetries,
                    data: data
                });

                // If we've exhausted retries, return false
                if (retryCount > maxRetries) {
                    console.error(`Failed to execute tracking after ${maxRetries} retries:`, error);
                    return false;
                }

                // Wait before retrying (exponential backoff)
                const delay = Math.min(
                    TRACKING_CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount - 1),
                    TRACKING_CONFIG.MAX_RETRY_DELAY
                );
                await new Promise(resolve => setTimeout(resolve, delay));

                console.log(`Retrying tracking call for ${actionName} (attempt ${retryCount}/${maxRetries})`);
            }
        }

        return false;
    }

    /**
     * Track a conversion event to Google Ads with error handling and validation
     */
    async trackConversion(
        conversionAction: string,
        conversionData: Partial<ConversionData> = {},
        options: TrackingOptions = {}
    ): Promise<boolean> {
        const startTime = performance.now();

        try {
            // Validate prerequisites
            const validation = configurationService.validatePrerequisites(conversionAction);
            if (!validation.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: conversionAction,
                    errors: validation.errors,
                    originalData: conversionData
                });
                return false;
            }

            // Validate conversion action
            if (!conversionAction || typeof conversionAction !== 'string') {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: conversionAction,
                    message: 'Invalid conversion action',
                    type: typeof conversionAction
                });
                return false;
            }

            // Get conversion label
            const conversionLabel = configurationService.getConversionLabel(conversionAction);
            if (!conversionLabel) {
                performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                    action: conversionAction,
                    message: 'No Google Ads conversion label found',
                    availableLabels: Object.keys(configurationService.getConfig().conversionLabels)
                });
                return false;
            }

            // Prepare conversion configuration
            const conversionConfig = {
                send_to: `${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
                ...conversionData
            };

            // Validate conversion data
            const validationResult = dataValidator.validateGoogleAdsConversion(conversionConfig) as any;
            if (!validationResult.isValid) {
                performanceMonitor.handleError(ERROR_TYPES.VALIDATION_ERROR, {
                    action: conversionAction,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    originalData: conversionData
                });
                return false;
            }

            // Use sanitized data
            const sanitizedConfig = validationResult.sanitizedData;

            // Execute tracking with retry logic
            const success = await this.executeTrackingWithRetry(
                () => window.gtag!('event', 'conversion', sanitizedConfig),
                conversionAction,
                sanitizedConfig,
                options.maxRetries || TRACKING_CONFIG.DEFAULT_MAX_RETRIES
            );

            if (success) {
                const trackingTime = performance.now() - startTime;
                performanceMonitor.recordMetric('tracking_call_time', {
                    action: conversionAction,
                    trackingTime: trackingTime,
                    timestamp: Date.now()
                });

                console.log(`Google Ads conversion tracked: ${conversionAction}`, sanitizedConfig);
                return true;
            }

            return false;

        } catch (error) {
            const trackingTime = performance.now() - startTime;
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                action: conversionAction,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                trackingTime: trackingTime,
                conversionData: conversionData
            });
            return false;
        }
    }

    /**
     * Track custom conversion with flexible parameters
     */
    async trackCustomConversion(
        conversionAction: string,
        customData: Record<string, any> = {}
    ): Promise<boolean> {
        if (!configurationService.shouldTrack()) {
            return false;
        }

        return this.trackConversion(conversionAction, customData as Partial<ConversionData>);
    }

    /**
     * Set conversion linker for cross-domain tracking
     */
    enableConversionLinker(): void {
        if (!configurationService.shouldTrack() || !GOOGLE_ADS_CONVERSION_ID) {
            return;
        }

        if (window.gtag) {
            window.gtag('config', GOOGLE_ADS_CONVERSION_ID, {
                conversion_linker: true
            });
        }
    }
}

export const trackingService = new TrackingService();