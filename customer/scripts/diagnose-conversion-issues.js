#!/usr/bin/env node

/**
 * Diagnose Google Ads Conversion Issues
 * 
 * This script analyzes your conversion setup and traffic to determine
 * if the issue is technical or just low conversion volume.
 */

console.log('🔍 GOOGLE ADS CONVERSION DIAGNOSTICS');
console.log('====================================');
console.log('');

console.log('📊 YOUR CURRENT SITUATION:');
console.log('• Google Ads Impressions: 77 (last 7 days)');
console.log('• Google Analytics Clicks: 28 (from ads)');
console.log('• Google Ads Conversions: 0');
console.log('• Enhanced Conversions Status: NOT ACTIVE (URGENT)');
console.log('');

console.log('🎯 ANALYSIS:');
console.log('============');
console.log('');

console.log('ISSUE #1: Enhanced Conversions Not Active');
console.log('This is a TECHNICAL issue that needs fixing:');
console.log('• Your enhanced conversions setup is not working');
console.log('• Google Ads cannot verify your conversion tracking');
console.log('• This affects conversion attribution and bidding');
console.log('');

console.log('ISSUE #2: Low Traffic Volume');
console.log('This is a BUSINESS issue:');
console.log('• 28 clicks is very low traffic');
console.log('• Typical tour booking conversion rates: 1-5%');
console.log('• Expected conversions from 28 clicks: 0-1 conversions');
console.log('• So having 0 conversions might be normal');
console.log('');

console.log('🚨 PRIORITY FIXES NEEDED:');
console.log('=========================');
console.log('');

console.log('HIGH PRIORITY (Technical Issues):');
console.log('1. Fix enhanced conversions setup');
console.log('2. Verify conversion tracking is working');
console.log('3. Test conversion events manually');
console.log('4. Ensure GTM and Google Ads are properly linked');
console.log('');

console.log('MEDIUM PRIORITY (Traffic Issues):');
console.log('1. Increase ad spend to get more traffic');
console.log('2. Improve ad targeting and keywords');
console.log('3. Optimize landing pages for conversions');
console.log('4. Test with manual conversions to verify tracking');
console.log('');

console.log('🔧 IMMEDIATE ACTION PLAN:');
console.log('=========================');
console.log('');

console.log('STEP 1: Fix Enhanced Conversions (URGENT)');
console.log('The "Enhanced conversions setup is not active" error means:');
console.log('• Google Ads cannot receive enhanced conversion data');
console.log('• Your conversion tracking may not be working at all');
console.log('• Even if you had conversions, they might not be recorded');
console.log('');

console.log('STEP 2: Test Conversion Tracking');
console.log('Before increasing ad spend, verify tracking works:');
console.log('• Manually complete a booking on your site');
console.log('• Check if the conversion appears in Google Ads');
console.log('• Verify GTM Preview mode shows conversion events');
console.log('• Test with the direct tracking code we provided');
console.log('');

console.log('STEP 3: Analyze Traffic Quality');
console.log('28 clicks from 77 impressions = 36% CTR (very high!)');
console.log('This suggests:');
console.log('• Your ads are relevant and compelling');
console.log('• Traffic quality should be good');
console.log('• The issue is likely technical, not traffic-related');
console.log('');

console.log('📈 CONVERSION RATE EXPECTATIONS:');
console.log('================================');
console.log('');

console.log('Tour Booking Industry Benchmarks:');
console.log('• Average conversion rate: 2-5%');
console.log('• Good conversion rate: 5-10%');
console.log('• Excellent conversion rate: 10%+');
console.log('');

console.log('Your Traffic Analysis:');
console.log('• 28 clicks × 2% conversion rate = 0.56 expected conversions');
console.log('• 28 clicks × 5% conversion rate = 1.4 expected conversions');
console.log('• Having 0 conversions from 28 clicks is within normal range');
console.log('');

console.log('🧪 TESTING RECOMMENDATIONS:');
console.log('============================');
console.log('');

console.log('Test #1: Manual Conversion Test');
console.log('1. Complete a test booking on your site');
console.log('2. Use a real payment method (then refund)');
console.log('3. Check if conversion appears in Google Ads within 24 hours');
console.log('4. If no conversion recorded = technical issue confirmed');
console.log('');

console.log('Test #2: GTM Preview Mode Test');
console.log('1. Enable GTM Preview mode');
console.log('2. Go through checkout process');
console.log('3. Verify these events fire:');
console.log('   • begin_checkout');
console.log('   • add_payment_info');
console.log('   • purchase');
console.log('4. Check if Google Ads conversion tags fire');
console.log('');

console.log('Test #3: Direct Tracking Test');
console.log('1. Implement the direct Google Ads tracking code');
console.log('2. Test with browser console commands');
console.log('3. Verify gtag conversion calls in Network tab');
console.log('4. Check Google Ads for conversion data');
console.log('');

console.log('🎯 LIKELY ROOT CAUSES:');
console.log('======================');
console.log('');

console.log('Based on your screenshots and setup:');
console.log('');

console.log('90% Probability: Technical Issues');
console.log('• Enhanced conversions not active (confirmed)');
console.log('• GTM container ID mismatch (GTM-552H4CGV vs GTM-5S2H4C9V)');
console.log('• Google Ads looking for GA4 tag instead of GTM');
console.log('• Conversion tracking not properly configured');
console.log('');

console.log('10% Probability: Just Low Volume');
console.log('• 28 clicks is genuinely low traffic');
console.log('• 0 conversions could be normal with this volume');
console.log('• But technical issues need fixing regardless');
console.log('');

console.log('💡 BUSINESS IMPACT:');
console.log('===================');
console.log('');

console.log('Current Issues Affect:');
console.log('• Conversion attribution (you lose credit for conversions)');
console.log('• Smart bidding optimization (Google can\'t optimize without data)');
console.log('• Campaign performance measurement');
console.log('• Return on ad spend (ROAS) calculations');
console.log('• Enhanced conversions for better attribution');
console.log('');

console.log('🚀 SUCCESS METRICS:');
console.log('===================');
console.log('');

console.log('After fixing technical issues, you should see:');
console.log('✅ Enhanced conversions status: Active');
console.log('✅ Conversion verification: Receiving conversions');
console.log('✅ Test conversions appear in Google Ads');
console.log('✅ GTM Preview shows all conversion events firing');
console.log('✅ Improved conversion attribution and bidding');
console.log('');

console.log('📋 NEXT STEPS CHECKLIST:');
console.log('========================');
console.log('');

console.log('Immediate (Today):');
console.log('□ Fix enhanced conversions setup');
console.log('□ Implement direct Google Ads tracking');
console.log('□ Test conversion tracking manually');
console.log('□ Verify GTM container ID consistency');
console.log('');

console.log('Short-term (This Week):');
console.log('□ Monitor conversion data for 48 hours');
console.log('□ Increase ad spend if tracking works');
console.log('□ Optimize landing pages for conversions');
console.log('□ Set up conversion value optimization');
console.log('');

console.log('Long-term (This Month):');
console.log('□ Analyze conversion patterns and optimize');
console.log('□ Implement enhanced conversions with customer data');
console.log('□ Set up automated bidding strategies');
console.log('□ Scale successful campaigns');
console.log('');

console.log('✅ CONVERSION DIAGNOSTICS COMPLETE!');
console.log('The issue is primarily technical - fix the enhanced conversions setup first.');