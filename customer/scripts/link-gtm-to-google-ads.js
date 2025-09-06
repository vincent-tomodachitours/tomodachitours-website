#!/usr/bin/env node

/**
 * Link Google Tag Manager to Google Ads Account
 * 
 * This script provides step-by-step instructions to properly link
 * GTM container GTM-5S2H4C9V to your Google Ads account.
 */

console.log('🔗 LINKING GOOGLE TAG MANAGER TO GOOGLE ADS');
console.log('============================================');
console.log('');

console.log('📋 CURRENT CONFIGURATION:');
console.log('• GTM Container ID: GTM-5S2H4C9V');
console.log('• Google Ads ID: AW-17482092392');
console.log('• GA4 Measurement ID: G-5GVJBRE1SY');
console.log('');

console.log('🔗 STEP 1: LINK GOOGLE ADS TO GTM CONTAINER');
console.log('===========================================');
console.log('');
console.log('1. Go to Google Ads: https://ads.google.com/');
console.log('2. Click on Tools & Settings (wrench icon)');
console.log('3. Under "Measurement", click "Linked accounts"');
console.log('4. Look for "Google Tag Manager" section');
console.log('5. Click "Link" or "+" to add a new GTM container');
console.log('6. Enter your GTM Container ID: GTM-5S2H4C9V');
console.log('7. Click "Link"');
console.log('');

console.log('🏷️  STEP 2: CONFIGURE CONVERSION TRACKING IN GTM');
console.log('================================================');
console.log('');
console.log('1. Go to Google Tag Manager: https://tagmanager.google.com/');
console.log('2. Open container: GTM-5S2H4C9V');
console.log('3. Create/verify these tags exist:');
console.log('');

const conversionTags = [
    {
        name: 'Google Ads - Purchase Conversion',
        type: 'Google Ads Conversion Tracking',
        conversionId: 'AW-17482092392',
        conversionLabel: 'hKuFCPOD5Y0bEOiejpBB',
        trigger: 'Purchase Event'
    },
    {
        name: 'Google Ads - Begin Checkout Conversion',
        type: 'Google Ads Conversion Tracking',
        conversionId: 'AW-17482092392',
        conversionLabel: 'mEaUCKmY8Y0bEOiejpBB',
        trigger: 'Begin Checkout Event'
    },
    {
        name: 'Google Ads - View Item Conversion',
        type: 'Google Ads Conversion Tracking',
        conversionId: 'AW-17482092392',
        conversionLabel: '6cIkCMn9540bEOiejpBB',
        trigger: 'View Item Event'
    }
];

conversionTags.forEach((tag, index) => {
    console.log(`   ${index + 1}. ${tag.name}:`);
    console.log(`      • Tag Type: ${tag.type}`);
    console.log(`      • Conversion ID: ${tag.conversionId}`);
    console.log(`      • Conversion Label: ${tag.conversionLabel}`);
    console.log(`      • Trigger: ${tag.trigger}`);
    console.log('');
});

console.log('🎯 STEP 3: SET UP CONVERSION ACTIONS IN GOOGLE ADS');
console.log('==================================================');
console.log('');
console.log('1. In Google Ads, go to Tools & Settings > Conversions');
console.log('2. Click the "+" button to create new conversion actions');
console.log('3. Choose "Website" as the conversion source');
console.log('4. For each conversion action, configure:');
console.log('');

const conversionActions = [
    {
        name: 'Tour Purchase',
        category: 'Purchase',
        value: 'Use different values for each conversion',
        countType: 'One',
        includeInConversions: 'Yes',
        attributionModel: 'Data-driven'
    },
    {
        name: 'Begin Checkout',
        category: 'Lead',
        value: 'Use different values for each conversion',
        countType: 'One',
        includeInConversions: 'No',
        attributionModel: 'Data-driven'
    },
    {
        name: 'View Tour Item',
        category: 'Page view',
        value: 'Use different values for each conversion',
        countType: 'One',
        includeInConversions: 'No',
        attributionModel: 'Data-driven'
    }
];

