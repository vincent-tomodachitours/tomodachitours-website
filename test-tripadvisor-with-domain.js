#!/usr/bin/env node

/**
 * Test TripAdvisor API with correct domain headers
 */

const https = require('https');

const API_KEY = '712CBC2D1532411593E1994319E44739';
const API_URL = 'https://api.content.tripadvisor.com/api/v1';
const LOCATION_ID = '27931661';

function makeRequestWithDomain(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);

        const requestOptions = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-TripAdvisor-API-Key': API_KEY,
                'Referer': 'https://www.tomodachitours.com/',
                'Origin': 'https://www.tomodachitours.com',
                'User-Agent': 'Mozilla/5.0 (compatible; TomodachiTours/1.0)',
                'Host': 'api.content.tripadvisor.com'
            }
        };

        console.log(`🔍 Testing: ${url.href}`);
        console.log(`📋 Headers:`);
        Object.entries(requestOptions.headers).forEach(([key, value]) => {
            if (key === 'X-TripAdvisor-API-Key') {
                console.log(`   ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 8)}`);
            } else {
                console.log(`   ${key}: ${value}`);
            }
        });

        const req = https.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`\n📊 Response Status: ${res.statusCode}`);
                console.log(`📄 Response Body:`);

                try {
                    const jsonData = JSON.parse(data);
                    console.log(JSON.stringify(jsonData, null, 2));
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    console.log(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function testWithCorrectDomain() {
    console.log('🧪 Testing TripAdvisor API with Correct Domain Headers');
    console.log('='.repeat(60));
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
    console.log(`📍 Location ID: ${LOCATION_ID}`);
    console.log(`🌐 Registered Domain: www.tomodachitours.com`);
    console.log('='.repeat(60) + '\n');

    // Test 1: Location Details
    console.log('📍 Test 1: Location Details');
    console.log('-'.repeat(30));
    try {
        const response = await makeRequestWithDomain(`/location/${LOCATION_ID}/details`);
        if (response.statusCode === 200) {
            console.log('✅ SUCCESS! Location details retrieved.');
        } else {
            console.log(`❌ Failed with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Reviews
    console.log('📝 Test 2: Reviews');
    console.log('-'.repeat(30));
    try {
        const response = await makeRequestWithDomain(`/location/${LOCATION_ID}/reviews`);
        if (response.statusCode === 200) {
            console.log('✅ SUCCESS! Reviews retrieved.');
            if (response.data.data && response.data.data.length > 0) {
                console.log(`📊 Found ${response.data.data.length} reviews`);
            }
        } else {
            console.log(`❌ Failed with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Search
    console.log('🔍 Test 3: Search');
    console.log('-'.repeat(30));
    try {
        const response = await makeRequestWithDomain('/location/search?searchQuery=kyoto&category=attractions');
        if (response.statusCode === 200) {
            console.log('✅ SUCCESS! Search works.');
            if (response.data.data && response.data.data.length > 0) {
                console.log(`📊 Found ${response.data.data.length} search results`);
            }
        } else {
            console.log(`❌ Failed with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n🏁 Test Complete!');
}

if (require.main === module) {
    testWithCorrectDomain().catch(console.error);
}