// Google Analytics 4 and Google Ads Conversion Tracking Service
class AnalyticsService {
    constructor() {
        this.isEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
        this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
        this.googleAdsId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
        this.conversionLabels = this.parseConversionLabels(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS);
        this.tourLabels = this.parseConversionLabels(process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS);
    }

    parseConversionLabels(labelsString) {
        try {
            return labelsString ? JSON.parse(labelsString) : {};
        } catch (error) {
            console.warn('Failed to parse conversion labels:', error);
            return {};
        }
    }

    // Check if gtag is available
    isGtagAvailable() {
        return typeof window !== 'undefined' && typeof window.gtag === 'function';
    }

    // Generic event tracking
    trackEvent(eventName, parameters = {}) {
        if (!this.isEnabled || !this.isGtagAvailable()) return;

        window.gtag('event', eventName, {
            ...parameters,
            send_to: this.measurementId
        });

        console.log('Analytics Event:', eventName, parameters);
    }

    // Track Google Ads conversion
    trackConversion(conversionLabel, value = null, currency = 'JPY') {
        if (!this.isEnabled || !this.isGtagAvailable() || !this.googleAdsId) return;

        const conversionData = {
            send_to: `${this.googleAdsId}/${conversionLabel}`
        };

        if (value) {
            conversionData.value = value;
            conversionData.currency = currency;
        }

        window.gtag('event', 'conversion', conversionData);
        console.log('Google Ads Conversion:', conversionLabel, conversionData);
    }

    // 1. Track tour page views
    trackTourView(tourData) {
        const { tourId, tourName, price, currency = 'JPY' } = tourData;

        // GA4 Enhanced Ecommerce
        this.trackEvent('view_item', {
            currency: currency,
            value: price,
            items: [{
                item_id: tourId,
                item_name: tourName,
                category: 'Tour',
                price: price,
                quantity: 1
            }]
        });

        // Google Ads Conversion
        if (this.conversionLabels.view_item) {
            this.trackConversion(this.conversionLabels.view_item, price, currency);
        }

        // Tour-specific tracking
        const tourSpecificLabel = this.getTourSpecificLabel(tourId, 'view');
        if (tourSpecificLabel) {
            this.trackConversion(tourSpecificLabel, price, currency);
        }
    }

    // 2. Track when user adds tour to cart/selects tour
    trackAddToCart(tourData) {
        const { tourId, tourName, price, currency = 'JPY', quantity = 1 } = tourData;

        // GA4 Enhanced Ecommerce
        this.trackEvent('add_to_cart', {
            currency: currency,
            value: price * quantity,
            items: [{
                item_id: tourId,
                item_name: tourName,
                category: 'Tour',
                price: price,
                quantity: quantity
            }]
        });

        // Google Ads Conversion
        if (this.conversionLabels.add_to_cart) {
            this.trackConversion(this.conversionLabels.add_to_cart, price * quantity, currency);
        }

        // Tour-specific tracking
        const tourSpecificLabel = this.getTourSpecificLabel(tourId, 'cart');
        if (tourSpecificLabel) {
            this.trackConversion(tourSpecificLabel, price * quantity, currency);
        }
    }

    // 3. Track when user begins checkout
    trackBeginCheckout(checkoutData) {
        const { tourId, tourName, price, currency = 'JPY', quantity = 1 } = checkoutData;

        // GA4 Enhanced Ecommerce
        this.trackEvent('begin_checkout', {
            currency: currency,
            value: price * quantity,
            items: [{
                item_id: tourId,
                item_name: tourName,
                category: 'Tour',
                price: price,
                quantity: quantity
            }]
        });

        // Google Ads Conversion
        if (this.conversionLabels.begin_checkout) {
            this.trackConversion(this.conversionLabels.begin_checkout, price * quantity, currency);
        }

        // Tour-specific tracking
        const tourSpecificLabel = this.getTourSpecificLabel(tourId, 'checkout');
        if (tourSpecificLabel) {
            this.trackConversion(tourSpecificLabel, price * quantity, currency);
        }
    }

    // 4. Track successful purchase
    trackPurchase(purchaseData) {
        const {
            transactionId,
            tourId,
            tourName,
            price,
            currency = 'JPY',
            quantity = 1,
            customerEmail = null
        } = purchaseData;

        // GA4 Enhanced Ecommerce
        this.trackEvent('purchase', {
            transaction_id: transactionId,
            currency: currency,
            value: price * quantity,
            items: [{
                item_id: tourId,
                item_name: tourName,
                category: 'Tour',
                price: price,
                quantity: quantity
            }]
        });

        // Google Ads Conversion
        if (this.conversionLabels.purchase) {
            this.trackConversion(this.conversionLabels.purchase, price * quantity, currency);
        }

        // Tour-specific tracking
        const tourSpecificLabel = this.getTourSpecificLabel(tourId, 'purchase');
        if (tourSpecificLabel) {
            this.trackConversion(tourSpecificLabel, price * quantity, currency);
        }

        // Enhanced conversions with customer data (if available)
        if (customerEmail) {
            this.trackEnhancedConversion(customerEmail);
        }
    }

    // Get tour-specific conversion label
    getTourSpecificLabel(tourId, action) {
        const tourMap = {
            'night_tour': 'night',
            'morning_tour': 'morning',
            'uji_tour': 'uji',
            'gion_tour': 'gion'
        };

        const tourPrefix = tourMap[tourId] || tourId.toLowerCase();
        const labelKey = `${tourPrefix}_${action}`;

        return this.tourLabels[labelKey];
    }

    // Enhanced conversions for better attribution
    trackEnhancedConversion(email) {
        if (!this.isEnabled || !this.isGtagAvailable() || !this.googleAdsId) return;

        window.gtag('config', this.googleAdsId, {
            allow_enhanced_conversions: true
        });

        window.gtag('event', 'conversion', {
            send_to: `${this.googleAdsId}`,
            user_data: {
                email_address: email
            }
        });
    }

    // Track custom events
    trackCustomEvent(eventName, parameters = {}) {
        this.trackEvent(eventName, parameters);
    }

    // Track page views (for SPA routing)
    trackPageView(path, title) {
        if (!this.isEnabled || !this.isGtagAvailable()) return;

        window.gtag('config', this.measurementId, {
            page_path: path,
            page_title: title
        });

        console.log('Page View:', path, title);
    }
}

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics;

// Export individual tracking functions for convenience
export const {
    trackTourView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackCustomEvent,
    trackPageView
} = analytics;