/**
 * Configuration Service for GTM GA4
 * Handles GA4 configuration and tag setup
 */

import type { CustomDimensions, EnhancedEcommerceConfig } from './types';
import {
    DEFAULT_GA4_MEASUREMENT_ID,
    BUSINESS_CONFIG,
    DEFAULT_CUSTOM_DIMENSIONS,
    CUSTOM_DIMENSION_CONFIGS,
    GTM_EVENTS
} from './constants';
import { dataLayerService } from './dataLayerService';


export class ConfigurationService {
    private ga4MeasurementId: string;
    private customDimensions: CustomDimensions;
    private enhancedEcommerceConfig: EnhancedEcommerceConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.ga4MeasurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID;
        this.customDimensions = DEFAULT_CUSTOM_DIMENSIONS;
        this.enhancedEcommerceConfig = {
            currency: BUSINESS_CONFIG.CURRENCY,
            send_to: this.ga4MeasurementId,
            enhanced_ecommerce: true,
            custom_map: this.customDimensions
        };
    }

    /**
     * Initialize GA4 configuration
     */
    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) {
                console.log('GTM GA4 Config: Already initialized');
                return true;
            }

            // Configure GA4 tags through GTM
            await this.configureGA4Tags();

            // Push initial GA4 configuration
            this.pushGA4Configuration();

            this.isInitialized = true;
            console.log('GTM GA4 Config: Successfully initialized with enhanced ecommerce');

            return true;
        } catch (error) {
            console.error('GTM GA4 Config: Initialization failed:', error);
            return false;
        }
    }

    /**
     * Configure all GA4 tags through GTM dataLayer events
     */
    private async configureGA4Tags(): Promise<void> {
        try {
            // Create GA4 configuration tag
            this.createGA4ConfigurationTag();

            // Create GA4 event tags for ecommerce
            this.createGA4EventTags();

            // Set up custom dimensions
            this.setupCustomDimensions();

            console.log('GTM GA4 Config: Tags configured successfully');
        } catch (error) {
            console.error('GTM GA4 Config: Tag configuration failed:', error);
            throw error;
        }
    }

    /**
     * Create GA4 configuration tag with enhanced ecommerce
     */
    private createGA4ConfigurationTag(): void {
        const configEvent = {
            event: GTM_EVENTS.CONFIG,
            ga4_config: {
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                send_page_view: false, // Handled by React Router PageViewTracker
                custom_map: this.customDimensions,
                // Enhanced ecommerce settings
                allow_enhanced_conversions: true,
                allow_google_signals: true,
                allow_ad_personalization_signals: true,
                // Custom parameters for tour business
                business_type: BUSINESS_CONFIG.BUSINESS_TYPE,
                industry: BUSINESS_CONFIG.INDUSTRY,
                location: BUSINESS_CONFIG.LOCATION,
                currency: BUSINESS_CONFIG.CURRENCY
            }
        };

        dataLayerService.pushEvent(configEvent);
    }

    /**
     * Create GA4 event tags for ecommerce tracking
     */
    private createGA4EventTags(): void {
        // Purchase event configuration
        this.createPurchaseEventTag();

        // Begin checkout event configuration
        this.createBeginCheckoutEventTag();

        // View item event configuration
        this.createViewItemEventTag();

        // Add payment info event configuration
        this.createAddPaymentInfoEventTag();

        console.log('GTM GA4 Config: All ecommerce event tags created');
    }

    /**
     * Create purchase event tag configuration
     */
    private createPurchaseEventTag(): void {
        const purchaseTagConfig = {
            event: GTM_EVENTS.PURCHASE_CONFIG,
            tag_config: {
                tag_name: 'GA4 - Purchase Event',
                event_name: 'purchase',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    transaction_id: '{{Transaction ID}}',
                    value: '{{Transaction Value}}',
                    currency: BUSINESS_CONFIG.CURRENCY,
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    tour_location: '{{Tour Location}}',
                    booking_date: '{{Booking Date}}',
                    payment_provider: '{{Payment Provider}}',
                    // Enhanced conversion parameters
                    user_data: '{{Enhanced Conversion Data}}'
                },
                trigger: 'purchase'
            }
        };

        dataLayerService.pushEvent(purchaseTagConfig);
    }

    /**
     * Create begin checkout event tag configuration
     */
    private createBeginCheckoutEventTag(): void {
        const beginCheckoutTagConfig = {
            event: GTM_EVENTS.BEGIN_CHECKOUT_CONFIG,
            tag_config: {
                tag_name: 'GA4 - Begin Checkout Event',
                event_name: 'begin_checkout',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Checkout Value}}',
                    currency: BUSINESS_CONFIG.CURRENCY,
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    checkout_step: 1,
                    checkout_option: 'tour_booking'
                },
                trigger: 'begin_checkout'
            }
        };

        dataLayerService.pushEvent(beginCheckoutTagConfig);
    }

    /**
     * Create view item event tag configuration
     */
    private createViewItemEventTag(): void {
        const viewItemTagConfig = {
            event: GTM_EVENTS.VIEW_ITEM_CONFIG,
            tag_config: {
                tag_name: 'GA4 - View Item Event',
                event_name: 'view_item',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Item Value}}',
                    currency: BUSINESS_CONFIG.CURRENCY,
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    tour_location: '{{Tour Location}}',
                    item_category: 'tour',
                    content_type: 'product'
                },
                trigger: 'view_item'
            }
        };

        dataLayerService.pushEvent(viewItemTagConfig);
    }

    /**
     * Create add payment info event tag configuration
     */
    private createAddPaymentInfoEventTag(): void {
        const addPaymentInfoTagConfig = {
            event: GTM_EVENTS.ADD_PAYMENT_INFO_CONFIG,
            tag_config: {
                tag_name: 'GA4 - Add Payment Info Event',
                event_name: 'add_payment_info',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Payment Value}}',
                    currency: BUSINESS_CONFIG.CURRENCY,
                    payment_type: '{{Payment Provider}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    checkout_step: 2,
                    checkout_option: 'payment_info'
                },
                trigger: 'add_payment_info'
            }
        };

        dataLayerService.pushEvent(addPaymentInfoTagConfig);
    }

    /**
     * Set up custom dimensions for tour-specific data
     */
    private setupCustomDimensions(): void {
        const customDimensionsConfig = {
            event: GTM_EVENTS.CUSTOM_DIMENSIONS_CONFIG,
            custom_dimensions_config: {
                measurement_id: this.ga4MeasurementId,
                custom_dimensions: CUSTOM_DIMENSION_CONFIGS
            }
        };

        dataLayerService.pushEvent(customDimensionsConfig);
    }

    /**
     * Push initial GA4 configuration to dataLayer
     */
    private pushGA4Configuration(): void {
        const initialConfig = {
            event: GTM_EVENTS.INITIALIZE,
            ga4_measurement_id: this.ga4MeasurementId,
            enhanced_ecommerce_enabled: true,
            custom_dimensions_enabled: true,
            tour_business_config: BUSINESS_CONFIG
        };

        dataLayerService.pushEvent(initialConfig);
    }

    /**
     * Enable debug mode
     */
    enableDebugMode(enabled: boolean = true): void {
        dataLayerService.setDebugMode(enabled);

        if (enabled) {
            console.log('GTM GA4 Config: Debug mode enabled');

            // Push debug configuration
            dataLayerService.pushEvent({
                event: GTM_EVENTS.DEBUG_MODE,
                debug_mode: true,
                measurement_id: this.ga4MeasurementId
            });
        }
    }

    /**
     * Get configuration status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            measurementId: this.ga4MeasurementId,
            debugMode: dataLayerService.isDebugMode(),
            customDimensions: this.customDimensions,
            enhancedEcommerceEnabled: true,
            dataLayerLength: dataLayerService.getDataLayerLength()
        };
    }

    /**
     * Get enhanced ecommerce configuration
     */
    getEnhancedEcommerceConfig(): EnhancedEcommerceConfig {
        return this.enhancedEcommerceConfig;
    }

    /**
     * Get measurement ID
     */
    getMeasurementId(): string {
        return this.ga4MeasurementId;
    }

    /**
     * Get custom dimensions
     */
    getCustomDimensions(): CustomDimensions {
        return this.customDimensions;
    }
}

export const configurationService = new ConfigurationService();