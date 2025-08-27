#!/usr/bin/env node

/**
 * Add Direct Google Ads Tracking for Verification
 * 
 * This script adds direct Google Ads gtag tracking alongside GTM
 * to ensure conversion verification works properly.
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 ADDING DIRECT GOOGLE ADS TRACKING');
console.log('====================================');
console.log('');

// Configuration from environment
const config = {
    gtagId: 'G-5GVJBRE1SY',
    conversionId: 'AW-17482092392',
    conversionLabels: {
        purchase: 'hKuFCPOD5Y0bEOiejpBB',
        begin_checkout: 'mEaUCKmY8Y0bEOiejpBB',
        view_item: '6cIkCMn9540bEOiejpBB'
    }
};

console.log('📋 CONFIGURATION:');
console.log(`• GA4 Measurement ID: ${config.gtagId}`);
console.log(`• Google Ads Conversion ID: ${config.conversionId}`);
console.log(`• Begin Checkout Label: ${config.conversionLabels.begin_checkout}`);
console.log('');

// Generate the direct Google Ads tracking code
const directTrackingCode = `
<!-- Google Ads Direct Tracking (for verification) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.gtagId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  // Configure GA4
  gtag('config', '${config.gtagId}');
  
  // Configure Google Ads
  gtag('config', '${config.conversionId}');

  // Store gtag reference for conversion tracking
  window.gtagConversion = gtag;
  
  // Enhanced conversions setup
  gtag('config', '${config.conversionId}', {
    'allow_enhanced_conversions': true
  });

  console.log('Direct Google Ads tracking initialized');
</script>`;

console.log('🔧 GENERATED TRACKING CODE:');
console.log('============================');
console.log(directTrackingCode);
console.log('');

// Generate conversion tracking functions
const conversionTrackingCode = `
/**
 * Direct Google Ads Conversion Tracking Functions
 * These work alongside GTM for verification purposes
 */

// Track purchase conversion directly
window.trackDirectPurchaseConversion = function(transactionData) {
  if (window.gtagConversion) {
    window.gtagConversion('event', 'conversion', {
      'send_to': '${config.conversionId}/${config.conversionLabels.purchase}',
      'value': transactionData.value || 0,
      'currency': transactionData.currency || 'JPY',
      'transaction_id': transactionData.transaction_id || ''
    });
    console.log('Direct purchase conversion tracked:', transactionData);
  }
};

// Track begin checkout conversion directly
window.trackDirectBeginCheckoutConversion = function(checkoutData) {
  if (window.gtagConversion) {
    window.gtagConversion('event', 'conversion', {
      'send_to': '${config.conversionId}/${config.conversionLabels.begin_checkout}',
      'value': checkoutData.value || 0,
      'currency': checkoutData.currency || 'JPY',
      'transaction_id': checkoutData.transaction_id || ''
    });
    console.log('Direct begin checkout conversion tracked:', checkoutData);
  }
};

// Track view item conversion directly
window.trackDirectViewItemConversion = function(itemData) {
  if (window.gtagConversion) {
    window.gtagConversion('event', 'conversion', {
      'send_to': '${config.conversionId}/${config.conversionLabels.view_item}',
      'value': itemData.value || 0,
      'currency': itemData.currency || 'JPY'
    });
    console.log('Direct view item conversion tracked:', itemData);
  }
};

