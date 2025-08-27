#!/usr/bin/env node

/**
 * Google Ads Conversion Verification Test
 * 
 * This script helps test and verify Google Ads conversion tracking
 */

console.log('🧪 GOOGLE ADS CONVERSION VERIFICATION TEST');
console.log('==========================================');
console.log('');

console.log('📋 MANUAL VERIFICATION STEPS:');
console.log('');

console.log('STEP 1: VERIFY DIRECT GOOGLE ADS TRACKING');
console.log('=========================================');
console.log('1. Open your website: https://tomodachitours.com');
console.log('2. Open browser developer tools (F12)');
console.log('3. In Console tab, run: typeof window.gtagConversion');
console.log('4. Should return: "function"');
console.log('');

console.log('STEP 2: TEST CONVERSION FIRING');
console.log('==============================');
console.log('1. Navigate to a tour page');
console.log('2. In Console, run this test:');
console.log('');
console.log('   window.gtagConversion("event", "conversion", {');
console.log('     send_to: "AW-17482092392/YOUR_CONVERSION_LABEL",');
console.log('     value: 5000,');
console.log('     currency: "JPY"');
console.log('   });');
console.log('');
console.log('3. Check Network tab for gtag requests');
console.log('');

console.log('STEP 3: GOOGLE ADS VERIFICATION');
console.log('===============================');
console.log('1. Go to Google Ads: https://ads.google.com/');
console.log('2. Navigate: Tools & Settings > Measurement > Conversions');
console.log('3. Click on your conversion action');
console.log('4. Click "Check tag" or "Verify tag"');
console.log('5. Enter: https://tomodachitours.com');
console.log('6. Google should now detect the conversion tag');
console.log('');

console.log('STEP 4: REAL CONVERSION TEST');
console.log('============================');
console.log('1. Complete a real booking flow');
console.log('2. Check Google Ads for conversion data (24-48 hour delay)');
console.log('3. Verify conversion appears in reports');
console.log('');

console.log('✅ EXPECTED RESULTS:');
console.log('• Google Ads shows "Tag verified" status');
console.log('• Conversions appear in Google Ads reports');
console.log('• No "tag not verified" warnings');
console.log('');

console.log('🚨 TROUBLESHOOTING:');
console.log('If verification still fails:');
console.log('1. Check conversion labels match exactly');
console.log('2. Ensure website is publicly accessible');
console.log('3. Wait 24-48 hours for Google to re-scan');
console.log('4. Try using Google Tag Assistant browser extension');
console.log('');

console.log('🔍 DEBUGGING COMMANDS FOR BROWSER CONSOLE:');
console.log('==========================================');
console.log('');
console.log('// Check if Google Ads tracking is loaded');
console.log('typeof window.gtagConversion');
console.log('');
console.log('// Check dataLayer');
console.log('window.dataLayer');
console.log('');
console.log('// Test conversion firing');
console.log('window.gtagConversion("event", "conversion", {');
console.log('  send_to: "AW-17482092392/hKuFCPOD5Y0bEOiejpBB", // Replace with your actual label');
console.log('  value: 5000,');
console.log('  currency: "JPY",');
console.log('  transaction_id: "test_" + Date.now()');
console.log('});');
console.log('');

console.log('🎯 WHAT TO LOOK FOR IN GOOGLE ADS:');
console.log('==================================');
console.log('After deploying and waiting 24-48 hours:');
console.log('• Conversion action status changes to "Receiving conversions"');
console.log('• "Tag verified" checkmark appears');
console.log('• No more "tag not yet verified" warnings');
console.log('• Test conversions appear in conversion reports');
console.log('');

console.log('✅ VERIFICATION TEST GUIDE COMPLETE!');
console.log('Deploy your updated code and follow the steps above.');