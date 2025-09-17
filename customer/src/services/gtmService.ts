/**
 * Google Tag Manager Service
 * Provides centralized GTM integration and dataLayer management
 * Replaces direct gtag calls with GTM-managed tags
 * Integrated with migration system for gradual rollout
 * 
 * @deprecated This file has been refactored into smaller modules.
 * Please use the new modular structure in ./gtmService/
 */

// Re-export the new service for backward compatibility
export { default } from './gtmService/index';
export type {
    GTMInitializationOptions,
    DataLayerEvent,
    ConversionData,
    CustomerData,
    PricingContext,
    GTMStatus
} from './gtmService/index';