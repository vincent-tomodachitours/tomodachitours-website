#!/usr/bin/env node

/**
 * Test TripAdvisor API using Official Documentation Format
 */

const https = require('https');

const API_KEY = '712CBC2D1532411593E1994319E44739';
const API_URL = 'https://api.content.tripadvisor.com/api/v1';
const LOCATION_ID = '27931661';

/**
 * Make request using official TripAdvisor format
 */
function makeOfficialRequest(endpoint, domain = 'https://tomodachitours.com') {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${endpoint}`);

        const requestOptions = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'origin': domain,
                'referer': domain,
                'Accept': 'application/json',
                'User-Agent': 'curl/7.68.0' // Using curl user agent like in docs
            }
        };

        console.log(`🔍 Testing Official Format:`);
        console.log(`   URL: ${url.href}`);
        console.log(`   Origin: ${domain}`);
        console.log(`   Referer: ${domain}`);
        console.log(`   Headers:`);
        Object.entries(requestOptions.headers).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
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

        req.end();
    });
}

/**
 * Test different variations of the official format
 */
async function testOfficialFormats() {
    console.log('🧪 Testing Official TripAdvisor API Format');
    console.log('='.repeat(70));
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
    console.log(`📍 Location ID: ${LOCATION_ID}`);
    console.log('='.repeat(70) + '\n');

    const testCases = [
        {
            name: '1. Official Format - tomodachitours.com',
            endpoint: `/location/${LOCATION_ID}/details?key=${API_KEY}`,
            domain: 'https://tomodachitours.com'
        },
        {
            name: '2. Official Format - www.tomodachitours.com',
            endpoint: `/location/${LOCATION_ID}/details?key=${API_KEY}`,
            domain: 'https://www.tomodachitours.com'
        },
        {
            name: '3. Test with Known Location (Kyoto)',
            endpoint: `/location/298564/details?key=${API_KEY}`,
            domain: 'https://tomodachitours.com'
        },
        {
            name: '4. Reviews Endpoint',
            endpoint: `/location/${LOCATION_ID}/reviews?key=${API_KEY}`,
            domain: 'https://tomodachitours.com'
        },
        {
            name: '5. Search Endpoint',
            endpoint: `/location/search?key=${API_KEY}&searchQuery=kyoto&category=attractions`,
            domain: 'https://tomodachitours.com'
        },
        {
            name: '6. Reviews with Parameters',
            endpoint: `/location/${LOCATION_ID}/reviews?key=${API_KEY}&language=en&limit=5`,
            domain: 'https://tomodachitours.com'
        }
    ];

    const results = [];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`🧪 ${testCase.name}`);
        console.log(`${'='.repeat(70)}`);

        try {
            const response = await makeOfficialRequest(testCase.endpoint, testCase.domain);

            results.push({
                name: testCase.name,
                success: response.success,
                statusCode: response.statusCode,
                hasData: !!response.data
            });

            if (response.success) {
                console.log(`\n✅ SUCCESS! This format works!`);

                if (response.data.name) {
                    console.log(`📍 Location: ${response.data.name}`);
                    console.log(`⭐ Rating: ${response.data.rating || 'N/A'}`);
                    console.log(`📝 Reviews: ${response.data.num_reviews || 'N/A'}`);
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    console.log(`📊 Found ${response.data.data.length} results`);
                    if (response.data.data.length > 0) {
                        console.log(`📍 First result: ${response.data.data[0].name || response.data.data[0].title || 'N/A'}`);
                    }
                }
            } else {
                console.log(`\n❌ Failed with status: ${response.statusCode}`);
            }

        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
            results.push({
                name: testCase.name,
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
 * Generate curl commands for manual testing
 */
function generateCurlCommands() {
    console.log('\n🔧 Curl Commands for Manual Testing');
    console.log('='.repeat(70));

    const commands = [
        {
            name: 'Location Details',
            command: `curl -v -H "origin: https://tomodachitours.com" -H "referer: https://tomodachitours.com" "${API_URL}/location/${LOCATION_ID}/details?key=${API_KEY}"`
        },
        {
            name: 'Reviews',
            command: `curl -v -H "origin: https://tomodachitours.com" -H "referer: https://tomodachitours.com" "${API_URL}/location/${LOCATION_ID}/reviews?key=${API_KEY}"`
        },
        {
            name: 'Search',
            command: `curl -v -H "origin: https://tomodachitours.com" -H "referer: https://tomodachitours.com" "${API_URL}/location/search?key=${API_KEY}&searchQuery=kyoto"`
        }
    ];

    commands.forEach(cmd => {
        console.log(`\n📋 ${cmd.name}:`);
        console.log(cmd.command);
    });
}

/**
 * Generate working JavaScript code
 */
function generateWorkingCode(workingFormat) {
    console.log('\n🔧 Working JavaScript Code');
    console.log('='.repeat(70));

    const code = `
// Working TripAdvisor API call format
async function fetchTripAdvisorData(locationId, endpoint = 'details') {
    const API_KEY = '${API_KEY}';
    const url = \`https://api.content.tripadvisor.com/api/v1/location/\${locationId}/\${endpoint}?key=\${API_KEY}\`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'origin': 'https://tomodachitours.com',
                'referer': 'https://tomodachitours.com',
                'Accept': 'application/json',
                'User-Agent': 'TomodachiTours/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('TripAdvisor API Error:', error);
        throw error;
    }
}

// Usage examples:
// const locationDetails = await fetchTripAdvisorData('${LOCATION_ID}', 'details');
// const reviews = await fetchTripAdvisorData('${LOCATION_ID}', 'reviews');
`;

    console.log(code);
    return code;
}

/**
 * Main test function
 */
async function main() {
    // Test all official formats
    const results = await testOfficialFormats();

    // Check if any worked
    const workingFormats = results.filter(r => r.success);

    console.log(`\n\n📊 FINAL RESULTS`);
    console.log('='.repeat(70));

    if (workingFormats.length > 0) {
        console.log(`🎉 SUCCESS! Found ${workingFormats.length} working format(s):`);
        workingFormats.forEach(format => {
            console.log(`   ✅ ${format.name} (${format.statusCode})`);
        });

        // Generate working code
        generateWorkingCode(workingFormats[0]);

    } else {
        console.log(`❌ No working formats found. All results:`);
        results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const code = result.statusCode || 'ERROR';
            console.log(`   ${status} ${result.name} (${code})`);
        });
    }

    // Always generate curl commands for manual testing
    generateCurlCommands();

    console.log(`\n🎯 Next Steps:`);
    if (workingFormats.length > 0) {
        console.log(`1. ✅ API key is working with official format!`);
        console.log(`2. Update your service to use the working format above`);
        console.log(`3. Test the integration in your application`);
    } else {
        console.log(`1. Try the curl commands above manually`);
        console.log(`2. Check if domain restriction update needs more time`);
        console.log(`3. Contact TripAdvisor support if curl commands also fail`);
        console.log(`4. Consider implementing mock data fallback temporarily`);
    }

    console.log('\n🏁 Official Format Test Complete!');
}

if (require.main === module) {
    main().catch(console.error);
}