/**
 * Manual Testing Script for GTM Conversion Configuration
 * This script can be run in the browser console to test GTM conversion tracking
 */

import gtmService from './gtmService.js';
import gtmTestingUtils from './gtmTestingUtils.js';

class GTMManualTester {
    constructor() {
        this.testResults = [];
    }

    /**
     * Initialize GTM and run comprehensive tests
     */
    async runFullTest() {
        console.log('🚀 Starting GTM Conversion Tracking Tests...');

        try {
            // Initialize GTM service
            console.log('📋 Initializing GTM Service...');
            await gtmService.initialize();

            // Enable debug mode
            gtmService.enableDebugMode(true);

            // Test 1: Purchase Conversion
            console.log('💰 Testing Purchase Conversion...');
            const purchaseResult = this.testPurchaseConversion();
            this.testResults.push({ test: 'Purchase Conversion', result: purchaseResult });

            // Test 2: Begin Checkout Conversion
            console.log('🛒 Testing Begin Checkout Conversion...');
            const checkoutResult = this.testBeginCheckoutConversion();
            this.testResults.push({ test: 'Begin Checkout Conversion', result: checkoutResult });

            // Test 3: View Item Conversion
            console.log('👀 Testing View Item Conversion...');
            const viewItemResult = this.testViewItemConversion();
            this.testResults.push({ test: 'View Item Conversion', result: viewItemResult });

            // Test 4: Add Payment Info Conversion
            console.log('💳 Testing Add Payment Info Conversion...');
            const paymentResult = this.testAddPaymentInfoConversion();
            this.testResults.push({ test: 'Add Payment Info Conversion', result: paymentResult });

            // Test 5: GTM Container Validation
            console.log('🔍 Validating GTM Container...');
            const containerValidation = gtmTestingUtils.validateGTMLoading(process.env.REACT_APP_GTM_CONTAINER_ID);
            this.testResults.push({ test: 'GTM Container Validation', result: containerValidation });

            // Test 6: Generate Diagnostic Report
            console.log('📊 Generating Diagnostic Report...');
            const diagnosticReport = gtmTestingUtils.generateDiagnosticReport();
            this.testResults.push({ test: 'Diagnostic Report', result: diagnosticReport });

            // Display Results
            this.displayResults();

            return this.testResults;

        } catch (error) {
            console.error('❌ GTM Test Failed:', error);
            return { error: error.message };
        }
    }

    /**
     * Test purchase conversion tracking
     */
    testPurchaseConversion() {
        const transactionData = {
            value: 15000,
            currency: 'JPY',
            transaction_id: `manual_test_${Date.now()}`,
            items: [{
                item_id: 'morning_tour',
                item_name: 'Morning Arashiyama Tour',
                item_category: 'tour',
                price: 15000,
                quantity: 1
            }],
            tour_id: 'morning_tour',
            tour_name: 'Morning Arashiyama Tour',
            booking_date: '2025-01-15',
            payment_provider: 'stripe'
        };

        const customerData = {
            email: 'test_email_hash',
            phone_number: 'test_phone_hash'
        };

        const result = gtmService.trackPurchaseConversion(transactionData, customerData);

        return {
            success: result,
            transactionData,
            customerData,
            dataLayerEvents: window.dataLayer.slice(-2) // Last 2 events
        };
    }

    /**
     * Test begin checkout conversion tracking
     */
    testBeginCheckoutConversion() {
        const checkoutData = {
            value: 15000,
            currency: 'JPY',
            items: [{
                item_id: 'night_tour',
                item_name: 'Night Gion Tour',
                item_category: 'tour',
                price: 15000,
                quantity: 1
            }],
            tour_id: 'night_tour',
            tour_name: 'Night Gion Tour'
        };

        const result = gtmService.trackBeginCheckoutConversion(checkoutData);

        return {
            success: result,
            checkoutData,
            dataLayerEvents: window.dataLayer.slice(-2)
        };
    }

