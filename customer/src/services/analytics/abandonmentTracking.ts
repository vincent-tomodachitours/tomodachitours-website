// Cart and checkout abandonment tracking

import { getShouldTrack, getShouldTrackMarketing, gtag } from './config';
import { storeUserInteraction } from './helpers';
import { getCartData, getTimeInCart, storeAbandonmentData, getCheckoutStep } from './cartTracking';
import { trackCustomGoogleAdsConversion } from '../googleAdsTracker';
import attributionService from '../attributionService';
import remarketingManager from '../remarketingManager';
import { TrackingData } from '../../types';

// Track cart abandonment for remarketing
export const trackCartAbandonment = (): void => {
    if (!getShouldTrack()) return;

    const cartData = getCartData();
    const attributionData = attributionService.getAttributionForAnalytics();

    if (!cartData || cartData.length === 0) return;

    // Calculate cart value
    const cartValue = cartData.reduce((total, item) => total + (item.price || 0), 0);

    // Track GA4 cart abandonment event
    gtag('event', 'abandon_cart', {
        currency: 'JPY',
        value: cartValue,
        items: cartData.map(item => ({
            item_id: item.tourId,
            item_name: item.tourName,
            category: 'Tour',
            quantity: 1,
            price: item.price
        })),
        // Attribution data
        ...attributionData,
        // Abandonment context
        abandonment_stage: 'cart',
        time_in_cart: getTimeInCart(),
        cart_items_count: cartData.length
    });

    // Track Google Ads remarketing event for cart abandonment (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            trackCustomGoogleAdsConversion('cart_abandonment', {
                value: cartValue,
                currency: 'JPY',
                cart_items: cartData.length,
                attribution: attributionData
            });
        } catch (error) {
            console.warn('Google Ads cart abandonment tracking failed:', error);
        }

        // Store abandonment data for remarketing
        storeAbandonmentData('cart', cartData);

        // Process cart abandonment for remarketing audiences
        try {
            remarketingManager.processCartAbandonment({
                cartData,
                cartValue,
                timeInCart: getTimeInCart(),
                itemCount: cartData.length,
                attribution: attributionData
            });
        } catch (error) {
            console.warn('Remarketing cart abandonment processing failed:', error);
        }
    }
};

// Track checkout abandonment
export const trackCheckoutAbandonment = (checkoutStage: string, tourData: TrackingData): void => {
    if (!getShouldTrack() || !tourData) return;

    const attributionData = attributionService.getAttributionForAnalytics();

    // Track GA4 checkout abandonment
    gtag('event', 'abandon_checkout', {
        currency: 'JPY',
        value: tourData.price,
        items: [{
            item_id: tourData.tourId,
            item_name: tourData.tourName,
            category: 'Tour',
            quantity: 1,
            price: tourData.price
        }],
        // Attribution data
        ...attributionData,
        // Abandonment context
        abandonment_stage: checkoutStage,
        checkout_step: getCheckoutStep(checkoutStage)
    });

    // Track Google Ads remarketing for checkout abandonment (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            trackCustomGoogleAdsConversion('checkout_abandonment', {
                value: tourData.price,
                currency: 'JPY',
                checkout_stage: checkoutStage,
                attribution: attributionData
            });
        } catch (error) {
            console.warn('Google Ads checkout abandonment tracking failed:', error);
        }

        // Store abandonment data
        storeAbandonmentData('checkout', tourData, checkoutStage);

        // Process checkout abandonment for remarketing audiences
        try {
            remarketingManager.processCheckoutAbandonment({
                ...tourData,
                checkoutStage,
                checkoutStep: getCheckoutStep(checkoutStage),
                attribution: attributionData
            });
        } catch (error) {
            console.warn('Remarketing checkout abandonment processing failed:', error);
        }
    }

    // Store user interaction for analytics (always allowed for analytics)
    storeUserInteraction('checkout_abandonment', { ...tourData, stage: checkoutStage });
};

// Track booking funnel progression
export const trackFunnelStep = (stepName: string, tourData: TrackingData, stepNumber: number | null = null): void => {
    if (!getShouldTrack() || !tourData) return;

    const attributionData = attributionService.getAttributionForAnalytics();

    // Track GA4 funnel step
    gtag('event', 'funnel_step', {
        currency: 'JPY',
        value: tourData.price,
        items: [{
            item_id: tourData.tourId,
            item_name: tourData.tourName,
            category: 'Tour',
            quantity: 1,
            price: tourData.price
        }],
        // Attribution data
        ...attributionData,
        // Funnel data
        funnel_step: stepName,
        step_number: stepNumber,
        tour_type: tourData.tour_category || 'Tour'
    });

    // Store funnel progression for analysis
    storeUserInteraction('funnel_step', {
        ...tourData,
        step: stepName,
        stepNumber: stepNumber
    });
};