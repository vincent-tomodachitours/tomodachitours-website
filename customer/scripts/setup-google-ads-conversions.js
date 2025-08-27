#!/usr/bin/env node

/**
 * Google Ads Conversion Actions Setup Script
 * 
 * This script provides instructions for setting up Google Ads conversion actions
 * with proper labels and values for the tour booking business.
 * 
 * Requirements: 1.1, 1.2, 10.1, 10.2
 */

const fs = require('fs');
const path = require('path');

class GoogleAdsConversionSetup {
    constructor() {
        this.conversionActions = [
            {
                name: 'Tour Purchase',
                action: 'purchase',
                category: 'Purchase',
                value: 'Use different values for each conversion',
                countingType: 'One',
                conversionWindow: '30 days',
                viewThroughWindow: '1 day',
                includeInConversions: true,
                attributionModel: 'Data-driven',
                description: 'Completed tour booking with payment confirmation'
            },
            {
                name: 'Begin Checkout',
                action: 'begin_checkout',
                category: 'Lead',
                value: 'Use different values for each conversion',
                countingType: 'One',
                conversionWindow: '30 days',
                viewThroughWindow: '1 day',
                includeInConversions: false,
                attributionModel: 'Data-driven',
                description: 'User started the checkout process for tour booking'
            },
            {
                name: 'View Tour Item',
                action: 'view_item',
                category: 'Page view',
                value: 'Use different values for each conversion',
                countingType: 'One',
                conversionWindow: '30 days',
                viewThroughWindow: '1 day',
                includeInConversions: false,
                attributionModel: 'Data-driven',
                description: 'User viewed a specific tour page'
            },
            {
                name: 'Add Payment Info',
                action: 'add_payment_info',
                category: 'Lead',
                value: 'Use different values for each conversion',
                countingType: 'One',
                conversionWindow: '30 days',
                viewThroughWindow: '1 day',
                includeInConversions: false,
                attributionModel: 'Data-driven',
                description: 'User added payment information during checkout'
            }
        ];

        this.tourSpecificActions = [
            {
                tourName: 'Gion Evening Tour',
                tourId: 'gion_tour_982613',
                averageValue: 5000,
                currency: 'JPY'
            },
            {
                tourName: 'Morning Arashiyama Tour',
                tourId: 'morning_tour_932403',
                averageValue: 4500,
                currency: 'JPY'
            },
            {
                tourName: 'Night Fushimi Inari Tour',
                tourId: 'night_tour_932404',
                averageValue: 5000,
                currency: 'JPY'
            },
            {
                tourName: 'Uji Tea Experience Tour',
                tourId: 'uji_tour_979875',
                averageValue: 6000,
                currency: 'JPY'
            }
        ];
    }

    /**
     * Generate Google Ads conversion action setup instructions
     */
    generateSetupInstructions() {
        console.log('\n🎯 GOOGLE ADS CONVERSION ACTIONS SETUP\n');
        console.log('Follow these steps to create conversion actions in Google Ads:\n');

        console.log('1. ACCESS GOOGLE ADS CONVERSION SECTION');
        console.log('   - Go to https://ads.google.com/');
        console.log('   - Navigate to Tools & Settings > Measurement > Conversions');
        console.log('   - Click the "+" button to create new conversion action\n');

        console.log('2. CREATE CONVERSION ACTIONS');
        console.log('   Create the following conversion actions:\n');

        this.conversionActions.forEach((action, index) => {
            console.log(`   ${index + 1}. ${action.name}`);
            console.log(`      Category: ${action.category}`);
            console.log(`      Value: ${action.value}`);
            console.log(`      Count: ${action.countingType}`);
            console.log(`      Conversion window: ${action.conversionWindow}`);
            console.log(`      View-through conversion window: ${action.viewThroughWindow}`);
            console.log(`      Include in "Conversions": ${action.includeInConversions ? 'Yes' : 'No'}`);
            console.log(`      Attribution model: ${action.attributionModel}`);
            console.log(`      Description: ${action.description}`);
            console.log('');
        });

        console.log('3. CONFIGURE ENHANCED CONVERSIONS');
        console.log('   For each conversion action:');
        console.log('   - Enable "Enhanced conversions"');
        console.log('   - Select "Google Tag Manager" as implementation method');
        console.log('   - Configure customer data parameters: email, phone, name, address\n');

        console.log('4. SET UP CONVERSION VALUES');
        this.generateValueSetupInstructions();

        console.log('\n5. COPY CONVERSION LABELS');
        console.log('   After creating each conversion action:');
        console.log('   - Copy the conversion label (format: AbCdEfGh/1234567890)');
        console.log('   - Update your environment variables with actual labels');
        console.log('   - The conversion ID should be: AW-17482092392\n');
    }

