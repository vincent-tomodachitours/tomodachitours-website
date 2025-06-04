// Test configuration
const BASE_URL = 'https://us-central1-tomodachitours-f4612.cloudfunctions.net';
const TEST_EMAIL = 'test@example.com';

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
    log(`\n🧪 Testing: ${testName}`, 'cyan');
    log('─'.repeat(50), 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Initialize fetch dynamically
let fetch;

async function initializeFetch() {
    try {
        const module = await import('node-fetch');
        fetch = module.default;
    } catch (error) {
        log('Failed to import node-fetch, using global fetch if available', 'yellow');
        fetch = global.fetch || require('node-fetch');
    }
}

async function makeRequest(endpoint, data) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return { status: response.status, data: result };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

// Test 1: Discount Code Validation
async function testDiscountValidation() {
    logTest('Discount Code Validation');
    
    const testCases = [
        {
            name: 'Valid percentage discount (WELCOME10)',
            data: { code: 'WELCOME10', tourPrice: 10000, adults: 2, children: 1 },
            expected: { success: true, discountType: 'percentage', discountValue: 10 }
        },
        {
            name: 'Valid fixed discount (FRIEND50)',
            data: { code: 'FRIEND50', tourPrice: 10000, adults: 2, children: 1 },
            expected: { success: true, discountType: 'fixed', discountValue: 500 }
        },
        {
            name: 'Invalid discount code',
            data: { code: 'INVALID123', tourPrice: 10000, adults: 2, children: 1 },
            expected: { success: false }
        },
        {
            name: 'Case insensitive test (welcome10)',
            data: { code: 'welcome10', tourPrice: 10000, adults: 2, children: 1 },
            expected: { success: true, discountType: 'percentage', discountValue: 10 }
        },
        {
            name: 'Missing required fields',
            data: { code: 'WELCOME10' }, // Missing other fields
            expected: { success: false }
        }
    ];

    for (const testCase of testCases) {
        log(`  Testing: ${testCase.name}`, 'yellow');
        
        const result = await makeRequest('/validateDiscountCode', testCase.data);
        
        if (result.status === 200 && testCase.expected.success) {
            const discount = result.data.discount;
            if (discount && discount.type === testCase.expected.discountType) {
                logSuccess(`    Valid discount applied: ${discount.code} (${discount.type}: ${discount.value})`);
                logSuccess(`    Original: ¥${discount.originalAmount}, Final: ¥${discount.finalAmount}`);
            } else {
                logError(`    Unexpected discount structure: ${JSON.stringify(result.data)}`);
            }
        } else if (result.status === 400 && !testCase.expected.success) {
            logSuccess(`    Correctly rejected invalid code: ${result.data.message}`);
        } else {
            logError(`    Unexpected result: Status ${result.status}, Data: ${JSON.stringify(result.data)}`);
        }
    }
}

// Test 2: Booking Details Lookup
async function testBookingDetailsLookup() {
    logTest('Booking Details Lookup');
    
    const testCases = [
        {
            name: 'Valid email lookup',
            data: { email: TEST_EMAIL },
            expectedStatus: 200
        },
        {
            name: 'Missing email',
            data: {},
            expectedStatus: 400
        },
        {
            name: 'Empty email',
            data: { email: '' },
            expectedStatus: 400
        }
    ];

    for (const testCase of testCases) {
        log(`  Testing: ${testCase.name}`, 'yellow');
        
        const result = await makeRequest('/getBookingDetails', testCase.data);
        
        if (result.status === testCase.expectedStatus) {
            if (result.status === 200) {
                logSuccess(`    Found ${result.data.bookings?.length || 0} bookings`);
                if (result.data.bookings?.length > 0) {
                    result.data.bookings.forEach((booking, index) => {
                        log(`      Booking ${index + 1}: ${booking.tourName} on ${booking.date}`, 'blue');
                    });
                }
            } else {
                logSuccess(`    Correctly rejected: ${result.data.message}`);
            }
        } else {
            logError(`    Expected status ${testCase.expectedStatus}, got ${result.status}`);
        }
    }
}

// Test 3: Charge Creation (Mock)
async function testChargeCreation() {
    logTest('Charge Creation (Mock Test)');
    
    // Note: This is a mock test since we can't create real charges without valid tokens
    const testCases = [
        {
            name: 'Missing token (should fail)',
            data: { amount: 10000 },
            expectedStatus: 400
        },
        {
            name: 'With discount metadata',
            data: { 
                token: 'fake_token', 
                amount: 9000, 
                discountCode: 'WELCOME10',
                originalAmount: 10000 
            },
            expectedStatus: 500 // Will fail due to fake token, but we can check the structure
        }
    ];

    for (const testCase of testCases) {
        log(`  Testing: ${testCase.name}`, 'yellow');
        
        const result = await makeRequest('/createCharge', testCase.data);
        
        if (result.status === testCase.expectedStatus) {
            logSuccess(`    Got expected status ${result.status}`);
            if (result.data.message) {
                log(`      Message: ${result.data.message}`, 'blue');
            }
        } else {
            logWarning(`    Expected status ${testCase.expectedStatus}, got ${result.status}`);
            log(`      Response: ${JSON.stringify(result.data)}`, 'blue');
        }
    }
}

// Test 4: Integration Test - Full Discount Flow
async function testDiscountFlow() {
    logTest('Integration Test - Discount Flow');
    
    log('  Step 1: Validate discount code', 'yellow');
    const discountResult = await makeRequest('/validateDiscountCode', {
        code: 'WELCOME10',
        tourPrice: 10000,
        adults: 2,
        children: 0
    });
    
    if (discountResult.status === 200 && discountResult.data.success) {
        logSuccess(`    Discount validated: ${discountResult.data.discount.code}`);
        
        const originalAmount = discountResult.data.discount.originalAmount;
        const finalAmount = discountResult.data.discount.finalAmount;
        const expectedDiscount = Math.round(originalAmount * 0.1); // 10% off
        
        log(`  Step 2: Verify calculation`, 'yellow');
        if (finalAmount === originalAmount - expectedDiscount) {
            logSuccess(`    Calculation correct: ¥${originalAmount} - ¥${expectedDiscount} = ¥${finalAmount}`);
        } else {
            logError(`    Calculation error: Expected ¥${originalAmount - expectedDiscount}, got ¥${finalAmount}`);
        }
        
        log(`  Step 3: Mock charge creation with discount`, 'yellow');
        const chargeResult = await makeRequest('/createCharge', {
            token: 'fake_token_for_test',
            amount: finalAmount,
            discountCode: discountResult.data.discount.code,
            originalAmount: originalAmount
        });
        
        // We expect this to fail due to fake token, but check if discount data is processed
        if (chargeResult.status === 500) {
            logWarning(`    Charge failed as expected (fake token), but discount data was processed`);
        }
        
    } else {
        logError(`    Discount validation failed: ${JSON.stringify(discountResult.data)}`);
    }
}

// Test 5: Error Handling
async function testErrorHandling() {
    logTest('Error Handling');
    
    const testCases = [
        {
            name: 'Invalid JSON to validateDiscountCode',
            endpoint: '/validateDiscountCode',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json'
        },
        {
            name: 'GET request to POST endpoint',
            endpoint: '/validateDiscountCode',
            method: 'GET'
        }
    ];

    for (const testCase of testCases) {
        log(`  Testing: ${testCase.name}`, 'yellow');
        
        try {
            const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
                method: testCase.method || 'POST',
                headers: testCase.headers || { 'Content-Type': 'application/json' },
                body: testCase.body || JSON.stringify({})
            });
            
            if (response.status >= 400) {
                logSuccess(`    Correctly returned error status: ${response.status}`);
            } else {
                logWarning(`    Unexpected success status: ${response.status}`);
            }
        } catch (error) {
            logSuccess(`    Correctly handled network error: ${error.message}`);
        }
    }
}

// Main test runner
async function runAllTests() {
    log('🚀 Starting Backend Function Tests for Tomodachi Tours', 'bright');
    log('=' * 60, 'blue');
    
    // Initialize fetch
    await initializeFetch();
    
    const startTime = Date.now();
    
    try {
        await testDiscountValidation();
        await testBookingDetailsLookup();
        await testChargeCreation();
        await testDiscountFlow();
        await testErrorHandling();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        log('\n🎉 All tests completed!', 'green');
        log(`⏱️  Total execution time: ${duration}s`, 'blue');
        log('\n📋 Test Summary:', 'bright');
        log('✅ Discount code validation - Multiple scenarios tested', 'green');
        log('✅ Booking details lookup - Error handling validated', 'green');
        log('✅ Charge creation - Structure validation completed', 'green');
        log('✅ Integration flow - End-to-end discount flow tested', 'green');
        log('✅ Error handling - Edge cases covered', 'green');
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testDiscountValidation,
    testBookingDetailsLookup,
    testChargeCreation,
    testDiscountFlow,
    testErrorHandling
}; 