#!/usr/bin/env node

/**
 * Live Conversion Tracking Test
 * 
 * This script helps you test if your conversion tracking is working
 * by providing step-by-step debugging instructions.
 */

console.log('🧪 LIVE CONVERSION TRACKING TEST');
console.log('================================');
console.log('');

console.log('🎯 WHAT WE KNOW:');
console.log('• You made test purchases on tomodachitours.com');
console.log('• These purchases are in your bookings database');
console.log('• These purchases are NOT showing in Google Ads conversions');
console.log('• This confirms: CONVERSION TRACKING IS BROKEN');
console.log('');

console.log('🔍 DEBUGGING STEPS:');
console.log('===================');
console.log('');

console.log('STEP 1: Check What\'s Actually Loaded on Your Site');
console.log('Open tomodachitours.com in your browser and run these commands in the console:');
console.log('');

console.log('// Check if GTM is loaded');
console.log('console.log("GTM loaded:", !!window.google_tag_manager);');
console.log('console.log("GTM containers:", Object.keys(window.google_tag_manager || {}));');
console.log('');

console.log('// Check if dataLayer exists');
console.log('console.log("dataLayer exists:", !!window.dataLayer);');
console.log('console.log("dataLayer length:", window.dataLayer?.length);');
console.log('');

console.log('// Check if gtag is available');
console.log('console.log("gtag available:", typeof window.gtag);');
console.log('console.log("gtagConversion available:", typeof window.gtagConversion);');
console.log('');

console.log('STEP 2: Test Manual Conversion Event');
console.log('Run this in your browser console to manually trigger a conversion:');
console.log('');

console.log(`// Manual test conversion
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'test_' + Date.now(),
    value: 15000,
    currency: 'JPY',
    items: [{
      item_id: 'test_tour',
      item_name: 'Test Tour Purchase',
      category: 'Tours',
      quantity: 1,
      price: 15000
    }]
  }
});

console.log('Manual purchase event pushed to dataLayer');`);
console.log('');

console.log('STEP 3: Check Network Tab for Conversion Calls');
console.log('After running the manual test:');
console.log('1. Open browser DevTools → Network tab');
console.log('2. Filter by "google" or "gtag"');
console.log('3. Look for calls to:');
console.log('   • googletagmanager.com/gtag/js');
console.log('   • google-analytics.com/g/collect');
console.log('   • googleadservices.com/pagead/conversion');
console.log('4. If no conversion calls = tracking is broken');
console.log('');

console.log('STEP 4: Check GTM Preview Mode');
console.log('1. Go to Google Tag Manager: https://tagmanager.google.com/');
console.log('2. Open your container: GTM-5S2H4C9V');
console.log('3. Click "Preview" button');
console.log('4. Enter your website URL: https://tomodachitours.com');
console.log('5. Complete a test purchase');
console.log('6. Check if these tags fire:');
console.log('   • Google Ads Conversion Tracking tags');
console.log('   • GA4 Configuration tag');
console.log('   • Any purchase/conversion related tags');
console.log('');

console.log('🚨 LIKELY ISSUES TO CHECK:');
console.log('==========================');
console.log('');

console.log('Issue #1: GTM Container Not Loading');
console.log('• Check if GTM-5S2H4C9V is actually on your site');
console.log('• Look for GTM script in your HTML source');
console.log('• Verify container ID matches your .env file');
console.log('');

console.log('Issue #2: Missing Google Ads Conversion Tags in GTM');
console.log('• Your GTM container might not have Google Ads conversion tags');
console.log('• Tags might exist but not be triggered by purchase events');
console.log('• Conversion labels might be incorrect');
console.log('');

console.log('Issue #3: Purchase Event Not Firing');
console.log('• Your checkout completion might not trigger purchase events');
console.log('• dataLayer.push for purchase might be missing or broken');
console.log('• Event name might be different (e.g., "transaction" vs "purchase")');
console.log('');

console.log('Issue #4: Direct gtag Not Implemented');
console.log('• You might only have GTM but no direct Google Ads gtag');
console.log('• Google Ads expects direct gtag calls for verification');
console.log('• Enhanced conversions require specific gtag setup');
console.log('');

console.log('🔧 IMMEDIATE FIXES TO TRY:');
console.log('===========================');
console.log('');

console.log('Fix #1: Add Direct Google Ads Tracking');
console.log('Add this to your public/index.html <head> section:');
console.log('');

console.log(`<!-- Google Ads Direct Tracking -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5GVJBRE1SY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', 'G-5GVJBRE1SY');
  gtag('config', 'AW-17482092392', {
    send_page_view: false
  });
  
  // Store for manual testing
  window.gtagConversion = gtag;
  
  // Test conversion function
  window.testConversion = function() {
    gtag('event', 'conversion', {
      'send_to': 'AW-17482092392/hKuFCPOD5Y0bEOiejpBB',
      'value': 15000,
      'currency': 'JPY',
      'transaction_id': 'test_' + Date.now()
    });
    console.log('Test conversion fired!');
  };
</script>`);
console.log('');

console.log('Fix #2: Test Direct Conversion');
console.log('After adding the code above, test it:');
console.log('1. Reload your website');
console.log('2. Open browser console');
console.log('3. Run: window.testConversion()');
console.log('4. Check Network tab for conversion calls');
console.log('5. Wait 24 hours and check Google Ads for the test conversion');
console.log('');

console.log('Fix #3: Check Your Checkout Code');
console.log('Look at your checkout completion code and ensure it calls:');
console.log('');

console.log(`// In your checkout success/thank you page
gtmService.trackPurchaseConversion({
  transaction_id: 'order_123',
  value: 15000,
  currency: 'JPY',
  items: [/* your items */]
});

// AND also call direct tracking if available
if (window.gtagConversion) {
  window.gtagConversion('event', 'conversion', {
    'send_to': 'AW-17482092392/hKuFCPOD5Y0bEOiejpBB',
    'value': 15000,
    'currency': 'JPY',
    'transaction_id': 'order_123'
  });
}`);
console.log('');

console.log('🎯 EXPECTED RESULTS:');
console.log('====================');
console.log('');

console.log('If tracking is working correctly:');
console.log('✅ Manual test conversion appears in Google Ads within 24 hours');
console.log('✅ Network tab shows calls to googleadservices.com/pagead/conversion');
console.log('✅ GTM Preview mode shows Google Ads conversion tags firing');
console.log('✅ Enhanced conversions status changes from "Not Active" to "Active"');
console.log('');

console.log('If tracking is still broken:');
console.log('❌ No conversion calls in Network tab');
console.log('❌ GTM Preview shows no Google Ads tags firing');
console.log('❌ Manual test conversions don\'t appear in Google Ads');
console.log('❌ Enhanced conversions remains "Not Active"');
console.log('');

console.log('📋 ACTION PLAN:');
console.log('===============');
console.log('');

console.log('RIGHT NOW:');
console.log('1. Run the browser console tests above');
console.log('2. Check what\'s actually loaded on your site');
console.log('3. Add the direct Google Ads tracking code');
console.log('4. Test the manual conversion function');
console.log('');

console.log('WITHIN 24 HOURS:');
console.log('1. Check if test conversions appear in Google Ads');
console.log('2. If yes: tracking is fixed, increase ad spend');
console.log('3. If no: deeper debugging needed in GTM setup');
console.log('');

console.log('✅ LIVE CONVERSION TRACKING TEST COMPLETE!');
console.log('The fact that your manual purchases aren\'t tracked confirms the issue is technical.');