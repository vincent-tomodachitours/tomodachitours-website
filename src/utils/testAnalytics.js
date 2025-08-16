// Enhanced Analytics Testing Suite
// This script helps test and debug Google Analytics and Google Ads tracking

const runComprehensiveAnalyticsTest = () => {
    console.log('🚀 Running Comprehensive Analytics Test...');
    console.log('=====================================');

    // 1. Check if gtag is available
    console.log('1. Checking gtag availability...');
    if (typeof window.gtag === 'function') {
        console.log('✅ gtag is available');
    } else {
        console.log('❌ gtag is NOT available - tracking will not work');
        return false;
    }

    // 2. Check environment configuration
    console.log('\n2. Checking environment configuration...');
    const config = {
        gaId: process.env.REACT_APP_GA_MEASUREMENT_ID,
        adsId: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
        enabled: process.env.REACT_APP_ENABLE_ANALYTICS,
        labels: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS
    };

    console.log('📊 Configuration:');
    console.table(config);

    // 3. Parse and validate conversion labels
    console.log('\n3. Validating conversion labels...');
    let conversionLabels = {};
    try {
        conversionLabels = JSON.parse(config.labels || '{}');
        console.log('✅ Conversion labels parsed successfully');
        console.table(conversionLabels);
    } catch (error) {
        console.log('❌ Failed to parse conversion labels:', error);
        return false;
    }

    // 4. Check for placeholder values
    console.log('\n4. Checking for placeholder values...');
    const issues = [];

    if (!config.adsId || config.adsId.includes('XXXXXXXXX')) {
        issues.push('❌ Google Ads Conversion ID is missing or placeholder');
    }

    if (!conversionLabels.purchase || conversionLabels.purchase.includes('XXXXXXXXX')) {
        issues.push('❌ Purchase conversion label is missing or placeholder');
    }

    if (config.enabled !== 'true') {
        issues.push('⚠️ Analytics is disabled');
    }

    if (issues.length > 0) {
        console.log('🚨 Issues found:');
        issues.forEach(issue => console.log(issue));
    } else {
        console.log('✅ No configuration issues found');
    }

    // 5. Test Google Analytics event
    console.log('\n5. Testing Google Analytics event...');
    window.gtag('event', 'test_event', {
        event_category: 'test',
        event_label: 'analytics_test',
        value: 1
    });
    console.log('✅ GA4 test event sent');

    // 6. Test Google Ads conversion
    console.log('\n6. Testing Google Ads conversion...');
    if (config.adsId && conversionLabels.purchase && !conversionLabels.purchase.includes('XXXXXXXXX')) {
        const testConversionData = {
            send_to: `${config.adsId}/${conversionLabels.purchase}`,
            value: 1000,
            currency: 'JPY',
            transaction_id: `test_${Date.now()}`
        };

        console.log('🚀 Firing test conversion:', testConversionData);
        window.gtag('event', 'conversion', testConversionData);
        console.log('✅ Google Ads test conversion sent');
    } else {
        console.log('❌ Cannot test Google Ads conversion - missing or invalid configuration');
    }

    // 7. Test purchase tracking
    console.log('\n7. Testing purchase tracking function...');
    if (window.analytics && typeof window.analytics.trackPurchase === 'function') {
        const testPurchase = {
            transactionId: `test_${Date.now()}`,
            tourId: 'night_tour',
            tourName: 'Test Night Tour',
            price: 5000,
            currency: 'JPY',
            quantity: 1,
            customerEmail: 'test@example.com'
        };

        window.analytics.trackPurchase(testPurchase);
        console.log('✅ Purchase tracking function test completed');
    } else {
        console.log('⚠️ Purchase tracking function not available');
    }

    // 8. Summary
    console.log('\n8. Test Summary');
    console.log('================');
    console.log('✅ Tests completed!');
    console.log('📊 Check your Google Analytics Real-Time reports');
    console.log('🎯 Check your Google Ads conversions (may take up to 24 hours)');
    console.log('🔍 Use Google Tag Assistant for additional validation');

    return true;
};

// Test specific conversion tracking
const testConversionTracking = () => {
    console.log('🎯 Testing Conversion Tracking Specifically...');

    const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
    const conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');

    if (!conversionId || !conversionLabels.purchase) {
        console.log('❌ Missing conversion configuration');
        return false;
    }

    // Test with debug mode
    console.log('🔍 Enabling debug mode...');
    window.gtag('config', conversionId, {
        debug_mode: true,
        send_page_view: false
    });

    // Fire test conversion
    const testData = {
        send_to: `${conversionId}/${conversionLabels.purchase}`,
        value: 5000,
        currency: 'JPY',
        transaction_id: `debug_test_${Date.now()}`,
        debug_mode: true
    };

    console.log('🚀 Firing debug conversion:', testData);
    window.gtag('event', 'conversion', testData);

    // Also test enhanced conversion
    if (conversionLabels.purchase) {
        console.log('🔍 Testing enhanced conversion...');
        window.gtag('event', 'conversion', {
            send_to: `${conversionId}/${conversionLabels.purchase}`,
            value: 5000,
            currency: 'JPY',
            transaction_id: `enhanced_test_${Date.now()}`,
            user_data: {
                email_address: 'test@example.com'
            }
        });
    }

    console.log('✅ Debug conversion tests completed');
    console.log('📊 Check browser Network tab for outgoing requests');
    console.log('🎯 Check Google Ads for conversion data in 3-24 hours');

    return true;
};

// Check what's actually being sent to Google
const monitorGoogleRequests = () => {
    console.log('🔍 Monitoring Google requests...');
    console.log('Open Network tab in DevTools and look for:');
    console.log('- Requests to google-analytics.com');
    console.log('- Requests to googleadservices.com');
    console.log('- Requests containing your conversion ID');

    // Override fetch to log Google requests
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('google') || url.includes('gtag'))) {
            console.log('🌐 Google request:', url);
        }
        return originalFetch.apply(this, args);
    };

    console.log('✅ Request monitoring enabled');
};

// Export functions for browser console
if (typeof window !== 'undefined') {
    window.testAnalyticsComprehensive = {
        runComprehensiveAnalyticsTest,
        testConversionTracking,
        monitorGoogleRequests
    };

    console.log('🧪 Comprehensive analytics testing available at window.testAnalyticsComprehensive');
}

export { runComprehensiveAnalyticsTest, testConversionTracking, monitorGoogleRequests };