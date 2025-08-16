// Comprehensive conversion testing for all Google Ads conversion actions
const testAllConversions = () => {
    console.log('🚀 Testing All Google Ads Conversions');
    console.log('=====================================');

    // Check if gtag is available
    if (typeof window.gtag !== 'function') {
        console.error('❌ gtag is not available');
        return false;
    }

    const conversionId = 'AW-17482092392';

    // Get conversion labels from environment (if available)
    let conversionLabels = {};
    try {
        const labelsString = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS;
        conversionLabels = labelsString ? JSON.parse(labelsString) : {};
    } catch (error) {
        console.warn('Could not parse conversion labels from environment');
    }

    console.log('📊 Available conversion labels:', conversionLabels);

    // Test data for all conversions
    const testData = {
        tourId: 'morning_tour',
        tourName: 'Test Morning Tour',
        price: 5000,
        currency: 'JPY',
        quantity: 1,
        transactionId: `test_all_${Date.now()}`
    };

    console.log('🧪 Test data:', testData);

    // 1. Test Page View Conversion
    console.log('\n1. 🔍 Testing Page View Conversion...');
    if (conversionLabels.view_item && !conversionLabels.view_item.includes('XXXXXXXXX')) {
        const viewData = {
            send_to: `${conversionId}/${conversionLabels.view_item}`,
            value: testData.price,
            currency: testData.currency
        };
        console.log('📤 Firing page view conversion:', viewData);
        window.gtag('event', 'conversion', viewData);
        console.log('✅ Page view conversion fired');
    } else {
        console.log('⚠️ Page view conversion label not configured');
        console.log('   Create "Tour Page View" conversion action in Google Ads');
    }

    // 2. Test Add to Cart Conversion
    console.log('\n2. 🛒 Testing Add to Cart Conversion...');
    if (conversionLabels.add_to_cart && !conversionLabels.add_to_cart.includes('XXXXXXXXX')) {
        const cartData = {
            send_to: `${conversionId}/${conversionLabels.add_to_cart}`,
            value: testData.price * testData.quantity,
            currency: testData.currency
        };
        console.log('📤 Firing add to cart conversion:', cartData);
        window.gtag('event', 'conversion', cartData);
        console.log('✅ Add to cart conversion fired');
    } else {
        console.log('⚠️ Add to cart conversion label not configured');
        console.log('   Create "Tour Selection" conversion action in Google Ads');
    }

    // 3. Test Begin Checkout Conversion
    console.log('\n3. 🛍️ Testing Begin Checkout Conversion...');
    if (conversionLabels.begin_checkout && !conversionLabels.begin_checkout.includes('XXXXXXXXX')) {
        const checkoutData = {
            send_to: `${conversionId}/${conversionLabels.begin_checkout}`,
            value: testData.price * testData.quantity,
            currency: testData.currency
        };
        console.log('📤 Firing begin checkout conversion:', checkoutData);
        window.gtag('event', 'conversion', checkoutData);
        console.log('✅ Begin checkout conversion fired');
    } else {
        console.log('⚠️ Begin checkout conversion label not configured');
        console.log('   Create "Tour Booking Started" conversion action in Google Ads');
    }

    // 4. Test Purchase Conversion
    console.log('\n4. 💰 Testing Purchase Conversion...');
    if (conversionLabels.purchase && !conversionLabels.purchase.includes('XXXXXXXXX')) {
        const purchaseData = {
            send_to: `${conversionId}/${conversionLabels.purchase}`,
            value: testData.price * testData.quantity,
            currency: testData.currency,
            transaction_id: testData.transactionId
        };
        console.log('📤 Firing purchase conversion:', purchaseData);
        window.gtag('event', 'conversion', purchaseData);
        console.log('✅ Purchase conversion fired');
    } else {
        console.log('⚠️ Purchase conversion label not configured');
    }

    // 5. Test Enhanced Conversion
    console.log('\n5. 🔧 Testing Enhanced Conversion...');
    if (conversionLabels.purchase) {
        const enhancedData = {
            send_to: `${conversionId}/${conversionLabels.purchase}`,
            value: testData.price,
            currency: testData.currency,
            transaction_id: `enhanced_${testData.transactionId}`,
            user_data: {
                email_address: 'test@example.com'
            }
        };
        console.log('📤 Firing enhanced conversion:', enhancedData);
        window.gtag('event', 'conversion', enhancedData);
        console.log('✅ Enhanced conversion fired');
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');

    const configured = Object.keys(conversionLabels).filter(key =>
        conversionLabels[key] && !conversionLabels[key].includes('XXXXXXXXX')
    );

    console.log(`✅ Configured conversions: ${configured.length}/4`);
    console.log(`📋 Configured: ${configured.join(', ')}`);

    const missing = ['purchase', 'view_item', 'add_to_cart', 'begin_checkout'].filter(key =>
        !conversionLabels[key] || conversionLabels[key].includes('XXXXXXXXX')
    );

    if (missing.length > 0) {
        console.log(`⚠️ Missing conversions: ${missing.join(', ')}`);
        console.log('\n🔧 Next Steps:');
        console.log('1. Create missing conversion actions in Google Ads');
        console.log('2. Update REACT_APP_GOOGLE_ADS_CONVERSION_LABELS in .env');
        console.log('3. Deploy changes and test again');
    } else {
        console.log('🎉 All conversion actions configured!');
    }

    console.log('\n🔍 Verification:');
    console.log('- Check Network tab for requests to googleadservices.com');
    console.log('- Use Google Tag Assistant to verify tags');
    console.log('- Check Google Ads conversions in 3-24 hours');

    return true;
};

// Test individual conversion types
const testPageView = () => {
    console.log('🔍 Testing Page View Conversion Only');

    const conversionId = 'AW-17482092392';
    let conversionLabels = {};

    try {
        conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');
    } catch (error) {
        console.warn('Could not parse conversion labels');
    }

    if (conversionLabels.view_item && !conversionLabels.view_item.includes('XXXXXXXXX')) {
        const viewData = {
            send_to: `${conversionId}/${conversionLabels.view_item}`,
            value: 5000,
            currency: 'JPY'
        };

        console.log('📤 Firing page view conversion:', viewData);
        window.gtag('event', 'conversion', viewData);
        console.log('✅ Page view conversion test completed');
    } else {
        console.log('❌ Page view conversion not configured');
        console.log('Create "Tour Page View" conversion action in Google Ads first');
    }
};

const testAddToCart = () => {
    console.log('🛒 Testing Add to Cart Conversion Only');

    const conversionId = 'AW-17482092392';
    let conversionLabels = {};

    try {
        conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');
    } catch (error) {
        console.warn('Could not parse conversion labels');
    }

    if (conversionLabels.add_to_cart && !conversionLabels.add_to_cart.includes('XXXXXXXXX')) {
        const cartData = {
            send_to: `${conversionId}/${conversionLabels.add_to_cart}`,
            value: 5000,
            currency: 'JPY'
        };

        console.log('📤 Firing add to cart conversion:', cartData);
        window.gtag('event', 'conversion', cartData);
        console.log('✅ Add to cart conversion test completed');
    } else {
        console.log('❌ Add to cart conversion not configured');
        console.log('Create "Tour Selection" conversion action in Google Ads first');
    }
};

const testBeginCheckout = () => {
    console.log('🛍️ Testing Begin Checkout Conversion Only');

    const conversionId = 'AW-17482092392';
    let conversionLabels = {};

    try {
        conversionLabels = JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}');
    } catch (error) {
        console.warn('Could not parse conversion labels');
    }

    if (conversionLabels.begin_checkout && !conversionLabels.begin_checkout.includes('XXXXXXXXX')) {
        const checkoutData = {
            send_to: `${conversionId}/${conversionLabels.begin_checkout}`,
            value: 5000,
            currency: 'JPY'
        };

        console.log('📤 Firing begin checkout conversion:', checkoutData);
        window.gtag('event', 'conversion', checkoutData);
        console.log('✅ Begin checkout conversion test completed');
    } else {
        console.log('❌ Begin checkout conversion not configured');
        console.log('Create "Tour Booking Started" conversion action in Google Ads first');
    }
};

// Make functions available globally
if (typeof window !== 'undefined') {
    window.testAllConversions = testAllConversions;
    window.testPageView = testPageView;
    window.testAddToCart = testAddToCart;
    window.testBeginCheckout = testBeginCheckout;

    console.log('🧪 Conversion testing functions available:');
    console.log('- window.testAllConversions()');
    console.log('- window.testPageView()');
    console.log('- window.testAddToCart()');
    console.log('- window.testBeginCheckout()');
}

export { testAllConversions, testPageView, testAddToCart, testBeginCheckout };