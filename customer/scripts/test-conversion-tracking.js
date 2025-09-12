/**
 * Test script for Google Ads conversion tracking
 * Run this in the browser console to test conversion events
 */

// Test begin_checkout conversion
function testBeginCheckout() {
    console.log('🧪 Testing begin_checkout conversion...');

    const testData = {
        value: 15000,
        currency: 'JPY',
        tour_id: 'gion-tour',
        tour_name: 'Gion District Walking Tour',
        items: [{
            item_id: 'gion-tour',
            item_name: 'Gion District Walking Tour',
            item_category: 'tour',
            price: 15000,
            quantity: 1
        }]
    };

    // Push test event to dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'google_ads_conversion',
        event_category: 'ecommerce',
        event_label: 'begin_checkout',

        // Google Ads conversion parameters
        conversion_id: 17482092392,
        conversion_label: 'mEaUCKmY8Y0bEOiejpBB',
        value: testData.value,
        currency: testData.currency,

        // Add explicit variables that GTM expects
        'Transaction Value': testData.value,
        'Currency Code': testData.currency,

        // Custom parameters
        custom_parameters: {
            tour_id: testData.tour_id,
            tour_name: testData.tour_name,
            checkout_step: 'begin_checkout'
        },

        items: testData.items
    });

    console.log('✅ Test begin_checkout event pushed to dataLayer:', {
        value: testData.value,
        currency: testData.currency,
        conversion_id: 1748209392,
        conversion_label: 'mEaUCKmY8Y0bEOiejpBB'
    });
}

// Test view_item conversion
function testViewItem() {
    console.log('🧪 Testing view_item conversion...');

    const testData = {
        value: 15000,
        currency: 'JPY',
        tour_id: 'gion-tour',
        tour_name: 'Gion District Walking Tour',
        items: [{
            item_id: 'gion-tour',
            item_name: 'Gion District Walking Tour',
            item_category: 'tour',
            price: 15000,
            quantity: 1
        }]
    };

    // Push test event to dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'google_ads_conversion',
        event_category: 'ecommerce',
        event_label: 'view_item',

        // Google Ads conversion parameters
        conversion_id: 17482092392,
        conversion_label: '6cIkCMn9540bEOiejpBB',
        value: testData.value,
        currency: testData.currency,

        // Add explicit variables that GTM expects
        'Transaction Value': testData.value,
        'Currency Code': testData.currency,

        // Custom parameters
        custom_parameters: {
            tour_id: testData.tour_id,
            tour_name: testData.tour_name,
            item_category: 'tour'
        },

        items: testData.items
    });

    console.log('✅ Test view_item event pushed to dataLayer:', {
        value: testData.value,
        currency: testData.currency,
        conversion_id: 17482092392,
        conversion_label: '6cIkCMn9540bEOiejpBB'
    });
}

// Test purchase conversion
function testPurchase() {
    console.log('🧪 Testing purchase conversion...');

    const testData = {
        transaction_id: 'test_' + Date.now(),
        value: 15000,
        currency: 'JPY',
        tour_id: 'gion-tour',
        tour_name: 'Gion District Walking Tour',
        items: [{
            item_id: 'gion-tour',
            item_name: 'Gion District Walking Tour',
            item_category: 'tour',
            price: 15000,
            quantity: 1
        }]
    };

    // Push test event to dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'google_ads_conversion',
        event_category: 'ecommerce',
        event_label: 'purchase',

        // Google Ads conversion parameters
        conversion_id: 17482092392,
        conversion_label: 'hKuFCPOD5Y0bEOiejpBB',
        value: testData.value,
        currency: testData.currency,
        transaction_id: testData.transaction_id,

        // Add explicit variables that GTM expects
        'Transaction Value': testData.value,
        'Currency Code': testData.currency,
        'Transaction ID': testData.transaction_id,

        // Custom parameters
        custom_parameters: {
            tour_id: testData.tour_id,
            tour_name: testData.tour_name,
            payment_provider: 'stripe'
        },

        items: testData.items
    });

    console.log('✅ Test purchase event pushed to dataLayer:', {
        transaction_id: testData.transaction_id,
        value: testData.value,
        currency: testData.currency,
        conversion_id: 17482092392,
        conversion_label: 'hKuFCPOD5Y0bEOiejpBB'
    });
}

// Check current dataLayer contents
function checkDataLayer() {
    console.log('📊 Current dataLayer contents:');
    console.log(window.dataLayer);

    // Filter for Google Ads conversion events
    const conversionEvents = window.dataLayer.filter(event =>
        event.event === 'google_ads_conversion'
    );

    console.log('🎯 Google Ads conversion events:', conversionEvents);
}

// Check GTM container status
function checkGTMStatus() {
    console.log('🏷️ GTM Container Status:');
    console.log('GTM loaded:', !!window.google_tag_manager);
    console.log('Container ID:', window.google_tag_manager ? Object.keys(window.google_tag_manager) : 'Not loaded');
    console.log('gtag function:', typeof window.gtag);
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running all conversion tracking tests...');
    checkGTMStatus();
    checkDataLayer();
    testViewItem();
    setTimeout(() => {
        testBeginCheckout();
        setTimeout(() => {
            testPurchase();
            setTimeout(() => {
                checkDataLayer();
            }, 1000);
        }, 1000);
    }, 1000);
}

// Export functions for manual testing
window.testConversionTracking = {
    testViewItem,
    testBeginCheckout,
    testPurchase,
    checkDataLayer,
    checkGTMStatus,
    runAllTests
};

console.log('🧪 Conversion tracking test functions loaded. Use:');
console.log('- testConversionTracking.testBeginCheckout()');
console.log('- testConversionTracking.testPurchase()');
console.log('- testConversionTracking.checkDataLayer()');
console.log('- testConversionTracking.checkGTMStatus()');
console.log('- testConversionTracking.runAllTests()');