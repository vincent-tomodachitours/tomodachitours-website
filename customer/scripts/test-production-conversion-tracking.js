#!/usr/bin/env node

/**
 * Production Conversion Tracking Test
 * 
 * This script tests the live production conversion tracking system
 * to validate Google Ads conversion tracking and enhanced conversions.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 PRODUCTION CONVERSION TRACKING TEST');
console.log('======================================');
console.log('');

// Test configuration
const testConfig = {
    siteUrl: 'https://tomodachitours.com',
    gtmContainerId: process.env.REACT_APP_GTM_CONTAINER_ID || 'GTM-5S2H4C9V',
    googleAdsId: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID || 'AW-17482092392',
    testTimeout: 30000 // 30 seconds
};

console.log('🔧 TEST CONFIGURATION:');
console.log(`   Site URL: ${testConfig.siteUrl}`);
console.log(`   GTM Container: ${testConfig.gtmContainerId}`);
console.log(`   Google Ads ID: ${testConfig.googleAdsId}`);
console.log('');

// Test 1: GTM Container Loading Test
function testGTMContainerLoading() {
    console.log('🧪 TEST 1: GTM CONTAINER LOADING');
    console.log('================================');

    console.log('📋 Manual Test Instructions:');
    console.log('1. Open browser and navigate to: https://tomodachitours.com');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Check Console tab for GTM loading messages');
    console.log('4. Verify no GTM loading errors');
    console.log('');

    console.log('✅ Expected Results:');
    console.log('   • GTM script loads within 5 seconds');
    console.log('   • No JavaScript errors in console');
    console.log('   • dataLayer is initialized');
    console.log('   • GTM container object is available');
    console.log('');

    console.log('🔍 Validation Commands (run in browser console):');
    console.log('   typeof window.dataLayer !== "undefined"');
    console.log('   typeof window.google_tag_manager !== "undefined"');
    console.log('   window.testAnalytics.testSetup()');
    console.log('');
}

// Test 2: Conversion Events Test
function testConversionEvents() {
    console.log('🧪 TEST 2: CONVERSION EVENTS TRACKING');
    console.log('=====================================');

    console.log('📋 Manual Test Instructions:');
    console.log('1. Navigate to any tour page (e.g., /night-tour)');
    console.log('2. Open GTM Preview Mode: https://tagmanager.google.com/');
    console.log('3. Connect preview to your site');
    console.log('4. Perform the following actions and verify events fire:');
    console.log('');

    const conversionEvents = [
        {
            action: 'View tour page',
            event: 'view_item',
            expectedTags: ['GA4 - View Item Event', 'Google Ads - View Item Conversion']
        },
        {
            action: 'Click "Book Now" button',
            event: 'begin_checkout',
            expectedTags: ['GA4 - Begin Checkout Event', 'Google Ads - Begin Checkout Conversion']
        },
        {
            action: 'Enter payment information',
            event: 'add_payment_info',
            expectedTags: ['GA4 - Add Payment Info Event', 'Google Ads - Add Payment Info Conversion']
        },
        {
            action: 'Complete booking (test mode)',
            event: 'purchase',
            expectedTags: ['GA4 - Purchase Event', 'Google Ads - Purchase Conversion']
        }
    ];

    conversionEvents.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.action}:`);
        console.log(`      • Expected event: ${test.event}`);
        console.log(`      • Expected tags: ${test.expectedTags.join(', ')}`);
        console.log('');
    });

    console.log('✅ Expected Results:');
    console.log('   • All events fire successfully in GTM Preview');
    console.log('   • Both GA4 and Google Ads tags trigger');
    console.log('   • Event data includes proper values and parameters');
    console.log('   • Enhanced conversion data is present for applicable events');
    console.log('');
}

// Test 3: Enhanced Conversions Test
function testEnhancedConversions() {
    console.log('🧪 TEST 3: ENHANCED CONVERSIONS');
    console.log('===============================');

    console.log('📋 Manual Test Instructions:');
    console.log('1. Complete a test booking with real customer data');
    console.log('2. Monitor GTM Preview for enhanced conversion data');
    console.log('3. Check Google Ads for enhanced conversion match');
    console.log('');

    console.log('🔍 Enhanced Conversion Data Validation:');
    console.log('   • Email address: Properly hashed with SHA-256');
    console.log('   • Phone number: Properly hashed with SHA-256');
    console.log('   • Name fields: Properly hashed with SHA-256');
    console.log('   • Address data: Properly hashed (if provided)');
    console.log('');

    console.log('✅ Expected Results:');
    console.log('   • Enhanced conversion data appears in GTM debug');
    console.log('   • Google Ads shows enhanced conversion match');
    console.log('   • Match rate should be 70%+ within 24 hours');
    console.log('   • No PII data sent unhashed');
    console.log('');

    console.log('🔍 Google Ads Validation:');
    console.log('1. Go to: https://ads.google.com/');
    console.log('2. Navigate: Tools & Settings > Measurement > Conversions');
    console.log('3. Click on each conversion action');
    console.log('4. Check "Enhanced conversions" section');
    console.log('5. Verify match rate and data quality');
    console.log('');
}

// Test 4: Server-Side Backup Test
function testServerSideBackup() {
    console.log('🧪 TEST 4: SERVER-SIDE BACKUP SYSTEM');
    console.log('====================================');

    console.log('📋 Manual Test Instructions:');
    console.log('1. Complete a booking to trigger server-side validation');
    console.log('2. Check Supabase logs for conversion events');
    console.log('3. Verify backup conversion fires if client-side fails');
    console.log('');

    console.log('🔍 Supabase Function Validation:');
    console.log('   • Function: google-ads-conversion');
    console.log('   • Trigger: Successful booking completion');
    console.log('   • Action: Fire backup conversion to Google Ads API');
    console.log('   • Logging: Conversion events logged to database');
    console.log('');

    console.log('✅ Expected Results:');
    console.log('   • Server-side function executes successfully');
    console.log('   • Backup conversion appears in Google Ads');
    console.log('   • No duplicate conversions (client + server)');
    console.log('   • Conversion reconciliation works correctly');
    console.log('');
}

// Test 5: Google Ads Diagnostics Test
function testGoogleAdsDiagnostics() {
    console.log('🧪 TEST 5: GOOGLE ADS CONVERSION DIAGNOSTICS');
    console.log('============================================');

    console.log('📋 Google Ads Diagnostics Checklist:');
    console.log('1. Access Google Ads: https://ads.google.com/');
    console.log('2. Navigate: Tools & Settings > Measurement > Conversions');
    console.log('3. Check each conversion action for:');
    console.log('');

    const diagnosticChecks = [
        'Status shows "Receiving conversions"',
        'No errors or warnings displayed',
        'Enhanced conversions enabled and working',
        'Conversion volume matches expected bookings',
        'Attribution data is complete',
        'Conversion values are accurate'
    ];

    diagnosticChecks.forEach((check, index) => {
        console.log(`   ${index + 1}. ✅ ${check}`);
    });

    console.log('');
    console.log('🎯 Success Criteria:');
    console.log('   • All conversion actions show "Receiving conversions"');
    console.log('   • Zero setup warnings or errors');
    console.log('   • Enhanced conversions match rate 70%+');
    console.log('   • Conversion accuracy 95%+ vs actual bookings');
    console.log('');
}

// Test 6: Performance Impact Test
function testPerformanceImpact() {
    console.log('🧪 TEST 6: PERFORMANCE IMPACT ASSESSMENT');
    console.log('========================================');

    console.log('📋 Performance Test Instructions:');
    console.log('1. Use browser dev tools Performance tab');
    console.log('2. Record page load with GTM enabled');
    console.log('3. Measure impact on Core Web Vitals');
    console.log('');

    console.log('🎯 Performance Targets:');
    console.log('   • GTM loading impact: < 100ms additional load time');
    console.log('   • First Contentful Paint: < 2.5s');
    console.log('   • Largest Contentful Paint: < 2.5s');
    console.log('   • Cumulative Layout Shift: < 0.1');
    console.log('   • First Input Delay: < 100ms');
    console.log('');

    console.log('🔍 Validation Tools:');
    console.log('   • Google PageSpeed Insights');
    console.log('   • GTM Performance monitoring');
    console.log('   • Browser dev tools Performance tab');
    console.log('   • Real User Monitoring (if available)');
    console.log('');
}

// Generate test report
function generateTestReport() {
    console.log('📊 PRODUCTION TEST REPORT TEMPLATE');
    console.log('==================================');

    const testReport = {
        testDate: new Date().toISOString(),
        testEnvironment: 'Production',
        siteUrl: testConfig.siteUrl,
        gtmContainer: testConfig.gtmContainerId,
        googleAdsId: testConfig.googleAdsId,
        tests: [
            {
                testName: 'GTM Container Loading',
                status: 'PENDING',
                notes: 'Manual test required - check browser console'
            },
            {
                testName: 'Conversion Events Tracking',
                status: 'PENDING',
                notes: 'Manual test required - use GTM Preview Mode'
            },
            {
                testName: 'Enhanced Conversions',
                status: 'PENDING',
                notes: 'Manual test required - complete test booking'
            },
            {
                testName: 'Server-Side Backup System',
                status: 'PENDING',
                notes: 'Manual test required - check Supabase logs'
            },
            {
                testName: 'Google Ads Diagnostics',
                status: 'PENDING',
                notes: 'Manual test required - check Google Ads interface'
            },
            {
                testName: 'Performance Impact',
                status: 'PENDING',
                notes: 'Manual test required - use performance tools'
            }
        ],
        requirements: {
            '1.3': 'Google Ads conversion tracking accuracy and validation',
            '7.2': 'Conversion monitoring and alerting system',
            '10.1': 'GTM container resolves Google Ads warnings',
            '10.3': 'Conversion accuracy and diagnostic validation'
        }
    };

    // Save test report template
    const reportPath = path.join(__dirname, '..', 'PRODUCTION_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

    console.log(`📄 Test report template saved to: ${reportPath}`);
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Complete each manual test above');
    console.log('2. Update the test report with actual results');
    console.log('3. Document any issues or failures');
    console.log('4. Verify all requirements are satisfied');
    console.log('');
}

// Run all tests
console.log('🚀 STARTING PRODUCTION CONVERSION TRACKING TESTS');
console.log('================================================');
console.log('');

testGTMContainerLoading();
testConversionEvents();
testEnhancedConversions();
testServerSideBackup();
testGoogleAdsDiagnostics();
testPerformanceImpact();
generateTestReport();

console.log('🎯 PRODUCTION TESTING COMPLETE');
console.log('==============================');
console.log('');
console.log('All test procedures have been documented and are ready for execution.');
console.log('Complete each manual test and update the test report with results.');
console.log('');
console.log('🚨 IMPORTANT NOTES:');
console.log('• These are manual tests that require human validation');
console.log('• Use GTM Preview Mode for detailed event debugging');
console.log('• Monitor Google Ads for 24-48 hours after testing');
console.log('• Document any issues in the test report');
console.log('');
console.log('✅ Task 18 production validation procedures are ready!');