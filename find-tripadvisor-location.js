#!/usr/bin/env node

/**
 * Find TripAdvisor Location ID
 * Search for the business to verify the location ID and API functionality
 */

const https = require('https');

const API_KEY = '712CBC2D1532411593E1994319E44739';
const API_URL = 'https://api.content.tripadvisor.com/api/v1';

/**
 * Make API request
 */
function makeRequest(endpoint, options = {}) {
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
                'User-Agent': 'TomodachiTours/1.0',
                ...options.headers
            }
        };

        console.log(`🔍 Testing: ${url.href}`);

        const req = https.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode}`);

                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
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

/**
 * Search for Tomodachi Tours
 */
async function searchForBusiness() {
    console.log('🔍 Searching for Tomodachi Tours...\n');

    const searchTerms = [
        'Tomodachi Tours',
        'Tomodachi',
        'Tours Kyoto',
        'Kyoto Tours'
    ];

    for (const term of searchTerms) {
        console.log(`\n🔍 Searching for: "${term}"`);

        try {
            const response = await makeRequest(`/location/search?searchQuery=${encodeURIComponent(term)}&category=attractions&language=en`);

            if (response.statusCode === 200 && response.data.data) {
                console.log(`✅ Found ${response.data.data.length} results:`);

                response.data.data.forEach((location, index) => {
                    console.log(`\n${index + 1}. ${location.name}`);
                    console.log(`   Location ID: ${location.location_id}`);
                    console.log(`   Address: ${location.address_obj?.address_string || 'N/A'}`);
                    console.log(`   Rating: ${location.rating || 'N/A'}`);
                    console.log(`   Reviews: ${location.num_reviews || 'N/A'}`);
                });
            } else {
                console.log(`❌ Search failed: ${response.statusCode}`);
                console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Test different location IDs that might be related
 */
async function testLocationIds() {
    console.log('\n🔍 Testing potential location IDs...\n');

    const locationIds = [
        '27931661', // Current ID
        '298564',   // Kyoto city
        '294232',   // Kyoto Prefecture
        '28033450', // Potential business ID from URL patterns
    ];

    for (const locationId of locationIds) {
        console.log(`\n🔍 Testing Location ID: ${locationId}`);

        try {
            const response = await makeRequest(`/location/${locationId}/details`);

            if (response.statusCode === 200) {
                console.log(`✅ Found location:`);
                console.log(`   Name: ${response.data.name}`);
                console.log(`   Location ID: ${response.data.location_id}`);
                console.log(`   Rating: ${response.data.rating}`);
                console.log(`   Reviews: ${response.data.num_reviews}`);
                console.log(`   Category: ${response.data.category?.name}`);
                console.log(`   Address: ${response.data.address_obj?.address_string}`);
            } else {
                console.log(`❌ Failed: ${response.statusCode}`);
                if (response.data.message) {
                    console.log(`   Message: ${response.data.message}`);
                }
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Test API endpoints to see which ones work
 */
async function testEndpoints() {
    console.log('\n🔍 Testing API endpoints...\n');

    const endpoints = [
        '/location/search?searchQuery=kyoto&category=attractions',
        '/location/298564/details', // Kyoto city
        '/location/294232/details', // Kyoto Prefecture
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);

        try {
            const response = await makeRequest(endpoint);
            console.log(`📊 Status: ${response.statusCode}`);

            if (response.statusCode === 200) {
                console.log(`✅ Endpoint works!`);
                if (response.data.data) {
                    console.log(`   Results: ${response.data.data.length} items`);
                } else if (response.data.name) {
                    console.log(`   Location: ${response.data.name}`);
                }
            } else {
                console.log(`❌ Failed`);
                console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🔍 TripAdvisor Location Finder');
    console.log('='.repeat(50));
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
    console.log('='.repeat(50));

    // Test basic endpoints first
    await testEndpoints();

    // Search for the business
    await searchForBusiness();

    // Test specific location IDs
    await testLocationIds();

    console.log('\n🏁 Search Complete!');
}

if (require.main === module) {
    main().catch(console.error);
}