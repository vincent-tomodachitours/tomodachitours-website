/**
 * Comprehensive Event Testing Script
 * 
 * This script analyzes all GA4 and Google Ads events in the codebase
 * to identify potential issues with event structure, parameters, and implementation.
 */

// Mock environment for testing
if (typeof process === 'undefined') {
    global.process = {
        env: {
            REACT_APP_GOOGLE_ADS_CONVERSION_ID: 'AW-17482092392',
            REACT_APP_GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',
            NODE_ENV: 'production'
        }
    };
}

// Mock gtag and dataLayer for testing
let eventLog = [];
let dataLayerLog = [];

const mockGtag = function (command, eventName, parameters) {
    eventLog.push({
        timestamp: new Date().toISOString(),
        command,
        eventName,
        parameters: JSON.parse(JSON.stringify(parameters || {}))
    });
    console.log(`gtag('${command}', '${eventName}', ${JSON.stringify(parameters, null, 2)})`);
};

const mockDataLayer = {
    push: function (data) {
        dataLayerLog.push({
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(data))
        });
        console.log('dataLayer.push:', JSON.stringify(data, null, 2));
    }
};

// Set up global mocks
if (typeof window !== 'undefined') {
    window.gtag = mockGtag;
    window.dataLayer = mockDataLayer;
} else {
    global.window = {
        gtag: mockGtag,
        dataLayer: mockDataLayer,
        location: { pathname: '/test' },
        sessionStorage: {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { }
        },
        localStorage: {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { }
        }
    };
}

/**
 * Event validation rules based on GA4 and Google Ads best practices
 */
const EVENT_VALIDATION_RULES = {
    // GA4 Standard Events
    'purchase': {
        required: ['transaction_id', 'value', 'currency'],
        recommended: ['items'],
        googleAds: true,
        description: 'Purchase completion event'
    },
    'begin_checkout': {
        required: ['currency', 'value'],
        recommended: ['items'],
        googleAds: true,
        description: 'Checkout initiation event'
    },
    'add_to_cart': {
        required: ['currency', 'value'],
        recommended: ['items'],
        googleAds: true,
        description: 'Add to cart event'
    },
    'view_item': {
        required: ['currency', 'value'],
        recommended: ['items'],
        googleAds: true,
        description: 'Item view event'
    },
    'user_engagement': {
        required: ['engagement_time_msec'],
        recommended: [],
        googleAds: false,
        description: 'User engagement tracking'
    },

    // Google Ads Conversion Events
    'conversion': {
        required: ['send_to'],
        recommended: ['value', 'currency', 'transaction_id'],
        googleAds: true,
        description: 'Google Ads conversion event'
    },

    // Remarketing Events
    'remarketing_audience': {
        required: ['send_to', 'audience_id'],
        recommended: ['custom_parameter_1', 'custom_parameter_2', 'value', 'currency'],
        googleAds: true,
        description: 'Remarketing audience event'
    },

    // Custom Events
    'tour_image_click': {
        required: ['event_category', 'event_label'],
        recommended: ['tour_id', 'tour_name'],
        googleAds: false,
        description: 'Tour image interaction'
    },
    'tour_tab_click': {
        required: ['event_category', 'event_label'],
        recommended: ['tour_id', 'tour_name', 'tab_name'],
        googleAds: false,
        description: 'Tour tab interaction'
    },
    'modified_participants': {
        required: ['event_category', 'event_label'],
        recommended: ['participant_type', 'total_participants'],
        googleAds: false,
        description: 'Participant count modification'
    },

    // Abandonment Events
    'abandon_cart': {
        required: ['currency', 'value'],
        recommended: ['items'],
        googleAds: false,
        description: 'Cart abandonment tracking'
    },
    'abandon_checkout': {
        required: ['currency', 'value'],
        recommended: ['items'],
        googleAds: false,
        description: 'Checkout abandonment tracking'
    },

    // Funnel Events
    'funnel_step': {
        required: ['currency', 'value'],
        recommended: ['funnel_step', 'step_number'],
        googleAds: false,
        description: 'Funnel progression tracking'
    },

    // Migration Events
    'migration_alert': {
        required: ['event_category', 'event_label'],
        recommended: [],
        googleAds: false,
        description: 'Migration monitoring alert'
    },
    'parallel_tracking_error': {
        required: ['event_category', 'event_label'],
        recommended: [],
        googleAds: false,
        description: 'Parallel tracking validation error'
    },
    'migration_emergency_rollback': {
        required: ['event_category', 'event_label'],
        recommended: [],
        googleAds: false,
        description: 'Emergency rollback event'
    },
    'rollback_validation_test': {
        required: ['event_category', 'event_label'],
        recommended: [],
        googleAds: false,
        description: 'Rollback system validation'
    }
};