    /**
     * Generate conversion value setup instructions
     */
    generateValueSetupInstructions() {
        console.log('   Configure conversion values based on tour pricing:\n');

        this.tourSpecificActions.forEach((tour, index) => {
            console.log(`   ${index + 1}. ${tour.tourName}`);
            console.log(`      Average Value: ¥${tour.averageValue.toLocaleString()}`);
            console.log(`      Currency: ${tour.currency}`);
            console.log(`      Tour ID: ${tour.tourId}`);
            console.log('');
        });

        console.log('   Value Configuration:');
        console.log('   - Purchase: Use actual booking amount (dynamic)');
        console.log('   - Begin Checkout: Use tour price as estimated value');
        console.log('   - View Item: Use tour price as potential value');
        console.log('   - Add Payment Info: Use tour price as likely conversion value\n');
    }

    /**
     * Generate enhanced conversions setup instructions
     */
    generateEnhancedConversionsInstructions() {
        console.log('\n🔒 ENHANCED CONVERSIONS SETUP\n');

        console.log('1. ENABLE ENHANCED CONVERSIONS');
        console.log('   - In Google Ads, go to Tools & Settings > Measurement > Conversions');
        console.log('   - Click on each conversion action');
        console.log('   - Enable "Enhanced conversions for web"');
        console.log('   - Select "Google Tag Manager" as the implementation method\n');

        console.log('2. CONFIGURE CUSTOMER DATA');
        console.log('   Enhanced conversions will automatically collect:');
        console.log('   - Email address (hashed)');
        console.log('   - Phone number (hashed)');
        console.log('   - First name (hashed)');
        console.log('   - Last name (hashed)');
        console.log('   - Address information (hashed)\n');

        console.log('3. PRIVACY COMPLIANCE');
        console.log('   - All customer data is automatically hashed using SHA-256');
        console.log('   - No plain text personal information is sent to Google');
        console.log('   - Complies with GDPR and privacy regulations');
        console.log('   - Customer consent is handled through privacy policy\n');

        console.log('4. VALIDATION');
        console.log('   - Use Google Ads conversion diagnostics to verify setup');
        console.log('   - Check enhanced conversions status in Google Ads interface');
        console.log('   - Monitor conversion accuracy in Google Ads reports\n');
    }

    /**
     * Generate environment variables template
     */
    generateEnvironmentVariables() {
        console.log('\n📝 ENVIRONMENT VARIABLES TEMPLATE\n');
        console.log('After creating conversion actions, update these variables:\n');

        console.log('# Google Ads Conversion Tracking');
        console.log('REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-17482092392');
        console.log('');
        console.log('# Replace with actual conversion labels from Google Ads');
        console.log('REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={');
        console.log('  "purchase": "REPLACE_WITH_ACTUAL_PURCHASE_LABEL",');
        console.log('  "begin_checkout": "REPLACE_WITH_ACTUAL_BEGIN_CHECKOUT_LABEL",');
        console.log('  "view_item": "REPLACE_WITH_ACTUAL_VIEW_ITEM_LABEL",');
        console.log('  "add_payment_info": "REPLACE_WITH_ACTUAL_ADD_PAYMENT_INFO_LABEL"');
        console.log('}');
        console.log('');
        console.log('# Enhanced Conversions');
        console.log('REACT_APP_ENHANCED_CONVERSIONS_ENABLED=true');
        console.log('REACT_APP_CUSTOMER_DATA_HASHING_SALT=your_secure_salt_here');
        console.log('');
    }

