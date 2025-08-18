/**
 * TripAdvisor API Testing - Multiple Methods
 * Run with: node test-api-methods.js
 */

const API_KEY = '712CBC2D1532411593E1994319E44739';
const LOCATION_ID = '27931661';
const BASE_URL = `https://api.content.tripadvisor.com/api/v1/location/${LOCATION_ID}/details?key=${API_KEY}&language=en&currency=USD`;

console.log('🧪 TripAdvisor API Testing - Multiple Methods');
console.log('='.repeat(60));
console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
console.log('📍 Location ID:', LOCATION_ID);
console.log('🌐 Base URL:', BASE_URL.replace(API_KEY, 'API_KEY_HIDDEN'));
console.log('');

// Method 1: Direct fetch (standard approach)
async function testMethod1() {
    console.log('📋 Method 1: Direct Fetch');
    console.log('-'.repeat(30));

    try {
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        console.log('🔍 Making direct request...');
        const response = await fetch(BASE_URL, options);

        console.log('📡 Response Status:', response.status, response.statusText);
        console.log('📋 Response Headers:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('📊 Key Data:');
        console.log('   Name:', data.name);
        console.log('   Reviews:', data.num_reviews);
        console.log('   Rating:', data.rating);
        console.log('   Ranking:', data.ranking_data?.ranking_string);

        return { success: true, data };

    } catch (error) {
        console.log('❌ FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Method 2: With different headers
async function testMethod2() {
    console.log('\n📋 Method 2: Different Headers');
    console.log('-'.repeat(30));

    try {
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Origin': 'https://tomodachitours.com',
                'Referer': 'https://tomodachitours.com/'
            }
        };

        console.log('🔍 Making request with browser-like headers...');
        const response = await fetch(BASE_URL, options);

        console.log('📡 Response Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('📊 Reviews:', data.num_reviews);

        return { success: true, data };

    } catch (error) {
        console.log('❌ FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Method 3: With timeout and retry
async function testMethod3() {
    console.log('\n📋 Method 3: With Timeout & Retry');
    console.log('-'.repeat(30));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            },
            signal: controller.signal
        };

        console.log('🔍 Making request with 10s timeout...');
        const response = await fetch(BASE_URL, options);

        clearTimeout(timeoutId);
        console.log('📡 Response Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('📊 Reviews:', data.num_reviews);

        return { success: true, data };

    } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting all tests...\n');

    const results = [];

    results.push(await testMethod1());
    results.push(await testMethod2());
    results.push(await testMethod3());

    console.log('\n📊 Test Summary');
    console.log('='.repeat(60));

    results.forEach((result, index) => {
        const method = `Method ${index + 1}`;
        if (result.success) {
            console.log(`✅ ${method}: SUCCESS - Got ${result.data.num_reviews} reviews`);
        } else {
            console.log(`❌ ${method}: FAILED - ${result.error}`);
        }
    });

    const successfulMethods = results.filter(r => r.success).length;
    console.log(`\n📈 Success Rate: ${successfulMethods}/${results.length} methods worked`);

    if (successfulMethods > 0) {
        console.log('\n🎉 At least one method works! We can implement this in the website.');
    } else {
        console.log('\n🚨 All methods failed. We need to investigate further.');
    }
}

// Run the tests
runAllTests().catch(console.error);
