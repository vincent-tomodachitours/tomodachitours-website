// Debug script to test Google Ads conversion tracking
// Run this in browser console to debug the issue

const debugGoogleAdsConversion = () => {
    console.log('🔍 Debugging Google Ads Conversion Tracking...');

    // Check environment variables
    const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID;
    const conversionLabelsString = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;

    console.log('📊 Environment Variables:');
    console.log('- Conversion ID:', conversionId);
    console.log('- Conversion Labels String:', conversionLabelsString);

    // Parse conversion labels
    let conversionLabels = {};
    try {
        conversionLabels = JSON.parse(conversionLabelsString || '{}');
        console.log('- Parsed Labels:', conversionLabels);
    } catch (error) {
        console.error('❌ Failed to parse conversion labels:', error);
        return false;
    }

    // Check if purchase label exists
    const purchaseLabel = conversionLabels.purchase;
    console.log('- Purchase Label:', purchaseLabel);

    if (!purchaseLabel || purchaseLabel.includes('XXXXXXXXX')) {
        console.error('❌ Purchase label is missing or placeholder');
        return false;
    }

    // Test direct gtag call
    console.log('🚀 Testing direct gtag conversion call...');

    const testConversionData = {
        send_to: `${conversionId}/${purchaseLabel}`,
        value: 5000,
        currency: 'JPY',
        transaction_id: `debug_${Date.now()}`
    };

    console.log('📤 Sending conversion data:', testConversionData);

    if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', testConversionData);
        console.log('✅ Direct gtag conversion call made');

        // Also test with debug mode
        window.gtag('config', conversionId, { debug_mode: true });
        window.gtag('event', 'conversion', {
            ...testConversionData,
            debug_mode: true
        });
        console.log('✅ Debug mode conversion call made');

    } else {
        console.error('❌ gtag is not available');
        return false;
    }

    return true;
};

// Run the debug
debugGoogleAdsConversion();