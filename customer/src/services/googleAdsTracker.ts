/**
 * Google Ads Conversion Tracking Service
 * Integrates with existing analytics.js to provide Google Ads conversion tracking
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./googleAdsTracker/
 */

// Re-export the new service for backward compatibility
export {
    default,
    initializeGoogleAdsTracking,
    trackGoogleAdsConversion,
    trackGoogleAdsPurchase,
    trackGoogleAdsBeginCheckout,
    trackGoogleAdsViewItem,
    trackGoogleAdsAddToCart,
    trackCustomGoogleAdsConversion,
    trackTourSpecificGoogleAdsConversion,
    enableConversionLinker,
    trackEnhancedConversion,
    trackCrossDeviceConversion,
    trackServerSideConversion,
    trackOfflineConversion,
    getGoogleAdsConfig
} from './googleAdsTracker/index';

export type {
    ConversionData,
    TransactionData,
    TrackingData,
    TrackingOptions,
    EnhancedConversionData,
    CrossDeviceConversionData,
    ServerSideConversionData,
    GoogleAdsConfig
} from './googleAdsTracker/index';