/**
 * Validate individual event structure
 */
function validateEvent(eventName, parameters, context = {}) {
    const validation = {
        eventName,
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        context
    };

    // Check if event is recognized
    const eventRule = EVENT_VALIDATION_RULES[eventName];
    if (!eventRule) {
        validation.warnings.push(`Unknown event type: ${eventName}`);
    } else {
        // Check required parameters
        eventRule.required.forEach(param => {
            if (!parameters || parameters[param] === undefined || parameters[param] === null) {
                validation.errors.push(`Missing required parameter: ${param}`);
                validation.isValid = false;
            }
        });

        // Check recommended parameters
        eventRule.recommended.forEach(param => {
            if (!parameters || parameters[param] === undefined || parameters[param] === null) {
                validation.warnings.push(`Missing recommended parameter: ${param}`);
            }
        });

        // Google Ads specific validations
        if (eventRule.googleAds && parameters) {
            if (eventName === 'conversion' && parameters.send_to) {
                if (!parameters.send_to.includes('AW-')) {
                    validation.errors.push('Invalid Google Ads conversion ID format in send_to');
                    validation.isValid = false;
                }
            }

            if (parameters.value !== undefined) {
                if (typeof parameters.value !== 'number' || parameters.value < 0) {
                    validation.errors.push('Value must be a positive number');
                    validation.isValid = false;
                }
            }

            if (parameters.currency && typeof parameters.currency !== 'string') {
                validation.errors.push('Currency must be a string (e.g., "JPY")');
                validation.isValid = false;
            }
        }
    }

    // General parameter validations
    if (parameters) {
        // Check for common issues
        Object.entries(parameters).forEach(([key, value]) => {
            // Check for undefined values
            if (value === undefined) {
                validation.warnings.push(`Parameter ${key} is undefined`);
            }

            // Check for empty strings in important fields
            if (value === '' && ['transaction_id', 'send_to', 'audience_id'].includes(key)) {
                validation.errors.push(`Parameter ${key} should not be empty`);
                validation.isValid = false;
            }

            // Check for very long parameter values
            if (typeof value === 'string' && value.length > 500) {
                validation.warnings.push(`Parameter ${key} is very long (${value.length} chars)`);
            }
        });
    }

    return validation;
}

/**
 * Test basic tracking events
 */
