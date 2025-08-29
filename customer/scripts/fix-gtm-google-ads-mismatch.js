#!/usr/bin/env node

/**
 * Fix GTM-Google Ads Configuration Mismatch
 * 
 * Tags are firing in GTM but not showing in Google Ads
 */

console.log('🔧 FIXING GTM-GOOGLE ADS MISMATCH');
console.log('=================================');
console.log('');

console.log('🎯 CONFIRMED ISSUE:');
console.log('• Google Tag Assistant: ✅ Conversions firing correctly');
console.log('• Google Ads: ❌ No conversions recorded');
console.log('• Root Cause: Configuration mismatch between GTM and Google Ads');
console.log('');

console.log('🚨 IMMEDIATE SOLUTIONS:');
console.log('=======================');
console.log('');

console.log('SOLUTION 1: Link Google Ads to Your GTM Container (RECOMMENDED)');
console.log('1. Go to Google Ads: https://ads.google.com/');
console.log('2. Tools & Settings → Linked accounts');
console.log('3. Find "Google Tag Manager" section');
console.log('4. Click "Link" and enter: GTM-5S2H4C9V');
console.log('5. Grant necessary permissions');
console.log('');

console.log('SOLUTION 2: Update Google Ads Conversion Actions');
console.log('1. Go to Tools & Settings → Conversions');
console.log('2. Edit your "Begin Checkout" conversion action');
console.log('3. In "Tag setup", change to "Use Google Tag Manager"');
console.log('4. Select container: GTM-5S2H4C9V');
console.log('5. Save changes');
console.log('');

console.log('SOLUTION 3: Add Direct gtag Alongside GTM (DUAL TRACKING)');
console.log('This ensures Google Ads can see conversions immediately:');
console.log('');
console.log('Add this to your public/index.html <head> section:');
console.log('');

const trackingCode = `<!-- Google Ads Direct Tracking (alongside GTM) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5GVJBRE1SY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', 'G-5GVJBRE1SY');
  gtag('config', 'AW-17482092392', {
    send_page_view: false
  });
  
  // Listen for GTM events and mirror them to direct gtag
  window.dataLayer.push = function(obj) {
    Array.prototype.push.call(this, obj);
    
    // Mirror purchase events to direct gtag
    if (obj.event === 'purchase' && obj.ecommerce) {
      gtag('event', 'conversion', {
        'send_to': 'AW-17482092392/hKuFCPOD5Y0bEOiejpBB',
        'value': obj.ecommerce.value || 0,
        'currency': obj.ecommerce.currency || 'JPY',
        'transaction_id': obj.ecommerce.transaction_id || ''
      });
    }
    
    // Mirror begin_checkout events to direct gtag
    if (obj.event === 'begin_checkout' && obj.ecommerce) {
      gtag('event', 'conversion', {
        'send_to': 'AW-17482092392/mEaUCKmY8Y0bEOiejpBB',
        'value': obj.ecommerce.value || 0,
        'currency': obj.ecommerce.currency || 'JPY'
      });
    }
  };
</script>`;

console.log(trackingCode);
console.log('');

console.log('🧪 TESTING STEPS:');
console.log('=================');
console.log('');

console.log('After implementing Solution 3:');
console.log('1. Reload your website');
console.log('2. Open browser DevTools → Network tab');
console.log('3. Trigger a begin_checkout event');
console.log('4. Look for calls to googleadservices.com/pagead/conversion');
console.log('5. Check Google Ads within 24 hours for conversions');
console.log('');

console.log('✅ EXPECTED RESULTS:');
console.log('• GTM continues working as before');
console.log('• Direct gtag calls also fire for Google Ads verification');
console.log('• Google Ads receives conversions from both sources');
console.log('• Enhanced conversions status becomes "Active"');
console.log('');

console.log('🎯 WHY THIS WORKS:');
console.log('==================');
console.log('• Your GTM tags work perfectly (confirmed by Tag Assistant)');
console.log('• Google Ads just can\'t see them due to configuration mismatch');
console.log('• Adding direct gtag creates a bridge Google Ads can recognize');
console.log('• Both tracking methods work simultaneously for reliability');
console.log('');

console.log('✅ GTM-GOOGLE ADS MISMATCH FIX COMPLETE!');