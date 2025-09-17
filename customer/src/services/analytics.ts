// Backward compatibility layer - imports from refactored analytics modules
// This maintains the same API as the original analytics.js file

export {
    trackPurchase,
    trackBeginCheckout,
    trackTourView,
    trackViewItem,
    trackAddToCart,
    trackCartAbandonment,
    trackCheckoutAbandonment,
    trackFunnelStep,

    trackEngagementTime,
    setUserProperties,
    trackCustomEvent,
    trackTourImageClick,
    trackTourTabClick,
    initializeAnalytics
} from './analytics/index';

export { default } from './analytics/index';

// Initialize production monitoring in production environment
if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENVIRONMENT === 'production') {
    import('./productionMonitor').then(({ default: productionMonitor }) => {
        productionMonitor.initialize();
    }).catch(error => {
        console.error('Failed to initialize production monitoring:', error);
    });
}