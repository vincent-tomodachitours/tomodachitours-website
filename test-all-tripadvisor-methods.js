#!/usr/bin/env node

/**
 * Test All TripAdvisor API Methods
 * Comprehensive test of different authentication and request methods
 */

const https = require('https');

const API_KEY = '712CBC2D1532411593E1994319E44739';
const API_URL = 'https://api.content.tripadvisor.com/api/v1';
const LOCATION_ID = '27931661';

/**
 * Make HTTP request with specific configuration
 */
function makeRequest(endpoint, config) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);

        const requestOptions = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: config.method || 'GET',
            headers: {
                'Accept': 'application/json',
                ...config.headers
            }
        };

        console.log(`🔍 Testing: ${url.href}`);
        console.log(`📋 Method: ${requestOptions.method}`);
        console.log(`📋 Headers:`);
        Object.entries(requestOptions.headers).forEach(([key, value]) => {
            if (key.toLowerCase().includes('key') || key.toLowerCase().includes('auth')) {
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
                console.log(`\n📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
                console.log(`📋 Response Headers:`);
                Object.entries(res.headers).forEach(([key, value]) => {
                    console.log(`   ${key}: ${value}`);
                });

                console.log(`\n📄 Response Body:`);
                try {
                    const jsonData = JSON.parse(data);
                    console.log(JSON.stringify(jsonData, null, 2));
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (error) {
                    console.log(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Request Error:`, error);
            reject(error);
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (config.body) {
            req.write(config.body);
        }

        req.end();
    });
}

/**
 * Test different authentication methods
 */
