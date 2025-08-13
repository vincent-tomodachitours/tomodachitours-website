#!/usr/bin/env node

/**
 * Debug TripAdvisor API authentication and available endpoints
 */

require('dotenv').config({ path: './customer/.env' });

const TRIPADVISOR_API_URL = process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_API_KEY = process.env.REACT_APP_TRIPADVISOR_API_KEY;
const TRIPADVISOR_LOCATION_ID = process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;

console.log('🔍 Debugging TripAdvisor API Authentication & Endpoints');
console.log('======================================================\n');

async function makeRequest(endpoint, description) {
    const url = `${TRIPADVISOR_API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${TRIPADVISOR_API_KEY}`;

    console.log(`🌐 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'origin': 'https://tomodachitours.com',
                'referer': 'https://tomodachitours.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Success`);

            // Log relevant parts of the response
            if (data.data && Array.isArray(data.data)) {
                console.log(`   📊 Array data: ${data.data.length} items`);
                if (data.data.length > 0) {
                    console.log(`   🔍 First item keys: ${Object.keys(data.data[0]).join(', ')}`);
                }
            } else if (typeof data === 'object') {
                console.log(`   🔍 Object keys: ${Object.keys(data).join(', ')}`);

                // Check for specific fields that might indicate review access
                if (data.reviews_data || data.review_count || data.reviews) {
                    console.log(`   📝 Review-related fields found!`);
                }
            }

            return data;
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${errorText}`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function debugAPI() {
    console.log('📋 Configuration:');
    console.log(`   API URL: ${TRIPADVISOR_API_URL}`);
    console.log(`   Location ID: ${TRIPADVISOR_LOCATION_ID}`);
    console.log(`   API Key: ${TRIPADVISOR_API_KEY ? 'Configured' : 'Missing'}\n`);

    // Test various endpoints
    const endpoints = [
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/details`,
            description: 'Location Details'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/reviews`,
            description: 'Reviews (no params)'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en`,
            description: 'Reviews (English only)'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/reviews?limit=5`,
            description: 'Reviews (limit 5)'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=5&sort=recent`,
            description: 'Reviews (recent, English, limit 5)'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=5&sort=helpful`,
            description: 'Reviews (helpful, English, limit 5)'
        },
        {
            endpoint: `/location/${TRIPADVISOR_LOCATION_ID}`,
            description: 'Location (base endpoint)'
        }
    ];

    for (const { endpoint, description } of endpoints) {
        await makeRequest(endpoint, description);
        console.log(''); // Add spacing

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test if the API key has the right permissions
    console.log('🔐 Testing API Key Permissions:');
    console.log('===============================');

    // Try to access a different location to see if it's location-specific
    const testLocationId = '60763'; // Times Square (popular location)

    await makeRequest(`/location/${testLocationId}/details`, 'Test Location Details (Times Square)');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await makeRequest(`/location/${testLocationId}/reviews?language=en&limit=3`, 'Test Location Reviews (Times Square)');

    console.log('\n💡 Analysis:');
    console.log('============');
    console.log('If the test location also returns empty reviews, it suggests:');
    console.log('1. The API key tier may not include review text access');
    console.log('2. Review text access may require a higher tier subscription');
    console.log('3. There may be additional authentication or approval needed');
    console.log('\nIf the test location returns reviews but yours doesn\'t:');
    console.log('1. Your specific location may not have reviews available via API');
    console.log('2. There may be location-specific restrictions');
    console.log('3. The location ID might need verification');
}

// Run the debug
if (require.main === module) {
    debugAPI().catch(console.error);
}