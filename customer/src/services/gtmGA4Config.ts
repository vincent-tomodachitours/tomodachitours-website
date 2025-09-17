/**
 * GTM GA4 Configuration Service
 * Handles GA4 integration through Google Tag Manager with enhanced ecommerce tracking
 * Implements task 12: Configure GTM tags for GA4 integration and ecommerce tracking
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./gtm/
 */

// Re-export the new service for backward compatibility
export { default } from './gtm';
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
} from './gtm';