async function testBasicTrackingEvents() {
    console.log('\n=== Testing Basic Tracking Events ===');

    try {
        // Import and test basic tracking
        const { trackEngagementTime, trackCustomEvent, trackTourImageClick, trackParticipantChange, trackTourTabClick } =
            await import('../src/services/analytics/basicTracking.js');

        const results = [];

        // Test engagement time tracking
        eventLog = [];
        trackEngagementTime(30);
        if (eventLog.length > 0) {
            results.push(validateEvent(eventLog[0].eventName, eventLog[0].parameters, { source: 'basicTracking.js' }));
        }

        // Test custom event
        eventLog = [];
        trackCustomEvent('test_event', { test_param: 'test_value' });
        if (eventLog.length > 0) {
            results.push(validateEvent(eventLog[0].eventName, eventLog[0].parameters, { source: 'basicTracking.js' }));
        }

        // Test tour image click
        eventLog = [];
        trackTourImageClick('gion-tour', 'Gion Tour', 0, 'main_image');
        if (eventLog.length > 0) {
            results.push(validateEvent(eventLog[0].eventName, eventLog[0].parameters, { source: 'basicTracking.js' }));
        }

        // Test participant change
        eventLog = [];
        trackParticipantChange('Gion Tour', 'adult', 1, 2, 2);
        if (eventLog.length > 0) {
            results.push(validateEvent(eventLog[0].eventName, eventLog[0].parameters, { source: 'basicTracking.js' }));
        }

        // Test tour tab click
        eventLog = [];
        trackTourTabClick('gion-tour', 'Gion Tour', 'Details', 0);
        if (eventLog.length > 0) {
            results.push(validateEvent(eventLog[0].eventName, eventLog[0].parameters, { source: 'basicTracking.js' }));
        }

        return results;
    } catch (error) {
        console.error('Error testing basic tracking events:', error);
        return [{ eventName: 'basic_tracking_test', isValid: false, errors: [error.message] }];
    }
}

/**
 * Test abandonment tracking events
 */
async function testAbandonmentTrackingEvents() {
    console.log('\n=== Testing Abandonment Tracking Events ===');

    try {
        const { trackCartAbandonment, trackCheckoutAbandonment, trackFunnelStep } =
            await import('../src/services/analytics/abandonmentTracking.js');

        const results = [];

        // Test cart abandonment
        eventLog = [];
        trackCartAbandonment();
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'abandonmentTracking.js' }));
        });

        // Test checkout abandonment
        eventLog = [];
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion Tour',
            price: 8000
        };
        trackCheckoutAbandonment('payment', tourData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'abandonmentTracking.js' }));
        });

        // Test funnel step
        eventLog = [];
        trackFunnelStep('checkout_start', tourData, 1);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'abandonmentTracking.js' }));
        });

        return results;
    } catch (error) {
        console.error('Error testing abandonment tracking events:', error);
        return [{ eventName: 'abandonment_tracking_test', isValid: false, errors: [error.message] }];
    }
}

/**
 * Test Google Ads conversion events
 */
async function testGoogleAdsEvents() {
    console.log('\n=== Testing Google Ads Conversion Events ===');

    try {
        const googleAdsTracker = await import('../src/services/googleAdsTracker.ts');

        const results = [];

        // Test purchase conversion
        eventLog = [];
        const transactionData = {
            transactionId: 'test_123',
            value: 8000,
            currency: 'JPY',
            tourId: 'gion-tour',
            tourName: 'Gion Tour'
        };
        await googleAdsTracker.trackGoogleAdsPurchase(transactionData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'googleAdsTracker.ts' }));
        });

        // Test begin checkout
        eventLog = [];
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion Tour',
            price: 8000
        };
        await googleAdsTracker.trackGoogleAdsBeginCheckout(tourData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'googleAdsTracker.ts' }));
        });

        // Test view item
        eventLog = [];
        await googleAdsTracker.trackGoogleAdsViewItem(tourData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'googleAdsTracker.ts' }));
        });

        // Test add to cart
        eventLog = [];
        await googleAdsTracker.trackGoogleAdsAddToCart(tourData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'googleAdsTracker.ts' }));
        });

        return results;
    } catch (error) {
        console.error('Error testing Google Ads events:', error);
        return [{ eventName: 'google_ads_test', isValid: false, errors: [error.message] }];
    }
}

/**
 * Test remarketing events
 */
async function testRemarketingEvents() {
    console.log('\n=== Testing Remarketing Events ===');

    try {
        const remarketingManager = await import('../src/services/remarketingManager.js');
        const dynamicRemarketingService = await import('../src/services/dynamicRemarketingService.js');

        const results = [];

        // Test basic remarketing event
        eventLog = [];
        remarketingManager.default.fireRemarketingEvent('test_audience', {
            tourCategory: 'Cultural',
            tourLocation: 'Gion',
            tourId: 'gion-tour',
            price: 8000
        });
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'remarketingManager.js' }));
        });

        // Test dynamic remarketing
        eventLog = [];
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion Tour',
            price: 8000
        };
        dynamicRemarketingService.default.addDynamicRemarketingParameters(tourData);
        eventLog.forEach(event => {
            results.push(validateEvent(event.eventName, event.parameters, { source: 'dynamicRemarketingService.js' }));
        });

        return results;
    } catch (error) {
        console.error('Error testing remarketing events:', error);
        return [{ eventName: 'remarketing_test', isValid: false, errors: [error.message] }];
    }
}

