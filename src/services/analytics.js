// Google Analytics 4 and Google Ads Conversion Tracking Service
class AnalyticsService {
    constructor() {
        this.isEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
        this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
        this.googleAdsId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
        this.conversionLabels = this.parseConversionLabels(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS);
        this.tourLabels = this.parseConversionLabels(process.env.REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS);

        // Initialize conversion linker
        this.initializeConversionLinker();
    }

    parseConversionLabels(labelsString) {
        try {
            return labelsString ? JSON.parse(labelsString) : {};
        } catch (error) {
            console.warn('Failed to parse conversion labels:', error);
            return {};
        }
    }

    // Initialize Google Ads Conversion Linker
    initializeConversionLinker() {
        if (!this.isEnabled || !this.googleAdsId) return;

        // Wait for gtag to be available
        const initLinker = () => {
            if (this.isGtagAvailable()) {
                // Configure Google Ads Conversion Linker
                window.gtag('config', this.googleAdsId, {
                    allow_enhanced_conversions: true
                });

                console.log('✅ Google Ads Conversion Linker initialized:', this.googleAdsId);
            } else {
                // Retry after a short delay if gtag isn't ready yet
                setTimeout(initLinker, 100);
            }
        };

        // Initialize immediately or wait for DOM
        if (typeof window !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initLinker);
            } else {
                initLinker();
            }
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
    trackConversion(conversionLabel, value = null, currency = 'JPY', transactionId = null) {
        if (!this.isEnabled || !this.isGtagAvailable() || !this.googleAdsId) {
            console.warn('❌ Google Ads conversion tracking not available:', {
                enabled: this.isEnabled,
                gtag: this.isGtagAvailable(),
                adsId: this.googleAdsId
            });
            return;
        }

        if (!conversionLabel || conversionLabel.includes('XXXXXXXXX')) {
            console.warn('❌ Invalid conversion label:', conversionLabel);
            return;
        }

        const conversionData = {
            send_to: `${this.googleAdsId}/${conversionLabel}`
        };

        if (value) {
            conversionData.value = value;
            conversionData.currency = currency;
        }

        if (transactionId) {
            conversionData.transaction_id = transactionId;
        }

        console.log('🎯 Firing Google Ads Conversion:', {
            label: conversionLabel,
            fullSendTo: conversionData.send_to,
            data: conversionData
        });

        window.gtag('event', 'conversion', conversionData);
        console.log('✅ Google Ads Conversion fired successfully');
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

        const totalValue = price * quantity;

        console.log('🎯 Tracking Purchase Conversion:', {
            transactionId,
            tourId,
            tourName,
            totalValue,
            currency
        });

        // 1. GA4 Enhanced Ecommerce Purchase Event
        this.trackEvent('purchase', {
            transaction_id: transactionId,
            currency: currency,
            value: totalValue,
            items: [{
                item_id: tourId,
                item_name: tourName,
                category: 'Tour',
                price: price,
                quantity: quantity
            }]
        });

        // 2. Google Ads Conversion Event (Primary conversion for ads)
        if (this.isGtagAvailable() && this.googleAdsId) {
            // Fire the main Google Ads conversion event
            window.gtag('event', 'conversion', {
                send_to: this.googleAdsId,
                value: totalValue,
                currency: currency,
                transaction_id: transactionId
            });

            console.log('✅ Google Ads main conversion fired:', {
                send_to: this.googleAdsId,
                value: totalValue,
                currency: currency,
                transaction_id: transactionId
            });
        }

        // 3. Specific conversion labels (if configured)
        if (this.conversionLabels.purchase) {
            this.trackConversion(this.conversionLabels.purchase, totalValue, currency, transactionId);
        }

        // 4. Tour-specific tracking
        const tourSpecificLabel = this.getTourSpecificLabel(tourId, 'purchase');
        if (tourSpecificLabel) {
            this.trackConversion(tourSpecificLabel, totalValue, currency, transactionId);
        }

        // 5. Enhanced conversions with customer data (if available)
        if (customerEmail) {
            this.trackEnhancedConversion(customerEmail, totalValue, currency, transactionId);
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
    trackEnhancedConversion(email, value = null, currency = 'JPY', transactionId = null) {
        if (!this.isEnabled || !this.isGtagAvailable() || !this.googleAdsId) return;

        const conversionData = {
            send_to: this.googleAdsId,
            user_data: {
                email_address: email
            }
        };

        if (value) {
            conversionData.value = value;
            conversionData.currency = currency;
        }

        if (transactionId) {
            conversionData.transaction_id = transactionId;
        }

        window.gtag('event', 'conversion', conversionData);

        console.log('✅ Enhanced conversion with user data fired:', conversionData);
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

// Test functions for browser console
const testAnalyticsSetup = () => {
    console.log('🧪 Testing Analytics Setup...');

    // Check if gtag is available
    if (typeof window.gtag === 'function') {
        console.log('✅ Google Tag (gtag) is available');
    } else {
        console.log('❌ Google Tag (gtag) is NOT available');
        return false;
    }

    // Check environment variables
    console.log('📊 Analytics Configuration:');
    console.log('- GA4 Measurement ID:', process.env.REACT_APP_GA_MEASUREMENT_ID);
    console.log('- Google Ads Conversion ID:', process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID);
    console.log('- Analytics Enabled:', process.env.REACT_APP_ENABLE_ANALYTICS);

    return true;
};

const testTourView = (tourId = 'night_tour') => {
    console.log('🧪 Testing Tour View Tracking...');

    const testData = {
        tourId: tourId,
        tourName: 'Test Tour View',
        price: 5000,
        currency: 'JPY'
    };

    analytics.trackTourView(testData);
    console.log('✅ Tour view tracked:', testData);
};

const testAddToCart = (tourId = 'night_tour') => {
    console.log('🧪 Testing Add to Cart Tracking...');

    const testData = {
        tourId: tourId,
        tourName: 'Test Add to Cart',
        price: 5000,
        currency: 'JPY',
        quantity: 2
    };

    analytics.trackAddToCart(testData);
    console.log('✅ Add to cart tracked:', testData);
};

const testBeginCheckout = (tourId = 'night_tour') => {
    console.log('🧪 Testing Begin Checkout Tracking...');

    const testData = {
        tourId: tourId,
        tourName: 'Test Begin Checkout',
        price: 5000,
        currency: 'JPY',
        quantity: 2
    };

    analytics.trackBeginCheckout(testData);
    console.log('✅ Begin checkout tracked:', testData);
};

const testPurchase = (tourId = 'night_tour') => {
    console.log('🧪 Testing Purchase Tracking...');

    const testData = {
        transactionId: `test_${Date.now()}`,
        tourId: tourId,
        tourName: 'Test Purchase',
        price: 5000,
        currency: 'JPY',
        quantity: 2,
        customerEmail: 'test@example.com'
    };

    analytics.trackPurchase(testData);
    console.log('✅ Purchase tracked:', testData);
};

const testGoogleAdsConversion = () => {
    console.log('🧪 Testing Google Ads Conversion Format...');

    if (typeof window.gtag === 'function') {
        const testTransactionId = `test_conversion_${Date.now()}`;
        const testValue = 5000;
        const googleAdsId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;

        if (!googleAdsId) {
            console.log('❌ Google Ads ID not configured in environment variables');
            return;
        }

        // Test the exact format Google Ads expects
        window.gtag('event', 'conversion', {
            send_to: googleAdsId,
            value: testValue,
            currency: 'JPY',
            transaction_id: testTransactionId
        });

        console.log('✅ Google Ads conversion test fired:', {
            send_to: googleAdsId,
            value: testValue,
            currency: 'JPY',
            transaction_id: testTransactionId
        });

        console.log('📊 Check Google Ads > Conversions > Summary to see if this appears');
    } else {
        console.log('❌ gtag not available');
    }
};

const runAllAnalyticsTests = () => {
    console.log('🚀 Running All Analytics Tests...');

    if (!testAnalyticsSetup()) {
        console.log('❌ Analytics setup test failed. Stopping tests.');
        return;
    }

    // Wait between tests to avoid overwhelming the analytics
    setTimeout(() => testTourView(), 1000);
    setTimeout(() => testAddToCart(), 2000);
    setTimeout(() => testBeginCheckout(), 3000);
    setTimeout(() => testPurchase(), 4000);

    console.log('✅ All analytics tests completed. Check your Google Analytics and Google Ads for events.');
};

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
    window.testAnalytics = {
        testAnalyticsSetup,
        testTourView,
        testAddToCart,
        testBeginCheckout,
        testPurchase,
        testGoogleAdsConversion,
        runAllAnalyticsTests
    };

    console.log('🧪 Analytics testing functions available at window.testAnalytics');
}

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