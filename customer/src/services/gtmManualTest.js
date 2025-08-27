/**
 * GTM Manual Testing Script
 * Use this in the browser console to test GTM conversion tracking
 */

import gtmService from './gtmService';
import bookingFlowManager from './bookingFlowManager';
import gtmTestingUtils from './gtmTestingUtils';

// Test GTM conversion tracking manually
window.testGTMConversions = async () => {
    console.log('🧪 Starting GTM Conversion Testing...');

    try {
        // 1. Initialize GTM service
        console.log('1. Initializing GTM service...');
        const gtmInitialized = await gtmService.initialize();
        console.log('GTM initialized:', gtmInitialized);

        // 2. Enable debug mode
        gtmService.enableDebugMode(true);
        console.log('GTM debug mode enabled');

        // 3. Test booking flow manager
        console.log('2. Testing booking flow manager...');

        const tourData = {
            tourId: 'morning_tour',
            tourName: 'Morning Arashiyama Tour',
            price: 15000,
            date: '2025-01-15',
            time: '10:00',
            location: 'Kyoto',
            category: 'tour'
        };

        const bookingId = bookingFlowManager.initializeBooking(tourData);
        console.log('Booking initialized:', bookingId);

        // 4. Test view_item conversion
        console.log('3. Testing view_item conversion...');
        const viewItemResult = bookingFlowManager.trackViewItem();
        console.log('View item tracked:', viewItemResult);

        // 5. Test begin_checkout conversion
        console.log('4. Testing begin_checkout conversion...');
        const checkoutData = {
            customerData: {
                email: 'test@example.com',
                phone: '+1234567890',
                name: 'Test User',
                firstName: 'Test',
                lastName: 'User'
            }
        };

        const beginCheckoutResult = bookingFlowManager.trackBeginCheckout(checkoutData);
        console.log('Begin checkout tracked:', beginCheckoutResult);

        // 6. Test add_payment_info conversion
        console.log('5. Testing add_payment_info conversion...');
        const paymentData = {
            provider: 'stripe',
            amount: 15000,
            currency: 'JPY',
            paymentMethod: 'card'
        };

        const addPaymentInfoResult = bookingFlowManager.trackAddPaymentInfo(paymentData);
        console.log('Add payment info tracked:', addPaymentInfoResult);

        // 7. Test purchase conversion
        console.log('6. Testing purchase conversion...');
        const transactionData = {
            transactionId: `test_txn_${Date.now()}`,
            finalAmount: 15000,
            paymentProvider: 'stripe'
        };

        const purchaseResult = bookingFlowManager.trackPurchase(transactionData);
        console.log('Purchase tracked:', purchaseResult);

        // 8. Validate GTM status
        console.log('7. Validating GTM status...');
        const gtmStatus = gtmService.getStatus();
        console.log('GTM Status:', gtmStatus);

        // 9. Generate diagnostic report
        console.log('8. Generating diagnostic report...');
        const diagnosticReport = gtmTestingUtils.generateDiagnosticReport();
        console.log('Diagnostic Report:', diagnosticReport);

        console.log('✅ GTM Conversion Testing completed successfully!');
        console.log('Check the GTM debug console and dataLayer for fired events.');

        return {
            success: true,
            bookingId,
            results: {
                viewItem: viewItemResult,
                beginCheckout: beginCheckoutResult,
                addPaymentInfo: addPaymentInfoResult,
                purchase: purchaseResult
            },
            gtmStatus,
            diagnosticReport
        };

    } catch (error) {
        console.error('❌ GTM Conversion Testing failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Test individual conversion types
window.testAddPaymentInfoConversion = () => {
    console.log('🧪 Testing add_payment_info conversion...');

    const testData = {
        value: 15000,
        currency: 'JPY',
        custom_parameters: {
            payment_provider: 'stripe',
            tour_id: 'morning_tour'
        }
    };

    const customerData = {
        email_hash: 'hashed_email_example',
        phone_hash: 'hashed_phone_example'
    };

    gtmService.trackAddPaymentInfoConversion(testData, customerData);
    console.log('✅ Add payment info conversion test fired');
};

window.testPurchaseConversion = () => {
    console.log('🧪 Testing purchase conversion...');

    const testData = {
        value: 15000,
        currency: 'JPY',
        transaction_id: `test_purchase_${Date.now()}`,
        items: [{
            item_id: 'morning_tour',
            item_name: 'Morning Arashiyama Tour',
            item_category: 'tour',
            price: 15000,
            quantity: 1
        }],
        custom_parameters: {
            payment_provider: 'stripe',
            tour_id: 'morning_tour'
        }
    };

    const customerData = {
        email_hash: 'hashed_email_example',
        phone_hash: 'hashed_phone_example'
    };

    gtmService.trackPurchaseConversion(testData, customerData);
    console.log('✅ Purchase conversion test fired');
};

// Test GTM container validation
window.validateGTMSetup = () => {
    console.log('🧪 Validating GTM setup...');

    const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;
    const validation = gtmTestingUtils.validateGTMLoading(containerId);

    console.log('GTM Container Validation:', validation);

    if (validation.containerLoaded && validation.dataLayerExists) {
        console.log('✅ GTM setup is valid');
    } else {
        console.log('❌ GTM setup has issues');
    }

    return validation;
};

// Monitor dataLayer events
window.monitorDataLayerEvents = (duration = 30000) => {
    console.log(`🧪 Monitoring dataLayer events for ${duration}ms...`);
    return gtmTestingUtils.monitorDataLayerEvents(duration);
};

// Test all conversion types with sample data
window.testAllConversions = () => {
    console.log('🧪 Testing all conversion types...');
    return gtmTestingUtils.testAllConversions();
};

console.log('🧪 GTM Manual Testing Functions Available:');
console.log('- testGTMConversions() - Complete conversion flow test');
console.log('- testAddPaymentInfoConversion() - Test add payment info');
console.log('- testPurchaseConversion() - Test purchase conversion');
console.log('- validateGTMSetup() - Validate GTM container setup');
console.log('- monitorDataLayerEvents(duration) - Monitor dataLayer events');
console.log('- testAllConversions() - Test all conversion types');
console.log('');
console.log('💡 Open GTM debug console to see tag firing in real-time');
console.log('💡 Check browser Network tab for Google Ads conversion requests');