conversionActions.forEach((action, index) => {
    console.log(`   ${index + 1}. ${action.name}:`);
    console.log(`      • Category: ${action.category}`);
    console.log(`      • Value: ${action.value}`);
    console.log(`      • Count: ${action.countType}`);
    console.log(`      • Include in "Conversions": ${action.includeInConversions}`);
    console.log(`      • Attribution model: ${action.attributionModel}`);
    console.log('');
});

console.log('🔧 STEP 4: CONFIGURE TAG SETUP METHOD');
console.log('=====================================');
console.log('');
console.log('For each conversion action:');
console.log('1. In the "Tag setup" section, choose "Use Google Tag Manager"');
console.log('2. Select your GTM container: GTM-5S2H4C9V');
console.log('3. Copy the conversion label that Google Ads provides');
console.log('4. Use this label in your GTM conversion tag configuration');
console.log('');

console.log('🔍 STEP 5: VERIFY THE CONNECTION');
console.log('================================');
console.log('');
console.log('1. In Google Ads, go to Tools & Settings > Linked accounts');
console.log('2. Under "Google Tag Manager", you should see:');
console.log('   • Container: GTM-5S2H4C9V');
console.log('   • Status: Linked');
console.log('   • Access: Can edit');
console.log('');
console.log('3. In GTM, you should be able to:');
console.log('   • See Google Ads conversion tracking templates');
console.log('   • Import conversion actions from Google Ads');
console.log('   • Use Google Ads variables in your tags');
console.log('');

console.log('🧪 STEP 6: TEST THE INTEGRATION');
console.log('===============================');
console.log('');
console.log('1. Use GTM Preview Mode');
console.log('2. Navigate to your website');
console.log('3. Trigger conversion events (view item, begin checkout, purchase)');
console.log('4. Verify Google Ads conversion tags fire in GTM debug');
console.log('5. Check Google Ads for conversion data (24-48 hour delay)');
console.log('');

console.log('🚨 TROUBLESHOOTING COMMON ISSUES');
console.log('================================');
console.log('');
console.log('Issue: "GTM container not found"');
console.log('Solution: Ensure GTM-5S2H4C9V exists and you have access');
console.log('');
console.log('Issue: "Permission denied"');
console.log('Solution: Ensure same Google account has access to both GTM and Google Ads');
console.log('');
console.log('Issue: "Conversion labels don\'t match"');
console.log('Solution: Copy exact labels from Google Ads conversion setup');
console.log('');
console.log('Issue: "Tags not firing"');
console.log('Solution: Check GTM triggers and dataLayer events');
console.log('');

console.log('📋 CHECKLIST FOR SUCCESSFUL LINKING');
console.log('===================================');
console.log('');
console.log('✅ Google Ads account linked to GTM container GTM-5S2H4C9V');
console.log('✅ Conversion actions created in Google Ads');
console.log('✅ GTM tags configured with correct conversion labels');
console.log('✅ GTM container published with latest changes');
console.log('✅ Website has GTM script with container ID GTM-5S2H4C9V');
console.log('✅ Conversion events firing in GTM Preview Mode');
console.log('✅ Google Ads showing "Receiving conversions" status');
console.log('');

console.log('🎯 EXPECTED OUTCOME');
console.log('==================');
console.log('');
console.log('After successful linking:');
console.log('• Google Ads will recognize GTM as the tracking method');
console.log('• Conversion verification warnings will disappear');
console.log('• You can manage all tracking through GTM');
console.log('• Enhanced conversions will work properly');
console.log('• Automated bidding strategies will have accurate data');
console.log('');

console.log('💡 PRO TIPS');
console.log('===========');
console.log('');
console.log('• Use the same Google account for both GTM and Google Ads');
console.log('• Keep conversion labels synchronized between platforms');
console.log('• Test thoroughly in GTM Preview Mode before going live');
console.log('• Monitor Google Ads for 48 hours after setup');
console.log('• Enable enhanced conversions for better attribution');
console.log('');

console.log('✅ GTM-GOOGLE ADS LINKING GUIDE COMPLETE!');
console.log('Follow these steps to properly connect your GTM container to Google Ads.');