/**
 * Configuration Service for Google Ads Tracker
 * Reuses privacy manager and validation patterns
 */

import type { GoogleAdsConfig } from './types';
import { GOOGLE_ADS_CONVERSION_ID, GOOGLE_ADS_CONVERSION_LABELS } from './constants';
import privacyManager from '../privacyManager';

export class ConfigurationService {
    private isProduction: boolean;

    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Check if Google Ads tracking should be enabled
     */
    shouldTrack(): boolean {
        const analyticsEnabled = this.isProduction || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
        const hasMarketingConsent = privacyManager.canTrackMarketing();
        return analyticsEnabled && hasMarketingConsent;
    }

    /**
     * Check if Google Ads is properly configured
     */
    isConfigured(): boolean {
        return !!(GOOGLE_ADS_CONVERSION_ID && Object.keys(GOOGLE_ADS_CONVERSION_LABELS).length > 0);
    }

    /**
     * Get Google Ads configuration
     */
    getConfig(): GoogleAdsConfig {
        return {
            conversionId: GOOGLE_ADS_CONVERSION_ID,
            conversionLabels: GOOGLE_ADS_CONVERSION_LABELS,
            isEnabled: this.shouldTrack() && this.isConfigured()
        };
    }

    /**
     * Get conversion label for action
     */
    getConversionLabel(action: string): string | null {
        return GOOGLE_ADS_CONVERSION_LABELS[action] || null;
    }

    /**
     * Check if gtag is available
     */
    isGtagAvailable(): boolean {
        return typeof window !== 'undefined' && typeof window.gtag === 'function';
    }

    /**
     * Validate tracking prerequisites
     */
    validatePrerequisites(actionName?: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check if tracking is enabled
        if (!this.shouldTrack()) {
            errors.push('Tracking disabled due to privacy settings or environment');
        }

        // Check if Google Ads is configured
        if (!GOOGLE_ADS_CONVERSION_ID) {
            errors.push('Google Ads conversion ID not configured');
        }

        // Check if gtag is available
        if (!this.isGtagAvailable()) {
            errors.push('gtag function not available');
        }

        // Check if action has a conversion label
        if (actionName && !this.getConversionLabel(actionName)) {
            errors.push(`No conversion label configured for action: ${actionName}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Initialize Google Ads tracking via GTM
     */
    initialize(): void {
        if (!this.shouldTrack() || !GOOGLE_ADS_CONVERSION_ID) {
            console.log('Google Ads tracking disabled or not configured');
            return;
        }

        // Initialize dataLayer if not exists
        window.dataLayer = window.dataLayer || [];

        // Send initialization event to GTM
        window.dataLayer.push({
            event: 'google_ads_init',
            google_ads_conversion_id: GOOGLE_ADS_CONVERSION_ID,
            conversion_labels: GOOGLE_ADS_CONVERSION_LABELS
        });

        console.log('Google Ads conversion tracking initialized via GTM');
    }
}

export const configurationService = new ConfigurationService();