    /**
     * Generate validation checklist
     */
    generateValidationChecklist() {
        console.log('\n✅ VALIDATION CHECKLIST\n');

        const checklist = [
            'Google Ads conversion actions created for all 4 event types',
            'Enhanced conversions enabled for all conversion actions',
            'Conversion values configured appropriately for each action type',
            'Conversion labels copied and updated in environment variables',
            'GTM container configured with Google Ads conversion tags',
            'Test conversions fired successfully in GTM preview mode',
            'Google Ads conversion diagnostics show no errors',
            'Enhanced conversions status shows "Receiving enhanced conversions"',
            'Conversion tracking accuracy validated against actual bookings',
            'Production environment variables updated with actual values'
        ];

        checklist.forEach((item, index) => {
            console.log(`${index + 1}. [ ] ${item}`);
        });

        console.log('\n📊 MONITORING AND VALIDATION');
        console.log('After setup, monitor these metrics:');
        console.log('- Conversion tracking accuracy (should be 95%+)');
        console.log('- Enhanced conversions match rate');
        console.log('- Google Ads conversion diagnostics status');
        console.log('- Attribution accuracy in Google Ads reports\n');
    }

    /**
     * Generate troubleshooting guide
     */
    generateTroubleshootingGuide() {
        console.log('\n🔧 TROUBLESHOOTING GUIDE\n');

        console.log('Common Issues and Solutions:\n');

        console.log('1. CONVERSIONS NOT TRACKING');
        console.log('   - Check GTM preview mode for tag firing');
        console.log('   - Verify conversion labels match Google Ads exactly');
        console.log('   - Confirm GTM container is published');
        console.log('   - Check browser console for JavaScript errors\n');

        console.log('2. ENHANCED CONVERSIONS NOT WORKING');
        console.log('   - Verify customer data is being hashed correctly');
        console.log('   - Check that enhanced conversions are enabled in Google Ads');
        console.log('   - Confirm GTM is sending enhanced conversion data');
        console.log('   - Validate customer data format and completeness\n');

        console.log('3. CONVERSION VALUES INCORRECT');
        console.log('   - Check that dynamic values are being passed correctly');
        console.log('   - Verify currency code is set to "JPY"');
        console.log('   - Confirm discount calculations are accurate');
        console.log('   - Validate transaction ID uniqueness\n');

        console.log('4. GOOGLE ADS WARNINGS');
        console.log('   - Run Google Ads conversion diagnostics');
        console.log('   - Check for missing conversion labels');
        console.log('   - Verify enhanced conversions configuration');
        console.log('   - Confirm attribution model settings\n');
    }

    /**
     * Run the complete setup process
     */
    run() {
        console.log('🎯 GOOGLE ADS CONVERSION ACTIONS SETUP GUIDE\n');

        this.generateSetupInstructions();
        this.generateEnhancedConversionsInstructions();
        this.generateEnvironmentVariables();
        this.generateValidationChecklist();
        this.generateTroubleshootingGuide();

        console.log('🎉 Google Ads conversion setup guide generated!');
        console.log('\nNext steps:');
        console.log('1. Follow the setup instructions to create conversion actions');
        console.log('2. Configure enhanced conversions for each action');
        console.log('3. Update environment variables with actual conversion labels');
        console.log('4. Test conversion tracking using GTM preview mode');
        console.log('5. Validate setup using Google Ads conversion diagnostics\n');
    }
}

// Run the setup if called directly
if (require.main === module) {
    const setup = new GoogleAdsConversionSetup();
    setup.run();
}

module.exports = GoogleAdsConversionSetup;