    /**
     * Test view item conversion tracking
     */
    testViewItemConversion() {
        const itemData = {
            value: 15000,
            currency: 'JPY',
            items: [{
                item_id: 'uji_tour',
                item_name: 'Uji Tea Tour',
                item_category: 'tour',
                price: 15000,
                quantity: 1
            }],
            tour_id: 'uji_tour',
            tour_name: 'Uji Tea Tour',
            item_category: 'tour'
        };

        const result = gtmService.trackViewItemConversion(itemData);

        return {
            success: result,
            itemData,
            dataLayerEvents: window.dataLayer.slice(-2)
        };
    }

    /**
     * Test add payment info conversion tracking
     */
    testAddPaymentInfoConversion() {
        const paymentData = {
            value: 15000,
            currency: 'JPY',
            payment_provider: 'payjp',
            tour_id: 'gion_tour'
        };

        const customerData = {
            email: 'test_email_hash_2',
            phone_number: 'test_phone_hash_2'
        };

        const result = gtmService.trackAddPaymentInfoConversion(paymentData, customerData);

        return {
            success: result,
            paymentData,
            customerData,
            dataLayerEvents: window.dataLayer.slice(-2)
        };
    }

    /**
     * Display test results in a formatted way
     */
    displayResults() {
        console.log('\n📋 GTM Conversion Tracking Test Results:');
        console.log('='.repeat(50));

        this.testResults.forEach((test, index) => {
            const status = test.result.success !== false ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.test}`);

            if (test.result.success === false) {
                console.log(`   Error: ${test.result.error || 'Test failed'}`);
            }
        });

        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${this.testResults.filter(t => t.result.success !== false).length}`);
        console.log(`Failed: ${this.testResults.filter(t => t.result.success === false).length}`);

        // Display GTM Service Status
        console.log('\n🔧 GTM Service Status:');
        const status = gtmService.getStatus();
        console.table(status);

        // Display DataLayer Summary
        console.log('\n📊 DataLayer Summary:');
        console.log(`Total Events: ${window.dataLayer.length}`);
        console.log('Recent Events:', window.dataLayer.slice(-5));
    }

    /**
     * Test specific conversion type
     */
    testSingleConversion(conversionType, testData = {}) {
        console.log(`🧪 Testing ${conversionType} conversion...`);

        let result;
        switch (conversionType) {
            case 'purchase':
                result = this.testPurchaseConversion();
                break;
            case 'begin_checkout':
                result = this.testBeginCheckoutConversion();
                break;
            case 'view_item':
                result = this.testViewItemConversion();
                break;
            case 'add_payment_info':
                result = this.testAddPaymentInfoConversion();
                break;
            default:
                console.error(`Unknown conversion type: ${conversionType}`);
                return false;
        }

        console.log(`Result:`, result);
        return result;
    }

    /**
     * Monitor dataLayer events in real-time
     */
    startDataLayerMonitoring(duration = 30000) {
        console.log(`🔍 Starting DataLayer monitoring for ${duration}ms...`);
        return gtmTestingUtils.monitorDataLayerEvents(duration);
    }

    /**
     * Enable GTM preview mode for debugging
     */
    enablePreviewMode(previewToken) {
        const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;
        console.log(`🔧 Enabling GTM preview mode for container ${containerId}...`);

        const result = gtmTestingUtils.enablePreviewMode(containerId, previewToken);

        if (result) {
            console.log('✅ Preview mode enabled successfully');
            console.log('💡 Open GTM preview console to see tag firing in real-time');
        } else {
            console.log('❌ Failed to enable preview mode');
        }

        return result;
    }
}

// Create global instance for easy access in browser console
window.gtmTester = new GTMManualTester();

// Export for module usage
export default GTMManualTester;

// Usage instructions
console.log(`
🎯 GTM Manual Testing Instructions:

1. Run full test suite:
   gtmTester.runFullTest()

2. Test specific conversion:
   gtmTester.testSingleConversion('purchase')
   gtmTester.testSingleConversion('begin_checkout')
   gtmTester.testSingleConversion('view_item')
   gtmTester.testSingleConversion('add_payment_info')

3. Monitor dataLayer events:
   gtmTester.startDataLayerMonitoring(30000)

4. Enable GTM preview mode:
   gtmTester.enablePreviewMode('your-preview-token')

5. Check GTM service status:
   gtmService.getStatus()

6. Generate diagnostic report:
   gtmTestingUtils.generateDiagnosticReport()
`);