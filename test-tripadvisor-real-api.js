#!/usr/bin/env node

/**
 * Test TripAdvisor API with the correct headers format
 * Based on the working curl format provided
 */

require('dotenv').config({ path: './customer/.env' });

const TRIPADVISOR_API_URL = process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_API_KEY = process.env.REACT_APP_TRIPADVISOR_API_KEY;
const TRIPADVISOR_LOCATION_ID = process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;

console.log('🧪 Testing TripAdvisor API with Correct Headers');
console.log('===============================================\n');

console.log('📋 Configuration:');
console.log(`   API URL: ${TRIPADVISOR_API_URL}`);
console.log(`   API Key: ${TRIPADVISOR_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Location ID: ${TRIPADVISOR_LOCATION_ID || '❌ Missing'}\n`);

if (!TRIPADVISOR_API_KEY || !TRIPADVISOR_LOCATION_ID) {
    console.error('❌ Missing required configuration');
    process.exit(1);
}

/**
 * Make API request with correct headers (based on working curl format)
 */
async function makeApiRequest(endpoint) {
    const url = `${TRIPADVISOR_API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${TRIPADVISOR_API_KEY}`;

    console.log(`🌐 Making request to: ${endpoint}`);
    console.log(`   Full URL: ${url.replace(TRIPADVISOR_API_KEY, 'API_KEY_HIDDEN')}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'origin': 'https://tomodachitours.com',
                'referer': 'https://tomodachitours.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`   Response Status: ${response.status} ${response.statusText}`);
        console.log(`   Response Headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
            console.error(`   Error Body: ${errorText}`);
            return null;
        }

        const data = await response.json();
        console.log('✅ Request successful!');
        return data;
    } catch (error) {
        console.error(`❌ Request failed: ${error.message}`);
        return null;
    }
}

/**
 * Test location details endpoint
 */
async function testLocationDetails() {
    console.log('\n🏢 Testing Location Details...');
    console.log('================================');

    const locationData = await makeApiRequest(`/location/${TRIPADVISOR_LOCATION_ID}/details`);

    if (locationData) {
        console.log('\n📊 Location Details:');
        console.log(`   Name: ${locationData.name || 'N/A'}`);
        console.log(`   Rating: ${locationData.rating || 'N/A'}/5`);
        console.log(`   Total Reviews: ${locationData.num_reviews || 'N/A'}`);
        console.log(`   Ranking: ${locationData.ranking_data?.ranking_string || 'N/A'}`);
        console.log(`   URL: ${locationData.web_url || 'N/A'}`);
        console.log(`   Address: ${locationData.address_obj?.street1 || 'N/A'}, ${locationData.address_obj?.city || 'N/A'}`);

        return locationData;
    }

    return null;
}

/**
 * Test reviews endpoint
 */
async function testReviews() {
    console.log('\n⭐ Testing Reviews...');
    console.log('=====================');

    const reviewsData = await makeApiRequest(`/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=5`);

    if (reviewsData && reviewsData.data) {
        console.log(`\n📝 Reviews Retrieved: ${reviewsData.data.length}`);

        reviewsData.data.forEach((review, index) => {
            console.log(`\n   Review ${index + 1}:`);
            console.log(`     ID: ${review.id}`);
            console.log(`     Rating: ${review.rating}/5`);
            console.log(`     Title: ${review.title || 'No title'}`);
            console.log(`     Author: ${review.user?.username || 'Anonymous'}`);
            console.log(`     Location: ${review.user?.user_location?.name || 'N/A'}`);
            console.log(`     Date: ${review.published_date || 'N/A'}`);
            console.log(`     Helpful Votes: ${review.helpful_votes || 0}`);
            console.log(`     Language: ${review.lang || 'N/A'}`);
            console.log(`     Text: ${(review.text || '').substring(0, 150)}${review.text?.length > 150 ? '...' : ''}`);
        });

        return reviewsData;
    }

    return null;
}

/**
 * Test different endpoints to verify API access
 */
async function testMultipleEndpoints() {
    console.log('\n🔄 Testing Multiple Endpoints...');
    console.log('=================================');

    const endpoints = [
        `/location/${TRIPADVISOR_LOCATION_ID}/details`,
        `/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=3`,
        `/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=3&offset=3`
    ];

    const results = [];

    for (const endpoint of endpoints) {
        console.log(`\n🌐 Testing: ${endpoint}`);
        const result = await makeApiRequest(endpoint);
        results.push({ endpoint, success: !!result, data: result });

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

/**
 * Main test function
 */
async function runTests() {
    try {
        console.log('🚀 Starting API Tests...\n');

        // Test location details
        const locationResult = await testLocationDetails();

        // Test reviews
        const reviewsResult = await testReviews();

        // Test multiple endpoints
        const multipleResults = await testMultipleEndpoints();

        // Summary
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log(`Location Details: ${locationResult ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Reviews: ${reviewsResult ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Multiple Endpoints: ${multipleResults.every(r => r.success) ? '✅ SUCCESS' : '❌ SOME FAILED'}`);

        const allSuccess = locationResult && reviewsResult && multipleResults.every(r => r.success);

        if (allSuccess) {
            console.log('\n🎉 All tests passed! TripAdvisor API is working correctly.');
            console.log('\n💡 The API integration should now work on your website.');
            console.log('   You can now visit your website to see real TripAdvisor reviews!');
        } else {
            console.log('\n⚠️  Some tests failed. Check the errors above.');
            console.log('   The website will fall back to mock data until API issues are resolved.');
        }

        return allSuccess;
    } catch (error) {
        console.error('\n💥 Test runner failed:', error.message);
        return false;
    }
}

// Run the tests
if (require.main === module) {
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runTests };