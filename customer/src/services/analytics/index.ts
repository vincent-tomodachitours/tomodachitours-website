// Main analytics service - exports all tracking functions
// This maintains backward compatibility with the original analytics.js

// Import statements first
import { trackPurchase, trackBeginCheckout, trackAddToCart, trackViewItem } from './ecommerceTracking';
import { trackCartAbandonment, trackCheckoutAbandonment, trackFunnelStep } from './abandonmentTracking';
import {
    trackEvent,
    trackPageView,
    trackConversion,
    initialize,
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick,
    trackTourImageClickExtended,
    trackTourTabClickExtended
} from './basicTracking';
import { initializeAnalytics } from './initialization';
import { AnalyticsService } from '../../types/services';

// Ecommerce tracking
export {
    trackPurchase,
    trackBeginCheckout,
    trackTourView,
    trackAddToCart,
    trackViewItem
} from './ecommerceTracking';

// Abandonment tracking
export {
    trackCartAbandonment,
    trackCheckoutAbandonment,
    trackFunnelStep
} from './abandonmentTracking';

// Basic tracking
export {
    trackEvent,
    trackPageView,
    trackConversion,
    initialize,
    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick
} from './basicTracking';

// Initialization
export {
    initializeAnalytics
} from './initialization';

const analyticsService: AnalyticsService & {
    // Additional methods not in the interface
    trackCartAbandonment: () => void;
    trackCheckoutAbandonment: (checkoutStage: string, tourData: any) => void;
    trackFunnelStep: (stepName: string, tourData: any, stepNumber?: number | null) => void;
    trackTourImageClickExtended: (tourId: string, tourName: string, imageIndex?: number, clickType?: string) => void;
    trackTourTabClickExtended: (tourId: string, tourName: string, tabName: string, tabIndex?: number) => void;
    initializeAnalytics: () => void;
} = {
    // Core tracking methods
    trackEvent,
    trackPageView,
    trackConversion,
    initialize,

    // Ecommerce tracking
    trackPurchase,
    trackBeginCheckout,
    trackAddToCart,
    trackViewItem,

    // User engagement
    trackEngagementTime,
    setUserProperties,

    // Custom events
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick,

    // Additional methods not in the interface
    trackCartAbandonment,
    trackCheckoutAbandonment,
    trackFunnelStep,
    trackTourImageClickExtended: trackTourImageClickExtended,
    trackTourTabClickExtended: trackTourTabClickExtended,
    initializeAnalytics
};

export default analyticsService;