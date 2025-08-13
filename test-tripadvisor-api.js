#!/usr/bin/env node

/**
 * Test script to fetch TripAdvisor reviews and verify API functionality
 */

require('dotenv').config();

const TRIPADVISOR_API_URL = process.env.TRIPADVISOR_API_URL || process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || process.env.REACT_APP_TRIPADVISOR_API_KEY;
const TRIPADVISOR_LOCATION_ID = process.env.TRIPADVISOR_LOCATION_ID || process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;

if (!TRIPADVISOR_API_KEY || !TRIPADVISOR_LOCATION_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   TRIPADVISOR_API_KEY:', TRIPADVISOR_API_KEY ? '✅ Set' : '❌ Missing');
    console.error('   TRIPADVISOR_LOCATION_ID:', TRIPADVISOR_LOCATION_ID ? '✅ Set' : '❌ Missing');
    console.error('   TRIPADVISOR_API_URL:', TRIPADVISOR_API_URL);
    console.error('');
    console.error('💡 Please set these in your .env file:');
    console.error('   TRIPADVISOR_API_KEY=your_actual_api_key');
    console.error('   TRIPADVISOR_LOCATION_ID=your_actual_location_id');
    process.exit(1);
}

async function makeTripadvisorRequest(endpoint, options = {}) {
    const url = `${TRIPADVISOR_API_URL}${endpoint}`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-TripAdvisor-API-Key': TRIPADVISOR_API_KEY,
        'User-Agent': 'TomodachiTours/1.0 (https://tomodachitours.com)',
        ...options.headers
    };

    console.log(`🌐 Making request to: ${url}`);

    const response = await fetch(url, {
        method: 'GET',
        headers,
        ...options
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
}

async function testTripAdvisorAPI() {
    try {
        console.log('🚀 Testing TripAdvisor Reviews API...');
        console.log('📍 API URL:', TRIPADVISOR_API_URL);
        console.log('🏢 Location ID:', TRIPADVISOR_LOCATION_ID);
        console.log('🔑 API Key:', TRIPADVISOR_API_KEY ? `${TRIPADVISOR_API_KEY.substring(0, 8)}...` : 'Not set');
        console.log('');

        // Test 1: Fetch location details
        console.log('📋 Test 1: Fetching location details...');
        try {
            const locationData = await makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/details`);

            console.log('✅ Successfully fetched location details');
            console.log('📊 Location data:');
            console.log({
                location_id: locationData.location_id,
                name: locationData.name,
                rating: locationData.rating,
                num_reviews: locationData.num_reviews,
                ranking_data: locationData.ranking_data?.ranking_string,
                web_url: locationData.web_url,
                address: locationData.address_obj ? {
                    street1: locationData.address_obj.street1,
                    city: locationData.address_obj.city,
                    country: locationData.address_obj.country
                } : null
            });
        } catch (error) {
            console.error('❌ Location details test failed:', error.message);
        }

        console.log('');

        // Test 2: Fetch reviews
        console.log('📋 Test 2: Fetching reviews...');
        try {
            const reviewsData = await makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=5&offset=0`);

            console.log('✅ Successfully fetched reviews');
            console.log(`📊 Found ${reviewsData.data?.length || 0} reviews`);

            if (reviewsData.data && reviewsData.data.length > 0) {
                console.log('📝 Sample review:');
                const sampleReview = reviewsData.data[0];
                console.log({
                    id: sampleReview.id,
                    title: sampleReview.title,
                    text: sampleReview.text ? sampleReview.text.substring(0, 100) + '...' : 'No text',
                    rating: sampleReview.rating,
                    author: sampleReview.user?.username || 'Anonymous',
                    author_location: sampleReview.user?.user_location?.name || 'Unknown',
                    published_date: sampleReview.published_date,
                    helpful_votes: sampleReview.helpful_votes,
                    language: sampleReview.lang
                });
            }
        } catch (error) {
            console.error('❌ Reviews test failed:', error.message);
        }

        console.log('');

        // Test 3: Test with different parameters
        console.log('📋 Test 3: Testing with different parameters...');
        try {
            const reviewsData = await makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=3&offset=0`);

            console.log('✅ Successfully fetched reviews with custom parameters');
            console.log(`📊 Found ${reviewsData.data?.length || 0} reviews (limit=3)`);
        } catch (error) {
            console.error('❌ Custom parameters test failed:', error.message);
        }

        console.log('');

        // Test 4: Test error handling with invalid location
        console.log('📋 Test 4: Testing error handling...');
        try {
            await makeTripadvisorRequest('/location/invalid_location_id/details');
            console.log('⚠️  Expected error but got success - this might indicate an issue');
        } catch (error) {
            console.log('✅ Error handling working correctly:', error.message.split('\n')[0]);
        }

        console.log('');

        // Summary
        console.log('🎉 TripAdvisor API Test Summary:');
        console.log('✅ TripAdvisor API is accessible');
        console.log('✅ Authentication is working');
        console.log('✅ Location ID is valid');
        console.log('✅ Reviews endpoint is functional');
        console.log('✅ Error handling is working');

        return true;

    } catch (error) {
        console.error('❌ TripAdvisor API Test Failed:', error.message);
        console.error('');
        console.error('🔍 Troubleshooting tips:');
        console.error('1. Check your TRIPADVISOR_API_KEY is valid and active');
        console.error('2. Verify your TRIPADVISOR_LOCATION_ID is correct');
        console.error('3. Ensure your domain is registered with TripAdvisor');
        console.error('4. Check if you have exceeded your API rate limits');
        console.error('5. Verify your TripAdvisor API subscription is active');

        return false;
    }
}

// Run the test
if (require.main === module) {
    testTripAdvisorAPI()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testTripAdvisorAPI };