async function testAuthMethods() {
    console.log('🔑 Testing Different Authentication Methods');
    console.log('='.repeat(70) + '\n');

    const authMethods = [
        {
            name: '1. Standard X-TripAdvisor-API-Key Header',
            config: {
                headers: {
                    'X-TripAdvisor-API-Key': API_KEY,
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '2. X-TripAdvisor-API-Key with Domain Headers',
            config: {
                headers: {
                    'X-TripAdvisor-API-Key': API_KEY,
                    'User-Agent': 'TomodachiTours/1.0',
                    'Referer': 'https://tomodachitours.com/',
                    'Origin': 'https://tomodachitours.com'
                }
            }
        },
        {
            name: '3. Authorization Bearer Header',
            config: {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '4. Authorization API-Key Header',
            config: {
                headers: {
                    'Authorization': `API-Key ${API_KEY}`,
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '5. Query Parameter Method',
            endpoint: `/location/${LOCATION_ID}/details?key=${API_KEY}`,
            config: {
                headers: {
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '6. Query Parameter with api_key',
            endpoint: `/location/${LOCATION_ID}/details?api_key=${API_KEY}`,
            config: {
                headers: {
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '7. Custom Header Variations',
            config: {
                headers: {
                    'X-API-Key': API_KEY,
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '8. TripAdvisor-API-Key (without X-)',
            config: {
                headers: {
                    'TripAdvisor-API-Key': API_KEY,
                    'User-Agent': 'TomodachiTours/1.0'
                }
            }
        },
        {
            name: '9. POST Method with API Key in Body',
            config: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TomodachiTours/1.0'
                },
                body: JSON.stringify({
                    api_key: API_KEY,
                    location_id: LOCATION_ID
                })
            }
        },
        {
            name: '10. Standard with Different User-Agent',
            config: {
                headers: {
                    'X-TripAdvisor-API-Key': API_KEY,
                    'User-Agent': 'Mozilla/5.0 (compatible; TomodachiTours/1.0; +https://tomodachitours.com)'
                }
            }
        }
    ];

    const results = [];

    for (const method of authMethods) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`🧪 ${method.name}`);
        console.log(`${'='.repeat(70)}`);

        try {
            const endpoint = method.endpoint || `/location/${LOCATION_ID}/details`;
            const response = await makeRequest(endpoint, method.config);

            results.push({
                method: method.name,
                success: response.success,
                statusCode: response.statusCode,
                response: response.data
            });

            if (response.success) {
                console.log(`\n✅ SUCCESS! This method works!`);
                console.log(`📊 Status: ${response.statusCode}`);
                if (response.data && response.data.name) {
                    console.log(`📍 Location: ${response.data.name}`);
                    console.log(`⭐ Rating: ${response.data.rating || 'N/A'}`);
                    console.log(`📝 Reviews: ${response.data.num_reviews || 'N/A'}`);
                }
            } else {
                console.log(`\n❌ Failed with status: ${response.statusCode}`);
            }

        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
            results.push({
                method: method.name,
                success: false,
                error: error.message
            });
        }

        // Wait between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
}

/**
 * Test different endpoints with working auth method
 */
async function testEndpoints(workingAuthConfig) {
    console.log('\n🔍 Testing Different Endpoints with Working Auth');
    console.log('='.repeat(70) + '\n');

    const endpoints = [
        {
            name: 'Location Details',
            endpoint: `/location/${LOCATION_ID}/details`
        },
        {
            name: 'Location Reviews',
            endpoint: `/location/${LOCATION_ID}/reviews`
        },
        {
            name: 'Location Reviews with Params',
            endpoint: `/location/${LOCATION_ID}/reviews?language=en&limit=5`
        },
        {
            name: 'Location Search',
            endpoint: '/location/search?searchQuery=kyoto&category=attractions'
        },
        {
            name: 'Kyoto City Details',
            endpoint: '/location/298564/details'
        }
    ];

    const results = [];

    for (const endpoint of endpoints) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🧪 Testing: ${endpoint.name}`);
        console.log(`${'='.repeat(50)}`);

        try {
            const response = await makeRequest(endpoint.endpoint, workingAuthConfig);

            results.push({
                endpoint: endpoint.name,
                success: response.success,
                statusCode: response.statusCode,
                dataCount: response.data?.data?.length || (response.data?.name ? 1 : 0)
            });

            if (response.success) {
                console.log(`\n✅ SUCCESS!`);
                if (response.data?.data?.length) {
                    console.log(`📊 Found ${response.data.data.length} items`);
                } else if (response.data?.name) {
                    console.log(`📍 Location: ${response.data.name}`);
                }
            } else {
                console.log(`\n❌ Failed with status: ${response.statusCode}`);
            }

        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
            results.push({
                endpoint: endpoint.name,
                success: false,
                error: error.message
            });
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return results;
}

/**
 * Main test function
 */
async function main() {
    console.log('🚀 Comprehensive TripAdvisor API Test Suite');
    console.log('='.repeat(70));
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
    console.log(`📍 Location ID: ${LOCATION_ID}`);
    console.log(`🌐 Domain: tomodachitours.com (updated)`);
    console.log('='.repeat(70));

    // Test all authentication methods
    const authResults = await testAuthMethods();

    // Find working authentication method
    const workingAuth = authResults.find(result => result.success);

    if (workingAuth) {
        console.log(`\n\n🎉 FOUND WORKING AUTHENTICATION METHOD!`);
        console.log(`✅ Method: ${workingAuth.method}`);
        console.log(`📊 Status: ${workingAuth.statusCode}`);

        // Test different endpoints with the working method
        const workingConfig = authResults.find(r => r.success);
        // Note: We'd need to store the config, but for now let's use the standard one
        const standardConfig = {
            headers: {
                'X-TripAdvisor-API-Key': API_KEY,
                'User-Agent': 'TomodachiTours/1.0',
                'Referer': 'https://tomodachitours.com/',
                'Origin': 'https://tomodachitours.com'
            }
        };

        const endpointResults = await testEndpoints(standardConfig);

        console.log(`\n\n📊 FINAL RESULTS SUMMARY`);
        console.log('='.repeat(70));
        console.log(`✅ Working Authentication Methods:`);
        authResults.filter(r => r.success).forEach(result => {
            console.log(`   - ${result.method} (${result.statusCode})`);
        });

        console.log(`\n✅ Working Endpoints:`);
        endpointResults.filter(r => r.success).forEach(result => {
            console.log(`   - ${result.endpoint} (${result.statusCode})`);
        });

    } else {
        console.log(`\n\n❌ NO WORKING AUTHENTICATION METHOD FOUND`);
        console.log(`\n📊 All Results:`);
        authResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const code = result.statusCode || 'ERROR';
            console.log(`   ${status} ${result.method} (${code})`);
        });

        console.log(`\n🔍 Possible Issues:`);
        console.log(`   1. API key still needs time to activate`);
        console.log(`   2. Domain restriction not fully updated yet`);
        console.log(`   3. API key type mismatch`);
        console.log(`   4. TripAdvisor API endpoint changes`);
        console.log(`   5. Account verification required`);
    }

    console.log('\n🏁 Comprehensive Test Complete!');
}

if (require.main === module) {
    main().catch(console.error);
}