// Enhanced conversion tracking with customer data
window.trackDirectEnhancedConversion = function(conversionType, eventData, customerData) {
  if (window.gtagConversion && config.conversionLabels[conversionType]) {
    const conversionConfig = {
      'send_to': \`${config.conversionId}/\${config.conversionLabels[conversionType]}\`,
      'value': eventData.value || 0,
      'currency': eventData.currency || 'JPY',
      'transaction_id': eventData.transaction_id || ''
    };

    // Add enhanced conversion data if available
    if (customerData) {
      conversionConfig.user_data = customerData;
    }

    window.gtagConversion('event', 'conversion', conversionConfig);
    console.log(\`Direct \${conversionType} enhanced conversion tracked:\`, conversionConfig);
  }
};
`;

console.log('🔧 GENERATED CONVERSION FUNCTIONS:');
console.log('===================================');
console.log(conversionTrackingCode);
console.log('');

// Instructions for implementation
console.log('📋 IMPLEMENTATION INSTRUCTIONS:');
console.log('===============================');
console.log('');

console.log('STEP 1: Add Direct Tracking to Your HTML');
console.log('1. Add the tracking code to your public/index.html file');
console.log('2. Place it in the <head> section, BEFORE your GTM code');
console.log('3. This ensures both tracking methods are available');
console.log('');

console.log('STEP 2: Add Conversion Functions to Your App');
console.log('1. Add the conversion tracking functions to a global script');
console.log('2. Or include them in your main JavaScript bundle');
console.log('3. These functions will work alongside your GTM tracking');
console.log('');

console.log('STEP 3: Update Your Checkout Component');
console.log('1. Modify your checkout process to call both GTM and direct tracking');
console.log('2. Example for begin_checkout:');
console.log('');
console.log(`// In your checkout component
const handleBeginCheckout = (checkoutData) => {
  // Existing GTM tracking
  gtmService.trackBeginCheckoutConversion(checkoutData);
  
  // Add direct tracking for verification
  if (window.trackDirectBeginCheckoutConversion) {
    window.trackDirectBeginCheckoutConversion(checkoutData);
  }
};`);
console.log('');

console.log('STEP 4: Test Both Tracking Methods');
console.log('1. Use browser dev tools to verify both methods fire');
console.log('2. Check GTM Preview mode for GTM events');
console.log('3. Check Network tab for direct gtag calls');
console.log('4. Verify Google Ads receives conversions from both sources');
console.log('');

// Generate test script
const testScript = `
// Test script for direct Google Ads tracking
// Run this in browser console after implementing the tracking code

console.log('Testing direct Google Ads tracking...');

// Test begin checkout conversion
const testCheckoutData = {
  value: 15000,
  currency: 'JPY',
  transaction_id: 'test_' + Date.now(),
  items: [{
    item_id: 'test_tour',
    item_name: 'Test Tour',
    category: 'Tours',
    quantity: 1,
    price: 15000
  }]
};

// Test direct tracking
if (window.trackDirectBeginCheckoutConversion) {
  window.trackDirectBeginCheckoutConversion(testCheckoutData);
  console.log('✅ Direct begin checkout conversion test fired');
} else {
  console.log('❌ Direct tracking functions not available');
}

// Test GTM tracking
if (window.dataLayer) {
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: testCheckoutData
  });
  console.log('✅ GTM begin checkout event test fired');
} else {
  console.log('❌ GTM dataLayer not available');
}

console.log('Test complete. Check Network tab for gtag calls.');
`;

console.log('🧪 TEST SCRIPT:');
console.log('===============');
console.log(testScript);
console.log('');

console.log('🎯 EXPECTED RESULTS:');
console.log('====================');
console.log('');
console.log('After implementation:');
console.log('✅ Google Ads will detect the direct gtag implementation');
console.log('✅ Conversion verification will pass');
console.log('✅ You\'ll have dual tracking for reliability');
console.log('✅ Enhanced conversions will work with both methods');
console.log('✅ No data loss during the verification process');
console.log('');

console.log('🔍 VERIFICATION STEPS:');
console.log('======================');
console.log('');
console.log('1. Check Google Ads conversion actions:');
console.log('   • Status should change to "Receiving conversions"');
console.log('   • Verification warning should disappear');
console.log('');
console.log('2. Monitor both tracking methods:');
console.log('   • GTM Preview mode shows GTM events');
console.log('   • Network tab shows direct gtag calls');
console.log('   • Google Ads receives data from both sources');
console.log('');
console.log('3. Test conversion attribution:');
console.log('   • Run test transactions');
console.log('   • Verify conversions appear in Google Ads');
console.log('   • Check attribution data is accurate');
console.log('');

console.log('✅ DIRECT GOOGLE ADS TRACKING SETUP COMPLETE!');
console.log('Implement the generated code to fix your conversion verification issue.');