#!/usr/bin/env node

/**
 * Debug Thank You Page Conversion Tracking
 * 
 * This script helps diagnose why your /thankyou page conversion isn't firing
 * Run this script and then visit your /thankyou page to see what's happening
 */

console.log('🔍 DEBUGGING THANK YOU PAGE CONVERSION');
console.log('=====================================');
console.log('');

console.log('📋 CURRENT SETUP ANALYSIS:');
console.log('• Conversion Action: Purchase - Thank You Page');
console.log('• Conversion ID: 17482092392');
console.log('• Conversion Label: rkbrCK6I14bEOiejpBB');
console.log('• GTM Container: GTM-5S2H4C9V');
console.log('• Expected Trigger: Page visit to /thankyou');
console.log('');

console.log('🚨 COMMON ISSUES FOR PAGE-BASED CONVERSIONS:');
console.log('');

console.log('1. CONVERSION ACTION CONFIGURATION');
console.log('   ❌ Problem: Conversion action not set up for page visits');
console.log('   ✅ Solution: In Google Ads, edit your conversion action:');
console.log('      • Go to Tools & Settings → Conversions');
console.log('      • Edit "Purchase - Thank You Page"');
console.log('      • In "Tag setup", ensure it\'s set to "Use Google Tag Manager"');
console.log('      • Select container: GTM-5S2H4C9V');
console.log('      • Make sure "Count" is set to "One" (not "Every")');
console.log('');

console.log('2. GTM TAG CONFIGURATION');
console.log('   ❌ Problem: No GTM tag configured for this conversion');
console.log('   ✅ Solution: In GTM (https://tagmanager.google.com/):');
console.log('      • Create a new tag:');
console.log('        - Tag Type: Google Ads Conversion Tracking');
console.log('        - Conversion ID: AW-17482092392');
console.log('        - Conversion Label: rkbrCK6I14bEOiejpBB');
console.log('        - Value: Use variable or set to dynamic value');
console.log('        - Currency: JPY');
console.log('      • Set trigger to fire on:');
console.log('        - Page View');
console.log('        - Page Path contains "/thankyou"');
console.log('');

console.log('3. GTM TRIGGER CONFIGURATION');
console.log('   ❌ Problem: Trigger not properly configured');
console.log('   ✅ Solution: Create/verify trigger:');
console.log('      • Trigger Type: Page View');
console.log('      • Trigger fires on: Some Page Views');
console.log('      • Condition: Page Path contains "/thankyou"');
console.log('      • OR: Page URL contains "thankyou"');
console.log('');

console.log('4. REACT ROUTER ISSUES');
console.log('   ❌ Problem: GTM not detecting React route changes');
console.log('   ✅ Solution: Your app should push history change events');
console.log('      • Check if dataLayer.push is called on route change');
console.log('      • May need to manually trigger page view event');
console.log('');

console.log('🧪 TESTING STEPS:');
console.log('');

console.log('STEP 1: Test GTM Loading');
console.log('1. Visit your website: https://tomodachitours.com');
console.log('2. Open browser console (F12)');
console.log('3. Type: window.dataLayer');
console.log('4. Should see an array with GTM events');
console.log('5. Type: window.google_tag_manager');
console.log('6. Should see GTM object with your container');
console.log('');

console.log('STEP 2: Test GTM Preview Mode');
console.log('1. Go to GTM: https://tagmanager.google.com/');
console.log('2. Open container: GTM-5S2H4C9V');
console.log('3. Click "Preview" button');
console.log('4. Enter your website URL');
console.log('5. Navigate to /thankyou page');
console.log('6. Check if your conversion tag fires');
console.log('');

console.log('STEP 3: Manual Conversion Test');
console.log('1. Visit: https://tomodachitours.com/thankyou');
console.log('2. Open browser console');
console.log('3. Run this command to manually trigger conversion:');
console.log('');
console.log('   window.dataLayer.push({');
console.log('     event: "conversion",');
console.log('     google_ads: {');
console.log('       conversion_id: "AW-17482092392",');
console.log('       conversion_label: "rkbrCK6I14bEOiejpBB",');
console.log('       value: 7000,');
console.log('       currency: "JPY"');
console.log('     }');
console.log('   });');
console.log('');

console.log('STEP 4: Check Google Ads');
console.log('1. Go to Google Ads: https://ads.google.com/');
console.log('2. Tools & Settings → Conversions');
console.log('3. Click on "Purchase - Thank You Page"');
console.log('4. Check "Recent conversions" section');
console.log('5. Should see test conversion within 15-30 minutes');
console.log('');

console.log('🔧 QUICK FIX SUGGESTIONS:');
console.log('');

console.log('Option 1: Add Direct Conversion Code to Thank You Page');
console.log('Add this to your Thankyou.jsx useEffect:');
console.log('');
console.log('// Direct Google Ads conversion tracking');
console.log('window.dataLayer = window.dataLayer || [];');
console.log('window.dataLayer.push({');
console.log('  event: "conversion",');
console.log('  send_to: "AW-17482092392/rkbrCK6I14bEOiejpBB",');
console.log('  value: transactionData.value || 7000,');
console.log('  currency: "JPY",');
console.log('  transaction_id: transactionData.transactionId');
console.log('});');
console.log('');

console.log('Option 2: Use gtag Direct Call');
console.log('Add this to your Thankyou.jsx useEffect:');
console.log('');
console.log('if (typeof gtag !== "undefined") {');
console.log('  gtag("event", "conversion", {');
console.log('    send_to: "AW-17482092392/rkbrCK6I14bEOiejpBB",');
console.log('    value: transactionData.value || 7000,');
console.log('    currency: "JPY",');
console.log('    transaction_id: transactionData.transactionId');
console.log('  });');
console.log('}');
console.log('');

console.log('🎯 MOST LIKELY ISSUE:');
console.log('Based on your setup, the most likely issue is that you need to:');
console.log('1. Create a GTM tag for this specific conversion');
console.log('2. Set up a trigger that fires on /thankyou page visits');
console.log('3. Make sure the conversion label matches exactly');
console.log('');

console.log('📞 NEXT STEPS:');
console.log('1. Run the manual test above');
console.log('2. Check GTM Preview Mode');
console.log('3. Verify conversion action settings in Google Ads');
console.log('4. If still not working, try the direct conversion code');
console.log('');

console.log('💡 TIP: Google Ads conversions can take 15-30 minutes to show up');
console.log('    Use GTM Preview Mode for immediate debugging');
console.log('');

console.log('🔗 USEFUL LINKS:');
console.log('• GTM: https://tagmanager.google.com/');
console.log('• Google Ads Conversions: https://ads.google.com/aw/conversions/');
console.log('• GTM Preview Mode Guide: https://support.google.com/tagmanager/answer/6107056');