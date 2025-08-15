// Analytics Testing Utility
// Use this to test your analytics setup in the browser console

import analytics from '../services/analytics';

// Test function to verify analytics setup
export const testAnalyticsSetup = () => {
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

// Test tour view tracking
export const testTourView = (tourId = 'night_tour') => {
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

// Test add to cart tracking
export const testAddToCart = (tourId = 'night_tour') => {
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

// Test begin checkout tracking
export const testBeginCheckout = (tourId = 'night_tour') => {
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

// Test purchase tracking
export const testPurchase = (tourId = 'night_tour') => {
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

// Run all tests
export const runAllAnalyticsTests = () => {
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
        runAllAnalyticsTests
    };

    console.log('🧪 Analytics testing functions available at window.testAnalytics');
}

export default {
    testAnalyticsSetup,
    testTourView,
    testAddToCart,
    testBeginCheckout,
    testPurchase,
    runAllAnalyticsTests
};