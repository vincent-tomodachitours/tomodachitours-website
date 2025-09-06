/**
 * Test script for remarketing_audience event implementation
 * 
 * This script validates that the remarketing_audience events are properly
 * configured and firing correctly for both basic and dynamic remarketing.
 */

import remarketingManager from '../src/services/remarketingManager.js';
import dynamicRemarketingService from '../src/services/dynamicRemarketingService.js';

// Mock environment variables for testing
if (!process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID) {
    process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = 'AW-17482092392';
}

// Mock gtag function for testing
if (typeof window !== 'undefined') {
    window.gtag = window.gtag || function () {
        console.log('gtag called:', arguments);
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push = function (data) {
        console.log('dataLayer.push called:', data);
    };
}

/**
 * Test basic remarketing manager configuration
 */
async function testBasicRemarketing() {
    console.log('\n=== Testing Basic Remarketing Manager ===');

    // Validate configuration
    const validation = remarketingManager.validateRemarketingConfiguration();
    console.log('Configuration validation:', validation);

    if (!validation.isValid) {
        console.error('❌ Basic remarketing configuration is invalid');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        return false;
    }

    // Test remarketing event firing
    console.log('\nTesting remarketing event firing...');
    const testSuccess = await remarketingManager.testRemarketingEvent();

    if (testSuccess) {
        console.log('✅ Basic remarketing test passed');
        return true;
    } else {
        console.error('❌ Basic remarketing test failed');
        return false;
    }
}

/**
 * Test dynamic remarketing service configuration
 */
async function testDynamicRemarketing() {
    console.log('\n=== Testing Dynamic Remarketing Service ===');

    // Validate configuration
    const validation = dynamicRemarketingService.validateDynamicRemarketingConfiguration();
    console.log('Configuration validation:', validation);

    if (!validation.isValid) {
        console.error('❌ Dynamic remarketing configuration is invalid');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        return false;
    }

    // Test dynamic remarketing event firing
    console.log('\nTesting dynamic remarketing event firing...');
    const testSuccess = await dynamicRemarketingService.testDynamicRemarketingEvent();

    if (testSuccess) {
        console.log('✅ Dynamic remarketing test passed');
        return true;
    } else {
        console.error('❌ Dynamic remarketing test failed');
        return false;
    }
}

/**
 * Test remarketing_audience event structure
 */
function testRemarketingAudienceEventStructure() {
    console.log('\n=== Testing remarketing_audience Event Structure ===');

    let eventsFired = [];

    // Mock gtag to capture events
    const originalGtag = window.gtag;
    window.gtag = function (command, eventName, parameters) {
        if (command === 'event' && eventName === 'remarketing_audience') {
            eventsFired.push({ eventName, parameters });
        }
        console.log(`gtag('${command}', '${eventName}', ${JSON.stringify(parameters, null, 2)})`);
    };

    // Test firing a remarketing_audience event
    remarketingManager.fireRemarketingEvent('test_audience', {
        tourCategory: 'Cultural',
        tourLocation: 'Gion',
        tourId: 'gion-tour',
        price: 8000
    });

    // Restore original gtag
    window.gtag = originalGtag;

    // Validate event structure
    if (eventsFired.length === 0) {
        console.error('❌ No remarketing_audience events were fired');
        return false;
    }

    const event = eventsFired[0];
    const requiredFields = ['send_to', 'audience_id', 'event_category', 'custom_parameter_1'];
    const missingFields = requiredFields.filter(field => !event.parameters[field]);

    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return false;
    }

    console.log('✅ remarketing_audience event structure is correct');
    console.log('Event details:', JSON.stringify(event, null, 2));
    return true;
}

/**
 * Test integration with tour view tracking
 */
function testTourViewIntegration() {
    console.log('\n=== Testing Tour View Integration ===');

    let eventsFired = [];

    // Mock gtag to capture events
    const originalGtag = window.gtag;
    window.gtag = function (command, eventName, parameters) {
        if (command === 'event') {
            eventsFired.push({ eventName, parameters });
        }
    };

    // Simulate tour view
    const tourData = {
        tourId: 'gion-tour',
        tourName: 'Gion District Cultural Walking Tour',
        price: 8000
    };

    // Process tour view through remarketing manager
    remarketingManager.processTourView(tourData);

    // Process tour view through dynamic remarketing
    dynamicRemarketingService.addDynamicRemarketingParameters(tourData);

    // Restore original gtag
    window.gtag = originalGtag;

    // Check if remarketing_audience events were fired
    const remarketingEvents = eventsFired.filter(e => e.eventName === 'remarketing_audience');

    if (remarketingEvents.length === 0) {
        console.error('❌ No remarketing_audience events fired during tour view');
        return false;
    }

    console.log('✅ Tour view integration working correctly');
    console.log(`Fired ${remarketingEvents.length} remarketing_audience events`);
    return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 Starting remarketing_audience event tests...\n');

    const results = {
        basicRemarketing: await testBasicRemarketing(),
        dynamicRemarketing: await testDynamicRemarketing(),
        eventStructure: testRemarketingAudienceEventStructure(),
        tourViewIntegration: testTourViewIntegration()
    };

    console.log('\n=== Test Results Summary ===');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    return allPassed;
}

// Export for use in other scripts
export {
    testBasicRemarketing,
    testDynamicRemarketing,
    testRemarketingAudienceEventStructure,
    testTourViewIntegration,
    runAllTests
};

// Run tests if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
    runAllTests();
}