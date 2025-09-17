/**
 * Development helpers for exposing services to window object for testing
 * Only runs in development mode
 */

import bookingFlowManager from '../services/bookingFlowManager';
import gtmService from '../services/gtmService';
import { trackBeginCheckout, trackPurchase, trackTourView, trackAddToCart } from '../services/analytics';

// Only expose services in development mode
if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_MODE === 'true') {
    // Expose services to window for testing
    (window as any).bookingFlowManager = bookingFlowManager;
    (window as any).gtmService = gtmService;

    // Expose analytics functions
    (window as any).trackBeginCheckout = trackBeginCheckout;
    (window as any).trackPurchase = trackPurchase;
    (window as any).trackTourView = trackTourView;
    (window as any).trackAddToCart = trackAddToCart;

    console.log('🔧 Development helpers loaded - services exposed to window object');
    console.log('Available services:', {
        bookingFlowManager: 'window.bookingFlowManager',
        gtmService: 'window.gtmService',
        trackBeginCheckout: 'window.trackBeginCheckout',
        trackPurchase: 'window.trackPurchase',
        trackTourView: 'window.trackTourView',
        trackAddToCart: 'window.trackAddToCart'
    });
}

export { };