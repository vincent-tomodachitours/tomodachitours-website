// Direct Google Ads test bypassing environment variables
const directGoogleAdsTest = () => {
    console.log('🎯 Direct Google Ads Conversion Test');
    console.log('=====================================');

    // Use the exact values from your setup
    const CONVERSION_ID = 'AW-17482092392';
    const PURCHASE_LABEL = 'A9-4CJbbgocbEOiejpBB';

    // Check if gtag is available
    if (typeof window.gtag !== 'function') {
        console.error('❌ gtag is not available');
        return false;
    }

    console.log('✅ gtag is available');

    // 1. Configure Google Ads (Conversion Linker)
    console.log('🔧 Configuring Google Ads Conversion Linker...');
    window.gtag('config', CONVERSION_ID, {
        allow_enhanced_conversions: true,
        debug_mode: true
    });
    console.log('✅ Conversion Linker configured');

    // 2. Fire a test purchase conversion
    console.log('🚀 Firing purchase conversion...');
    const conversionData = {
        send_to: `${CONVERSION_ID}/${PURCHASE_LABEL}`,
        value: 5000,
        currency: 'JPY',
        transaction_id: `direct_${Date.now()}`
    };

    console.log('📤 Conversion data:', conversionData);
    window.gtag('event', 'conversion', conversionData);
    console.log('✅ Purchase conversion fired');

    // 3. Also fire enhanced conversion with email
    console.log('🔧 Firing enhanced conversion...');
    window.gtag('event', 'conversion', {
        send_to: `${CONVERSION_ID}/${PURCHASE_LABEL}`,
        value: 5000,
        currency: 'JPY',
        transaction_id: `enhanced_${Date.now()}`,
        user_data: {
            email_address: 'test@example.com'
        }
    });
    console.log('✅ Enhanced conversion fired');

    // 4. Test other conversion types
    console.log('🔧 Testing other conversion events...');

    // Begin checkout (if you have this label)
    window.gtag('event', 'conversion', {
        send_to: `${CONVERSION_ID}/test_checkout_label`,
        value: 5000,
        currency: 'JPY'
    });

    console.log('📊 Test Summary:');
    console.log('- Conversion Linker: ✅ Configured');
    console.log('- Purchase Conversion: ✅ Fired');
    console.log('- Enhanced Conversion: ✅ Fired');
    console.log('- Debug Mode: ✅ Enabled');

    console.log('🔍 Next Steps:');
    console.log('1. Check Network tab for requests to googleadservices.com');
    console.log('2. Check Google Ads conversions in 3-24 hours');
    console.log('3. Use Google Tag Assistant to verify');

    return true;
};

// Make available globally
if (typeof window !== 'undefined') {
    window.directGoogleAdsTest = directGoogleAdsTest;
    console.log('🧪 Direct Google Ads test available at window.directGoogleAdsTest()');
}

export { directGoogleAdsTest };