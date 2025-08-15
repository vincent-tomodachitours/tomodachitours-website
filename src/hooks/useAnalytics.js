import { useEffect } from 'react';
import analytics from '../services/analytics';

// Custom hook for analytics tracking
export const useAnalytics = () => {
    return {
        trackTourView: analytics.trackTourView.bind(analytics),
        trackAddToCart: analytics.trackAddToCart.bind(analytics),
        trackBeginCheckout: analytics.trackBeginCheckout.bind(analytics),
        trackPurchase: analytics.trackPurchase.bind(analytics),
        trackCustomEvent: analytics.trackCustomEvent.bind(analytics),
        trackPageView: analytics.trackPageView.bind(analytics)
    };
};

// Hook for automatic page view tracking
export const usePageTracking = (pageName, tourData = null) => {
    const { trackPageView, trackTourView } = useAnalytics();

    useEffect(() => {
        // Track page view
        trackPageView(window.location.pathname, pageName);

        // If this is a tour page, also track tour view
        if (tourData) {
            trackTourView(tourData);
        }
    }, [pageName, tourData, trackPageView, trackTourView]);
};

export default useAnalytics;