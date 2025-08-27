#!/usr/bin/env node

/**
 * Fix Google Ads Conversion Verification Issue
 * 
 * This script helps resolve the "tag is not yet verified" issue in Google Ads
 * when using Google Tag Manager for conversion tracking.
 */

console.log('🔧 FIXING GOOGLE ADS CONVERSION VERIFICATION ISSUE');
console.log('==================================================');
console.log('');

console.log('📋 ISSUE DESCRIPTION:');
console.log('Google Ads shows: "A conversion action has been created, but the tag is not yet verified"');
console.log('This happens when using GTM instead of direct Google Ads tags.');
console.log('');

console.log('🛠️  SOLUTION STEPS:');
console.log('');

console.log('STEP 1: VERIFY GTM TAG CONFIGURATION');
console.log('=====================================');
console.log('1. Go to Google Tag Manager: https://tagmanager.google.com/');
console.log('2. Open your container: GTM-5S2H4C9V');
console.log('3. Check that your Google Ads Conversion tags are configured correctly:');
console.log('');
console.log('   Required Tag Configuration:');
console.log('   • Tag Type: Google Ads Conversion Tracking');
console.log('   • Conversion ID: AW-17482092392');
console.log('   • Conversion Label: [Your actual conversion label from Google Ads]');
console.log('   • Trigger: Custom event (e.g., begin_checkout)');
console.log('');

console.log('STEP 2: GET ACTUAL CONVERSION LABELS FROM GOOGLE ADS');
console.log('===================================================');
console.log('1. Go to Google Ads: https://ads.google.com/');
console.log('2. Navigate: Tools & Settings > Measurement > Conversions');
console.log('3. Click on your "Begin Checkout" conversion action');
console.log('4. Look for the "Tag setup" section');
console.log('5. Copy the EXACT conversion label (format: AbCdEfGh/1234567890)');
console.log('');

console.log('STEP 3: UPDATE GTM VARIABLES WITH ACTUAL LABELS');
console.log('===============================================');
console.log('In GTM, update these variables with your ACTUAL conversion labels:');
console.log('');
console.log('• Begin Checkout Conversion Label: [Replace with actual label]');
console.log('• Purchase Conversion Label: [Replace with actual label]');
console.log('• View Item Conversion Label: [Replace with actual label]');
console.log('• Add Payment Info Conversion Label: [Replace with actual label]');
console.log('');

console.log('STEP 4: ALTERNATIVE - USE GOOGLE ADS TAG INSTEAD OF GTM');
console.log('========================================================');
console.log('If GTM verification continues to fail, you can use direct Google Ads tags:');
console.log('');
console.log('1. In Google Ads conversion setup, choose "Install the tag yourself"');
console.log('2. Copy the provided JavaScript code');
console.log('3. Add it to your website HTML (we can help with this)');
console.log('');

console.log('STEP 5: FORCE GOOGLE ADS TO RE-VERIFY');
console.log('=====================================');
console.log('1. In Google Ads, go to your conversion action');
console.log('2. Click "Check tag" or "Verify tag"');
console.log('3. Enter your website URL: https://tomodachitours.com');
console.log('4. Google will scan your site for the conversion tag');
console.log('');

console.log('STEP 6: TEST CONVERSION FIRING');
console.log('==============================');
console.log('1. Use GTM Preview Mode');
console.log('2. Navigate to your site and trigger the begin_checkout event');
console.log('3. Verify the Google Ads Conversion tag fires');
console.log('4. Check that the conversion appears in Google Ads (may take 24-48 hours)');
console.log('');

console.log('🚨 COMMON ISSUES AND SOLUTIONS:');
console.log('');
console.log('Issue: "Conversion label mismatch"');
console.log('Solution: Ensure GTM uses EXACT labels from Google Ads (case-sensitive)');
console.log('');
console.log('Issue: "Tag not firing"');
console.log('Solution: Check GTM trigger configuration and event names');
console.log('');
console.log('Issue: "Multiple tags firing"');
console.log('Solution: Ensure only one conversion tag per event');
console.log('');

console.log('🔍 DEBUGGING CHECKLIST:');
console.log('');
console.log('✅ GTM container is published');
console.log('✅ Conversion labels match exactly between GTM and Google Ads');
console.log('✅ GTM tags are firing in Preview Mode');
console.log('✅ Website has GTM container script in <head>');
console.log('✅ No JavaScript errors in browser console');
console.log('✅ Events are being pushed to dataLayer correctly');
console.log('');

console.log('📞 NEXT STEPS:');
console.log('1. Check your actual conversion labels in Google Ads');
console.log('2. Update GTM variables with correct labels');
console.log('3. Republish GTM container');
console.log('4. Test conversion firing');
console.log('5. Wait 24-48 hours for Google Ads verification');
console.log('');

console.log('💡 TIP: If you share your actual conversion labels, I can help update the GTM configuration!');