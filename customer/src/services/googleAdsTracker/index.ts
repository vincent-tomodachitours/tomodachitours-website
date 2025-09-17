/**
 * Main Google Ads Conversion Tracking Service
 * 
 * Integrates with existing analytics.js to provide Google Ads conversion tracking
 * Reuses performance monitoring, validation, and privacy management
 */

import type {
    ConversionData,
    TransactionData,
    TrackingData,
    TrackingOptions,
    EnhancedConversionData,
    CrossDeviceConversionData,
    ServerSideConversionData,
    GoogleAdsConfig
} from './types';

import { configurationService } from './configurationService';
import { trackingService } from './trackingService';
import { conversionService } from './conversionService';

export class GoogleAdsTracker {
    constructor() {
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
    }

    /**
     * Initialize Google Ads conversion tracking via GTM
     */
    initializeGoogleAdsTracking(): void {
        configurationService.initialize();
    }

    /**
     * Track a conversion event to Google Ads with error handling and validation
     */
    async trackGoogleAdsConversion(
        conversionAction: string,
        conversionData: Partial<ConversionData> = {},
        options: TrackingOptions = {}
    ): Promise<boolean> {
        return trackingService.trackConversion(conversionAction, conversionData, options);
    }

    /**
     * Track a purchase conversion with transaction details and enhanced attribution
     */
    async trackGoogleAdsPurchase(
        transactionData: TransactionData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        return conversionService.trackPurchase(transactionData, options);
    }

    /**
     * Track begin checkout conversion with enhanced attribution data
     */
    async trackGoogleAdsBeginCheckout(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        return conversionService.trackBeginCheckout(tourData, options);
    }

    /**
     * Track view item conversion for remarketing with enhanced data
     */
    async trackGoogleAdsViewItem(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        return conversionService.trackViewItem(tourData, options);
    }

    /**
     * Track add to cart conversion (when user selects a tour) with enhanced data
     */
    async trackGoogleAdsAddToCart(
        tourData: TrackingData,
        options: TrackingOptions = {}
    ): Promise<boolean> {
        return conversionService.trackAddToCart(tourData, options);
    }

    /**
     * Track custom conversion with flexible parameters
     */
    async trackCustomGoogleAdsConversion(
        conversionAction: string,
        customData: Record<string, any> = {}
    ): Promise<boolean> {
        return trackingService.trackCustomConversion(conversionAction, customData);
    }

    /**
     * Track tour-specific conversion with enhanced parameters
     */
    async trackTourSpecificGoogleAdsConversion(
        tourId: string,
        conversionAction: string,
        conversionData: Partial<ConversionData> = {}
    ): Promise<boolean> {
        return conversionService.trackTourSpecificConversion(tourId, conversionAction, conversionData);
    }

    /**
     * Set conversion linker for cross-domain tracking
     */
    enableConversionLinker(): void {
        trackingService.enableConversionLinker();
    }

    /**
     * Track enhanced conversion with cross-device data
     */
    trackEnhancedConversion(
        conversionAction: string,
        conversionData: ConversionData,
        enhancedData: EnhancedConversionData = {}
    ): boolean {
        return conversionService.trackEnhancedConversion(conversionAction, conversionData, enhancedData);
    }

    /**
     * Track cross-device conversion
     */
    trackCrossDeviceConversion(crossDeviceData: CrossDeviceConversionData): boolean {
        return conversionService.trackCrossDeviceConversion(crossDeviceData);
    }

    /**
     * Track server-side conversion for critical events
     */
    trackServerSideConversion(serverConversionData: ServerSideConversionData): boolean {
        return conversionService.trackServerSideConversion(serverConversionData);
    }

    /**
     * Track offline conversion (for phone bookings, etc.)
     */
    trackOfflineConversion(gclid: string, conversionData: ConversionData): boolean {
        return conversionService.trackOfflineConversion(gclid, conversionData);
    }

    /**
     * Get current Google Ads configuration
     */
    getGoogleAdsConfig(): GoogleAdsConfig {
        return configurationService.getConfig();
    }
}

// Create singleton instance
const googleAdsTracker = new GoogleAdsTracker();

// Export individual functions for backward compatibility
export const initializeGoogleAdsTracking = () => googleAdsTracker.initializeGoogleAdsTracking();
export const trackGoogleAdsConversion = (conversionAction: string, conversionData?: Partial<ConversionData>, options?: TrackingOptions) =>
    googleAdsTracker.trackGoogleAdsConversion(conversionAction, conversionData, options);
export const trackGoogleAdsPurchase = (transactionData: TransactionData, options?: TrackingOptions) =>
    googleAdsTracker.trackGoogleAdsPurchase(transactionData, options);
export const trackGoogleAdsBeginCheckout = (tourData: TrackingData, options?: TrackingOptions) =>
    googleAdsTracker.trackGoogleAdsBeginCheckout(tourData, options);
export const trackGoogleAdsViewItem = (tourData: TrackingData, options?: TrackingOptions) =>
    googleAdsTracker.trackGoogleAdsViewItem(tourData, options);
export const trackGoogleAdsAddToCart = (tourData: TrackingData, options?: TrackingOptions) =>
    googleAdsTracker.trackGoogleAdsAddToCart(tourData, options);
export const trackCustomGoogleAdsConversion = (conversionAction: string, customData?: Record<string, any>) =>
    googleAdsTracker.trackCustomGoogleAdsConversion(conversionAction, customData);
export const trackTourSpecificGoogleAdsConversion = (tourId: string, conversionAction: string, conversionData?: Partial<ConversionData>) =>
    googleAdsTracker.trackTourSpecificGoogleAdsConversion(tourId, conversionAction, conversionData);
export const enableConversionLinker = () => googleAdsTracker.enableConversionLinker();
export const trackEnhancedConversion = (conversionAction: string, conversionData: ConversionData, enhancedData?: EnhancedConversionData) =>
    googleAdsTracker.trackEnhancedConversion(conversionAction, conversionData, enhancedData);
export const trackCrossDeviceConversion = (crossDeviceData: CrossDeviceConversionData) =>
    googleAdsTracker.trackCrossDeviceConversion(crossDeviceData);
export const trackServerSideConversion = (serverConversionData: ServerSideConversionData) =>
    googleAdsTracker.trackServerSideConversion(serverConversionData);
export const trackOfflineConversion = (gclid: string, conversionData: ConversionData) =>
    googleAdsTracker.trackOfflineConversion(gclid, conversionData);
export const getGoogleAdsConfig = () => googleAdsTracker.getGoogleAdsConfig();

export default googleAdsTracker;

// Re-export types for convenience
export type {
    ConversionData,
    TransactionData,
    TrackingData,
    TrackingOptions,
    EnhancedConversionData,
    CrossDeviceConversionData,
    ServerSideConversionData,
    GoogleAdsConfig
} from './types';