/**
 * Test enhanced conversion events
 */
async function testEnhancedConversionEvents() {
    console.log('\n=== Testing Enhanced Conversion Events ===');

    try {
        const enhancedConversionService = await import('../src/services/enhancedConversionService.js');

        const results = [];

        // Test enhanced conversion preparation
        const conversionData = {
            conversion_action: 'purchase',
            conversion_value: 8000,
            currency: 'JPY',
            order_id: 'test_123'
        };

        const customerData = {
            email: 'test@example.com',
            phone: '+819012345678',
            firstName: 'Test',
            lastName: 'User'
        };

        const consentData = {
            analytics: 'granted',
            ad_storage: 'granted'
        };

        const enhancedData = enhancedConversionService.default.prepareEnhancedConversion(
            conversionData,
            customerData,
            consentData
        );

        if (enhancedData) {
            // Test enhanced conversion tracking
            eventLog = [];
            await enhancedConversionService.default.trackEnhancedConversion({
                ...enhancedData,
                conversion_label: 'test_label'
            });
            eventLog.forEach(event => {
                results.push(validateEvent(event.eventName, event.parameters, { source: 'enhancedConversionService.js' }));
            });
        }

        return results;
    } catch (error) {
        console.error('Error testing enhanced conversion events:', error);
        return [{ eventName: 'enhanced_conversion_test', isValid: false, errors: [error.message] }];
    }
}

/**
 * Test migration and monitoring events
 */
function testMigrationEvents() {
    console.log('\n=== Testing Migration and Monitoring Events ===');

    const results = [];

    // Test migration alert event
    eventLog = [];
    mockGtag('event', 'migration_alert', {
        event_category: 'migration',
        event_label: 'test_alert',
        alert_type: 'warning',
        message: 'Test migration alert'
    });
    results.push(validateEvent('migration_alert', eventLog[0].parameters, { source: 'migrationMonitor.js' }));

    // Test parallel tracking error
    eventLog = [];
    mockGtag('event', 'parallel_tracking_error', {
        event_category: 'migration',
        event_label: 'high_severity_discrepancy',
        error_type: 'discrepancy',
        severity: 'high'
    });
    results.push(validateEvent('parallel_tracking_error', eventLog[0].parameters, { source: 'parallelTrackingValidator.js' }));

    // Test rollback event
    eventLog = [];
    mockGtag('event', 'migration_emergency_rollback', {
        event_category: 'migration',
        event_label: 'test_rollback',
        reason: 'Test rollback'
    });
    results.push(validateEvent('migration_emergency_rollback', eventLog[0].parameters, { source: 'migrationFeatureFlags.js' }));

    return results;
}

/**
 * Generate comprehensive report
 */
