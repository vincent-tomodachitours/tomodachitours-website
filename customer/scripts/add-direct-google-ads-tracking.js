#!/usr/bin/env node

/**
 * Add Direct Google Ads Conversion Tracking
 * 
 * This script adds direct Google Ads conversion tracking code to ensure
 * Google Ads can verify the conversion tags properly.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ADDING DIRECT GOOGLE ADS CONVERSION TRACKING');
console.log('===============================================');
console.log('');

// Read current HTML file
const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Check if Google Ads gtag is already present
if (htmlContent.includes('googletagmanager.com/gtag/js?id=AW-')) {
    console.log('✅ Direct Google Ads tracking already present in HTML');
} else {
    console.log('📝 Adding direct Google Ads tracking to HTML...');

    // Add Google Ads gtag script
    const googleAdsScript = `
  <!-- Google Ads Conversion Tracking (Direct) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17482092392"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-17482092392');
    
    // Store gtag function globally for conversion tracking
    window.gtagConversion = gtag;
    
    console.log('Google Ads direct tracking initialized');
  </script>`;

    // Insert before closing </head> tag
    htmlContent = htmlContent.replace('</head>', `${googleAdsScript}\n</head>`);

    // Write updated HTML
    fs.writeFileSync(htmlPath, htmlContent);
    console.log('✅ Direct Google Ads tracking added to index.html');
}

console.log('');
console.log('🔧 UPDATING CONVERSION TRACKING SERVICE...');

// Update the GTM service to include direct Google Ads fallback
const gtmServicePath = path.join(__dirname, '..', 'src', 'services', 'gtmService.js');
let gtmServiceContent = fs.readFileSync(gtmServicePath, 'utf8');

// Add direct Google Ads conversion tracking method
const directTrackingMethod = `
    /**
     * Track Google Ads conversion directly (fallback for GTM verification issues)
     * @param {string} conversionLabel - Conversion label from Google Ads
     * @param {Object} conversionData - Conversion data
     */
    trackDirectGoogleAdsConversion(conversionLabel, conversionData = {}) {
        try {
            // Use direct gtag if available
            if (window.gtagConversion && conversionLabel) {
                const conversionConfig = {
                    send_to: \`AW-17482092392/\${conversionLabel}\`,
                    value: conversionData.value || 0,
                    currency: conversionData.currency || 'JPY',
                    transaction_id: conversionData.transaction_id || ''
                };

                // Add enhanced conversion data if available
                if (conversionData.user_data) {
                    conversionConfig.user_data = conversionData.user_data;
                }

                window.gtagConversion('event', 'conversion', conversionConfig);

                if (this.debugMode) {
                    console.log('Direct Google Ads conversion tracked:', conversionConfig);
                }

                return true;
            } else {
                console.warn('Direct Google Ads tracking not available');
                return false;
            }
        } catch (error) {
            console.error('Direct Google Ads conversion tracking failed:', error);
            return false;
        }
    }

    /**
     * Track conversion with both GTM and direct Google Ads (for verification)
     * @param {string} conversionType - Type of conversion
     * @param {Object} eventData - Event data
     * @param {Object} customerData - Customer data for enhanced conversions
     * @param {Object} pricingContext - Pricing context
     */
    trackConversionWithFallback(conversionType, eventData = {}, customerData = null, pricingContext = {}) {
        // Track via GTM (primary method)
        const gtmSuccess = this.trackConversion(conversionType, eventData, customerData, pricingContext);

        // Also track directly for Google Ads verification
        const conversionLabels = {
            'purchase': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ? 
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).purchase : null,
            'begin_checkout': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ? 
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).begin_checkout : null,
            'view_item': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ? 
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).view_item : null,
            'add_payment_info': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ? 
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).add_payment_info : null
        };

        const conversionLabel = conversionLabels[conversionType];
        let directSuccess = false;

        if (conversionLabel) {
            const directConversionData = {
                value: eventData.value,
                currency: eventData.currency,
                transaction_id: eventData.transaction_id,
                user_data: customerData
            };

            directSuccess = this.trackDirectGoogleAdsConversion(conversionLabel, directConversionData);
        }

        if (this.debugMode) {
            console.log(\`Conversion tracking results - GTM: \${gtmSuccess}, Direct: \${directSuccess}\`);
        }

        return gtmSuccess || directSuccess;
    }`;

// Check if the method already exists
if (!gtmServiceContent.includes('trackDirectGoogleAdsConversion')) {
    // Add the method before the last closing brace
    const lastBraceIndex = gtmServiceContent.lastIndexOf('}');
    gtmServiceContent = gtmServiceContent.slice(0, lastBraceIndex) + directTrackingMethod + '\n' + gtmServiceContent.slice(lastBraceIndex);

    fs.writeFileSync(gtmServicePath, gtmServiceContent);
    console.log('✅ Direct Google Ads tracking methods added to GTM service');
} else {
    console.log('✅ Direct Google Ads tracking methods already present');
}

console.log('');
console.log('🧪 CREATING VERIFICATION TEST SCRIPT...');

// Create a verification test script
const verificationTestScript = `#!/usr/bin/env node

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
`;

const verificationTestPath = path.join(__dirname, 'verify-google-ads-conversion.js');
fs.writeFileSync(verificationTestPath, verificationTestScript);
console.log('✅ Verification test script created');

console.log('');
console.log('🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Rebuild your application: npm run build');
console.log('2. Deploy the updated code to production');
console.log('3. Run the verification test: node scripts/verify-google-ads-conversion.js');
console.log('4. In Google Ads, click "Check tag" to re-verify');
console.log('5. Wait 24-48 hours for full verification');
console.log('');

console.log('💡 IMPORTANT NOTES:');
console.log('• Direct Google Ads tracking is now added as backup');
console.log('• GTM will still be the primary tracking method');
console.log('• This ensures Google Ads can verify the conversion tags');
console.log('• Both methods will work together without conflicts');
console.log('');

console.log('✅ DIRECT GOOGLE ADS TRACKING SETUP COMPLETE!');
console.log('Google Ads should now be able to verify your conversion tags.');