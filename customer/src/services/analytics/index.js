// Main analytics service - exports all tracking functions
// This maintains backward compatibility with the original analytics.js

// Import statements first
import { trackPurchase, trackBeginCheckout, trackTourView, trackAddToCart } from './ecommerceTracking.js';
import { trackCartAbandonment, trackCheckoutAbandonment, trackFunnelStep } from './abandonmentTracking.js';
import {
    trackContactSubmission,
    trackWhatsAppClick,
    trackPhoneClick,
    trackPricingView,
    trackScrollDepth,
    trackDownload,
    trackVideoPlay,
    trackSearch,
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent
} from './basicTracking.js';
import { initializeAnalytics } from './initialization.js';

// Ecommerce tracking
export {
    trackPurchase,
    trackBeginCheckout,
    trackTourView,
    trackAddToCart
} from './ecommerceTracking.js';

// Abandonment tracking
export {
    trackCartAbandonment,
    trackCheckoutAbandonment,
    trackFunnelStep
} from './abandonmentTracking.js';

// Basic tracking
export {
    trackContactSubmission,
    trackWhatsAppClick,
    trackPhoneClick,
    trackPricingView,
    trackScrollDepth,
    trackDownload,
    trackVideoPlay,
    trackSearch,
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent
} from './basicTracking.js';

// Initialization
export {
    initializeAnalytics
} from './initialization.js';

const analyticsService = {
    // Ecommerce tracking
    trackPurchase,
    trackBeginCheckout,
    trackTourView,
    trackAddToCart,

    // Abandonment tracking
    trackCartAbandonment,
    trackCheckoutAbandonment,
    trackFunnelStep,

    // Basic tracking
    trackContactSubmission,
    trackWhatsAppClick,
    trackPhoneClick,
    trackPricingView,
    trackScrollDepth,
    trackDownload,
    trackVideoPlay,
    trackSearch,
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,

    // Initialization
    initializeAnalytics
};

export default analyticsService;