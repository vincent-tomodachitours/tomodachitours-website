/**
 * Dynamic Remarketing Service for Google Ads
 * 
 * This service implements dynamic remarketing functionality that allows Google Ads
 * to show personalized ads featuring specific tours that users have viewed or
 * shown interest in. It integrates with the existing analytics and remarketing
 * systems to provide enhanced targeting capabilities.
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./dynamicRemarketing/
 */

// Re-export the new service for backward compatibility
export { default } from './dynamicRemarketing';
export type {
    TourProduct,
    DynamicAudienceConfig,
    DynamicAudience,
    DynamicRemarketingParameters,
    UserPreferences,
    ProductCatalogData
} from './dynamicRemarketing';