function generateReport(allResults) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalEvents: 0,
            validEvents: 0,
            invalidEvents: 0,
            eventsWithWarnings: 0
        },
        eventsBySource: {},
        eventsByType: {},
        criticalIssues: [],
        warnings: [],
        recommendations: []
    };

    allResults.forEach(result => {
        report.summary.totalEvents++;

        if (result.isValid) {
            report.summary.validEvents++;
        } else {
            report.summary.invalidEvents++;
        }

        if (result.warnings && result.warnings.length > 0) {
            report.summary.eventsWithWarnings++;
        }

        // Group by source
        const source = result.context?.source || 'unknown';
        if (!report.eventsBySource[source]) {
            report.eventsBySource[source] = { total: 0, valid: 0, invalid: 0 };
        }
        report.eventsBySource[source].total++;
        if (result.isValid) {
            report.eventsBySource[source].valid++;
        } else {
            report.eventsBySource[source].invalid++;
        }

        // Group by event type
        if (!report.eventsByType[result.eventName]) {
            report.eventsByType[result.eventName] = { total: 0, valid: 0, invalid: 0 };
        }
        report.eventsByType[result.eventName].total++;
        if (result.isValid) {
            report.eventsByType[result.eventName].valid++;
        } else {
            report.eventsByType[result.eventName].invalid++;
        }

        // Collect critical issues
        if (result.errors && result.errors.length > 0) {
            report.criticalIssues.push({
                eventName: result.eventName,
                source: source,
                errors: result.errors
            });
        }

        // Collect warnings
        if (result.warnings && result.warnings.length > 0) {
            report.warnings.push({
                eventName: result.eventName,
                source: source,
                warnings: result.warnings
            });
        }
    });

    return report;
}

/**
 * Run all event tests
 */
async function runAllEventTests() {
    console.log('🚀 Starting comprehensive event testing...\n');

    const allResults = [];

    try {
        // Test basic tracking events
        const basicResults = await testBasicTrackingEvents();
        allResults.push(...basicResults);

        // Test abandonment tracking events
        const abandonmentResults = await testAbandonmentTrackingEvents();
        allResults.push(...abandonmentResults);

        // Test Google Ads events
        const googleAdsResults = await testGoogleAdsEvents();
        allResults.push(...googleAdsResults);

        // Test remarketing events
        const remarketingResults = await testRemarketingEvents();
        allResults.push(...remarketingResults);

        // Test enhanced conversion events
        const enhancedResults = await testEnhancedConversionEvents();
        allResults.push(...enhancedResults);

        // Test migration events
        const migrationResults = testMigrationEvents();
        allResults.push(...migrationResults);

    } catch (error) {
        console.error('Error during event testing:', error);
        allResults.push({
            eventName: 'test_execution_error',
            isValid: false,
            errors: [error.message],
            context: { source: 'test_runner' }
        });
    }

    // Generate comprehensive report
    const report = generateReport(allResults);

    console.log('\n=== Event Testing Report ===');
    console.log(`Total Events Tested: ${report.summary.totalEvents}`);
    console.log(`Valid Events: ${report.summary.validEvents}`);
    console.log(`Invalid Events: ${report.summary.invalidEvents}`);
    console.log(`Events with Warnings: ${report.summary.eventsWithWarnings}`);

    if (report.criticalIssues.length > 0) {
        console.log('\n❌ Critical Issues Found:');
        report.criticalIssues.forEach(issue => {
            console.log(`  - ${issue.eventName} (${issue.source}): ${issue.errors.join(', ')}`);
        });
    }

    if (report.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        report.warnings.forEach(warning => {
            console.log(`  - ${warning.eventName} (${warning.source}): ${warning.warnings.join(', ')}`);
        });
    }

    console.log('\n📊 Events by Source:');
    Object.entries(report.eventsBySource).forEach(([source, stats]) => {
        console.log(`  ${source}: ${stats.valid}/${stats.total} valid`);
    });

    console.log('\n📈 Events by Type:');
    Object.entries(report.eventsByType).forEach(([eventType, stats]) => {
        console.log(`  ${eventType}: ${stats.valid}/${stats.total} valid`);
    });

    const overallSuccess = report.summary.invalidEvents === 0;
    console.log(`\n${overallSuccess ? '🎉' : '⚠️'} Overall: ${overallSuccess ? 'ALL EVENTS VALID' : 'ISSUES FOUND'}`);

    return report;
}

// Export functions for use in other scripts
export {
    validateEvent,
    testBasicTrackingEvents,
    testAbandonmentTrackingEvents,
    testGoogleAdsEvents,
    testRemarketingEvents,
    testEnhancedConversionEvents,
    testMigrationEvents,
    runAllEventTests,
    EVENT_VALIDATION_RULES
};

// Run tests if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
    runAllEventTests();
}