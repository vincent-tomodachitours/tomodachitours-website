// Check if environment variables are properly loaded
const checkEnvironment = () => {
    console.log('🔍 Checking Environment Variables...');

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
        console.log('❌ Not in browser environment');
        return false;
    }

    // Check if process is defined (it shouldn't be in browser)
    if (typeof process !== 'undefined') {
        console.log('⚠️ process is defined in browser (this might cause issues)');
    }

    // Check React environment variables
    const envVars = {
        GA_ID: window.REACT_APP_GA_MEASUREMENT_ID || 'Not found',
        ADS_ID: window.REACT_APP_GOOGLE_ADS_CONVERSION_ID || 'Not found',
        ANALYTICS_ENABLED: window.REACT_APP_ENABLE_ANALYTICS || 'Not found',
        CONVERSION_LABELS: window.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || 'Not found'
    };

    console.log('📊 Environment Variables:');
    console.table(envVars);

    // Try to access them the React way (build time)
    console.log('🔧 Build-time Environment Variables:');
    console.log('- GA4 ID:', process?.env?.REACT_APP_GA_MEASUREMENT_ID || 'Not available');
    console.log('- Ads ID:', process?.env?.REACT_APP_GOOGLE_ADS_CONVERSION_ID || 'Not available');
    console.log('- Enabled:', process?.env?.REACT_APP_ENABLE_ANALYTICS || 'Not available');

    return true;
};

// Test Google Ads configuration specifically
const testGoogleAdsConfig = () => {
    console.log('🎯 Testing Google Ads Configuration...');

    // Hardcode the values we know work
    const conversionId = 'AW-17482092392';
    const purchaseLabel = 'A9-4CJbbgocbEOiejpBB';

    console.log('📊 Known Working Values:');
    console.log('- Conversion ID:', conversionId);
    console.log('- Purchase Label:', purchaseLabel);

    // Test direct conversion
    if (typeof window.gtag === 'function') {
        const testData = {
            send_to: `${conversionId}/${purchaseLabel}`,
            value: 5000,
            currency: 'JPY',
            transaction_id: `env_test_${Date.now()}`
        };

        console.log('🚀 Firing test conversion with hardcoded values:', testData);
        window.gtag('event', 'conversion', testData);
        console.log('✅ Test conversion fired');

        return true;
    } else {
        console.log('❌ gtag not available');
        return false;
    }
};

// Export for browser console
if (typeof window !== 'undefined') {
    window.checkEnvironment = checkEnvironment;
    window.testGoogleAdsConfig = testGoogleAdsConfig;

    console.log('🧪 Environment check functions available:');
    console.log('- window.checkEnvironment()');
    console.log('- window.testGoogleAdsConfig()');
}

export { checkEnvironment, testGoogleAdsConfig };