/**
 * Main Google Tag Manager Service
 * 
 * Provides centralized GTM integration and dataLayer management
 * Replaces direct gtag calls with GTM-managed tags
 * Integrated with migration system for gradual rollout
 */

import type {
    GTMInitializationOptions,
    ConversionData,
    CustomerData,
    PricingContext,
    GTMStatus
} from './types';

import { initializationService } from './initializationService';
import { eventService } from './eventService';
import { conversionService } from './conversionService';
import gtmGA4Config from '../gtm';

export class GTMService {
    constructor() {
        // Initialize dataLayer if not exists
        window.dataLayer = window.dataLayer || [];

        // Check if GTM should be initialized based on migration flags
        if (initializationService.shouldInitializeGTM()) {
            // Auto-initialize if container ID is available and migration allows it
            const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;
            if (containerId) {
                this.initialize(containerId);
            }
        }

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.pushEvent = this.pushEvent.bind(this);
        this.setUserProperties = this.setUserProperties.bind(this);
        this.enableDebugMode = this.enableDebugMode.bind(this);
        this.validateTagFiring = this.validateTagFiring.bind(this);
        this.trackConversion = this.trackConversion.bind(this);
    }

    /**
     * Check if GTM should be initialized based on migration flags
     */
    shouldInitializeGTM(): boolean {
        return initializationService.shouldInitializeGTM();
    }

    /**
     * Initialize GTM container
     */
    async initialize(containerId: string | null = null, options: GTMInitializationOptions = {}): Promise<boolean> {
        const success = await initializationService.initialize(containerId, options);

        if (success) {
            // Initialize GA4 configuration
            await gtmGA4Config.initialize();
        }

        return success;
    }

    /**
     * Push event to dataLayer
     */
    pushEvent(eventName: string, eventData: Record<string, any> = {}, options: Record<string, any> = {}): void {
        eventService.pushEvent(eventName, eventData, options);
    }

    /**
     * Set user properties in dataLayer
     */
    setUserProperties(properties: Record<string, any> = {}): void {
        eventService.setUserProperties(properties);
    }

    /**
     * Enable debug mode for detailed logging
     */
    enableDebugMode(enabled: boolean = true): void {
        eventService.enableDebugMode(enabled);
    }

    /**
     * Validate if a specific tag is firing
     */
    async validateTagFiring(tagName: string): Promise<boolean> {
        return eventService.validateTagFiring(tagName);
    }

    /**
     * Track Google Ads conversion with proper configuration and dynamic pricing
     */
    trackConversion(
        conversionType: string,
        eventData: ConversionData = {},
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        return conversionService.trackConversion(conversionType, eventData, customerData, pricingContext);
    }

    /**
     * Track purchase conversion with enhanced data and dynamic pricing
     */
    trackPurchaseConversion(
        transactionData: ConversionData,
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        return conversionService.trackPurchaseConversion(transactionData, customerData, pricingContext);
    }

    /**
     * Track begin checkout conversion with dynamic pricing
     */
    trackBeginCheckoutConversion(
        checkoutData: ConversionData,
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        return conversionService.trackBeginCheckoutConversion(checkoutData, customerData, pricingContext);
    }

    /**
     * Track view item conversion
     */
    trackViewItemConversion(itemData: ConversionData): boolean {
        return conversionService.trackViewItemConversion(itemData);
    }

    /**
     * Track specific tour view with detailed tour information
     */
    trackSpecificTourView(tourViewData: Record<string, any>): boolean {
        return conversionService.trackSpecificTourView(tourViewData);
    }

    /**
     * Track add payment info conversion
     */
    trackAddPaymentInfoConversion(
        paymentData: ConversionData,
        customerData: CustomerData | null = null
    ): boolean {
        return conversionService.trackAddPaymentInfoConversion(paymentData, customerData);
    }

    /**
     * Track direct Google Ads conversion (fallback for GTM verification issues)
     */
    trackDirectGoogleAdsConversion(conversionLabel: string, conversionData: ConversionData = {}): boolean {
        return conversionService.trackDirectGoogleAdsConversion(conversionLabel, conversionData);
    }

    /**
     * Track conversion with both GTM and direct Google Ads (for verification)
     */
    trackConversionWithFallback(
        conversionType: string,
        eventData: ConversionData = {},
        customerData: CustomerData | null = null,
        pricingContext: PricingContext = {}
    ): boolean {
        return conversionService.trackConversionWithFallback(conversionType, eventData, customerData, pricingContext);
    }

    /**
     * Get current GTM status including conversion configuration
     */
    getStatus(): GTMStatus {
        const initStatus = initializationService.getStatus();

        return {
            isInitialized: initStatus.isInitialized,
            containerId: initStatus.containerId,
            fallbackMode: initStatus.fallbackMode,
            debugMode: eventService.isDebugMode(),
            dataLayerLength: window.dataLayer?.length || 0,
            conversionConfig: conversionService.getDebugInfo(),
            ga4Config: gtmGA4Config.getStatus()
        };
    }
}

// Create singleton instance
const gtmService = new GTMService();

export default gtmService;

// Re-export types for convenience
export type {
    GTMInitializationOptions,
    DataLayerEvent,
    ConversionData,
    CustomerData,
    PricingContext,
    GTMStatus
} from './types';