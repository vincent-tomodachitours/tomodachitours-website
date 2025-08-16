// Test Google Ads Conversion Tracking
// Run this in browser console to test if conversions are firing correctly

const testGoogleAdsConversion = () => {
    console.log('🧪 Testing Google Ads Conversion Tracking...');

    // Check if gtag is available
    if (typeof window.gtag !== 'function') {
        console.error('❌ gtag is not available. Make sure Google Analytics/Ads script is loaded.');
        return false;
    }

    // Get environment variables
    const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
    const conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');

    console.log('📊 Configuration:');
    console.log('- Conversion ID:', conversionId);
    console.log('- Purchase Label:', conversionLabels.purchase);

    if (!conversionId || !conversionLabels.purchase) {
        console.error('❌ Missing conversion ID or purchase label');
        return false;
    }

    // Test purchase conversion
    const testPurchaseData = {
        send_to: `${conversionId}/${conversionLabels.purchase}`,
        value: 5000,
        currency: 'JPY',
        transaction_id: `test_${Date.now()}`
    };

    console.log('🚀 Firing test conversion:', testPurchaseData);

    // Fire the conversion
    window.gtag('event', 'conversion', testPurchaseData);

    console.log('✅ Test conversion fired! Check Google Ads for the conversion data.');
    console.log('Note: It may take up to 24 hours for conversions to appear in Google Ads.');

    return true;
};

// Test with debug mode
const testWithDebug = () => {
    console.log('🔍 Testing with debug mode...');

    // Enable debug mode
    window.gtag('config', process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID, {
        debug_mode: true
    });

    // Run the test
    testGoogleAdsConversion();
};

// Check conversion action status
const checkConversionStatus = () => {
    console.log('📋 Current Conversion Configuration:');

    const config = {
        conversionId: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
        measurementId: process.env.REACT_APP_GA_MEASUREMENT_ID,
        analyticsEnabled: process.env.REACT_APP_ENABLE_ANALYTICS,
        conversionLabels: JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}')
    };

    console.table(config);

    // Check for common issues
    const issues = [];

    if (!config.conversionId || config.conversionId.includes('XXXXXXXXX')) {
        issues.push('❌ Invalid or placeholder conversion ID');
    }

    if (!config.conversionLabels.purchase || config.conversionLabels.purchase.includes('XXXXXXXXX')) {
        issues.push('❌ Invalid or placeholder purchase conversion label');
    }

    if (config.analyticsEnabled !== 'true') {
        issues.push('⚠️ Analytics is disabled');
    }

    if (issues.length > 0) {
        console.log('🚨 Issues found:');
        issues.forEach(issue => console.log(issue));
    } else {
        console.log('✅ Configuration looks good!');
    }

    return issues.length === 0;
};

// Export for browser console use
if (typeof window !== 'undefined') {
    window.testGoogleAds = {
        testGoogleAdsConversion,
        testWithDebug,
        checkConversionStatus
    };

    console.log('🧪 Google Ads testing functions available at window.testGoogleAds');
}

export { testGoogleAdsConversion, testWithDebug, checkConversionStatus };