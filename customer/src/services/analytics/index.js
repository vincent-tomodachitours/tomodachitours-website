// Main analytics service - exports all tracking functions
// This maintains backward compatibility with the original analytics.js

// Import statements first
import { trackPurchase, trackBeginCheckout, trackTourView, trackAddToCart } from './ecommerceTracking.js';
import { trackCartAbandonment, trackCheckoutAbandonment, trackFunnelStep } from './abandonmentTracking.js';
import {
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick
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
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick
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
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick,

    // Initialization
    initializeAnalytics
};

export default analyticsService;