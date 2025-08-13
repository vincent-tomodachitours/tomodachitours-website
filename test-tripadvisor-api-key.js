#!/usr/bin/env node

/**
 * TripAdvisor API Key Test Script
 * Tests the API key and fetches reviews for the business location
 */

const https = require('https');

// Configuration from environment
const API_KEY = '712CBC2D1532411593E1994319E44739';
const API_URL = 'https://api.content.tripadvisor.com/api/v1';
const LOCATION_ID = '27931661';

/**
 * Make HTTP request to TripAdvisor API
 */
function makeApiRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}${endpoint}`;
        const requestOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-TripAdvisor-API-Key': API_KEY,
                'User-Agent': 'TomodachiTours/1.0',
                ...options.headers
            }
        };

        console.log(`🔍 Making request to: ${url}`);
        console.log(`🔑 Using API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);

        const req = https.request(url, requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`📊 Response Status: ${res.statusCode}`);
                console.log(`📋 Response Headers:`, res.headers);

                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    console.log(`📄 Raw Response:`, data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Request Error:`, error);
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Test API key validity
 */
async function testApiKey() {
    console.log('🧪 Testing TripAdvisor API Key...\n');

    try {
        // Test 1: Get location details
        console.log('📍 Test 1: Fetching location details...');
        const locationResponse = await makeApiRequest(`/location/${LOCATION_ID}/details`);

        if (locationResponse.statusCode === 200) {
            console.log('✅ Location details fetched successfully!');
            console.log('📋 Location Info:', {
                name: locationResponse.data.name,
                location_id: locationResponse.data.location_id,
                rating: locationResponse.data.rating,
                num_reviews: locationResponse.data.num_reviews,
                ranking: locationResponse.data.ranking
            });
        } else {
            console.log('❌ Failed to fetch location details');
            console.log('📄 Response:', locationResponse.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Get reviews
        console.log('📝 Test 2: Fetching reviews...');
        const reviewsResponse = await makeApiRequest(`/location/${LOCATION_ID}/reviews`);

        if (reviewsResponse.statusCode === 200) {
            console.log('✅ Reviews fetched successfully!');
            console.log('📊 Reviews Summary:', {
                total_reviews: reviewsResponse.data.data?.length || 0,
                reviews_available: reviewsResponse.data.data ? 'Yes' : 'No'
            });

            if (reviewsResponse.data.data && reviewsResponse.data.data.length > 0) {
                console.log('\n📝 Sample Reviews:');
                reviewsResponse.data.data.slice(0, 3).forEach((review, index) => {
                    console.log(`\n${index + 1}. ${review.title || 'No title'}`);
                    console.log(`   Rating: ${review.rating}/5`);
                    console.log(`   Author: ${review.user?.username || 'Anonymous'}`);
                    console.log(`   Date: ${review.published_date || 'Unknown'}`);
                    console.log(`   Text: ${(review.text || '').substring(0, 100)}...`);
                });
            }
        } else {
            console.log('❌ Failed to fetch reviews');
            console.log('📄 Response:', reviewsResponse.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Check API limits/status
        console.log('📊 Test 3: Checking API status...');
        const statusResponse = await makeApiRequest('/location/search', {
            headers: {
                'X-TripAdvisor-API-Key': API_KEY
            }
        });

        console.log(`📊 API Status Check: ${statusResponse.statusCode}`);
        if (statusResponse.statusCode === 401) {
            console.log('❌ API Key appears to be invalid or expired');
        } else if (statusResponse.statusCode === 429) {
            console.log('⚠️ API rate limit exceeded');
        } else if (statusResponse.statusCode >= 200 && statusResponse.statusCode < 300) {
            console.log('✅ API key appears to be working');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

/**
 * Test the service integration
 */
async function testServiceIntegration() {
    console.log('\n🔧 Testing Service Integration...\n');

    try {
        // Import the service (if available)
        const path = require('path');
        const servicePath = path.join(__dirname, 'customer', 'src', 'services', 'tripAdvisorService.js');

        console.log(`📁 Looking for service at: ${servicePath}`);

        // Check if service file exists
        const fs = require('fs');
        if (fs.existsSync(servicePath)) {
            console.log('✅ TripAdvisor service file found');

            // Try to read and analyze the service
            const serviceContent = fs.readFileSync(servicePath, 'utf8');

            // Check for key functions
            const hasFetchReviews = serviceContent.includes('getBusinessReviews');
            const hasApiKey = serviceContent.includes('TRIPADVISOR_API_KEY');
            const hasLocationId = serviceContent.includes('TRIPADVISOR_LOCATION_ID');

            console.log('📋 Service Analysis:');
            console.log(`   - Has getBusinessReviews function: ${hasFetchReviews ? '✅' : '❌'}`);
            console.log(`   - Uses API key: ${hasApiKey ? '✅' : '❌'}`);
            console.log(`   - Uses location ID: ${hasLocationId ? '✅' : '❌'}`);

        } else {
            console.log('❌ TripAdvisor service file not found');
        }

    } catch (error) {
        console.error('❌ Service integration test failed:', error.message);
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('🚀 TripAdvisor API Key Test Suite');
    console.log('='.repeat(50));
    console.log(`📍 Location ID: ${LOCATION_ID}`);
    console.log(`🔗 API URL: ${API_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
    console.log('='.repeat(50) + '\n');

    await testApiKey();
    await testServiceIntegration();

    console.log('\n🏁 Test Suite Complete!');
}

// Run the tests
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testApiKey, testServiceIntegration };