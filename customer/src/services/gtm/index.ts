/**
 * Main GTM GA4 Configuration Service
 * 
 * Handles GA4 integration through Google Tag Manager with enhanced ecommerce tracking
 * Implements task 12: Configure GTM tags for GA4 integration and ecommerce tracking
 */

import type {
    ValidationResults,
    Status,
    EnhancedEcommerceConfig,
    TourData,
    TransactionData,
    CheckoutData,
    ItemData,
    PaymentData,
    TourViewData
} from './types';

import { configurationService } from './configurationService';
import { eventTrackingService } from './eventTrackingService';
import { validationService } from './validationService';
import { dataLayerService } from './dataLayerService';

export class GTMGA4Config {
    /**
     * Initialize GA4 configuration through GTM
     */
    async initialize(): Promise<boolean> {
        return configurationService.initialize();
    }

    /**
     * Track GA4 purchase event
     */
    trackGA4Purchase(transactionData: TransactionData, tourData: TourData = {}): boolean {
        return eventTrackingService.trackGA4Purchase(transactionData, tourData);
    }

    /**
     * Track GA4 begin checkout event
     */
    trackGA4BeginCheckout(checkoutData: CheckoutData, tourData: TourData = {}): boolean {
        return eventTrackingService.trackGA4BeginCheckout(checkoutData, tourData);
    }

    /**
     * Track GA4 view item event
     */
    trackGA4ViewItem(itemData: ItemData, tourData: TourData = {}): boolean {
        return eventTrackingService.trackGA4ViewItem(itemData, tourData);
    }

    /**
     * Track GA4 add payment info event
     */
    trackGA4AddPaymentInfo(paymentData: PaymentData, tourData: TourData = {}): boolean {
        return eventTrackingService.trackGA4AddPaymentInfo(paymentData, tourData);
    }

    /**
     * Track specific tour view event with detailed tour information
     */
    trackGA4SpecificTourView(tourViewData: TourViewData): boolean {
        return eventTrackingService.trackGA4SpecificTourView(tourViewData);
    }

    /**
     * Track GA4 ecommerce event with enhanced data
     */
    trackGA4EcommerceEvent(eventName: string, eventData: any, tourData: TourData = {}): boolean {
        return eventTrackingService.trackGA4EcommerceEvent(eventName, eventData, tourData);
    }

    /**
     * Validate GA4 data flow and ecommerce reporting accuracy
     */
    async validateGA4DataFlow(): Promise<ValidationResults> {
        return validationService.validateGA4DataFlow();
    }

    /**
     * Get GA4 configuration status
     */
    getStatus(): Status {
        return configurationService.getStatus();
    }

    /**
     * Enable debug mode for detailed logging
     */
    enableDebugMode(enabled: boolean = true): void {
        configurationService.enableDebugMode(enabled);
    }

    /**
     * Get enhanced ecommerce configuration
     */
    getEnhancedEcommerceConfig(): EnhancedEcommerceConfig {
        return configurationService.getEnhancedEcommerceConfig();
    }

    /**
     * Get measurement ID
     */
    getMeasurementId(): string {
        return configurationService.getMeasurementId();
    }

    /**
     * Get custom dimensions
     */
    getCustomDimensions() {
        return configurationService.getCustomDimensions();
    }

    /**
     * Check if dataLayer is available
     */
    isDataLayerAvailable(): boolean {
        return dataLayerService.isDataLayerAvailable();
    }

    /**
     * Get dataLayer length
     */
    getDataLayerLength(): number {
        return dataLayerService.getDataLayerLength();
    }
}

// Create singleton instance
const gtmGA4Config = new GTMGA4Config();

export default gtmGA4Config;

// Re-export types for convenience
export type {
    CustomDimensions,
    EnhancedEcommerceConfig,
    TourData,
    TransactionData,
    CheckoutData,
    ItemData,
    PaymentData,
    TourViewData,
    ValidationResults,
    TestResults,
    Status,
    GA4EventData,
    TagConfig
} from './types';