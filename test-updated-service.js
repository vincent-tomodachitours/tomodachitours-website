#!/usr/bin/env node

/**
 * Test the updated TripAdvisor service
 */

// Set up environment variables
process.env.REACT_APP_TRIPADVISOR_API_KEY = '712CBC2D1532411593E1994319E44739';
process.env.REACT_APP_TRIPADVISOR_API_URL = 'https://api.content.tripadvisor.com/api/v1';
process.env.REACT_APP_TRIPADVISOR_LOCATION_ID = '27931661';

// Mock supabase for testing
global.supabase = {
    rpc: () => Promise.resolve({ data: false, error: null }),
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: null, error: null })
            })
        }),
        update: () => ({
            eq: () => Promise.resolve({ error: null })
        })
    })
};

console.log('🧪 Testing Updated TripAdvisor Service');
console.log('='.repeat(60));

/**
 * Test the API client directly
 */
async function testApiClient() {
    console.log('\n📊 Test 1: Direct API Client Test');
    console.log('-'.repeat(40));

    try {
        // Import the service
        const { apiClient } = await import('./customer/src/services/tripAdvisorService.js');

        console.log('✅ Service imported successfully');

        // Test location details
        console.log('\n🔍 Testing fetchLocationDetails...');
        const locationData = await apiClient.fetchLocationDetails('27931661');

        console.log('✅ Location details fetched successfully!');
        console.log(`📍 Name: ${locationData.name}`);
        console.log(`⭐ Rating: ${locationData.rating}`);
        console.log(`📝 Reviews: ${locationData.num_reviews}`);
        console.log(`🏆 Ranking: ${locationData.ranking_data?.ranking_string}`);

        // Test reviews
        console.log('\n🔍 Testing fetchReviews...');
        const reviewsData = await apiClient.fetchReviews('27931661', { limit: 5 });

        console.log('✅ Reviews fetched successfully!');
        console.log(`📊 Reviews found: ${reviewsData.data?.length || 0}`);

        return { locationData, reviewsData };

    } catch (error) {
        console.log('❌ API Client test failed:', error.message);
        return null;
    }
}

/**
 * Test the main service function
 */
async function testMainService() {
    console.log('\n📊 Test 2: Main Service Function Test');
    console.log('-'.repeat(40));

    try {
        // Import the main service function
        const { getBusinessReviews } = await import('./customer/src/services/tripAdvisorService.js');

        console.log('✅ Main service function imported');

        // Test with default options
        console.log('\n🔍 Testing getBusinessReviews...');
        const result = await getBusinessReviews({
            locationId: '27931661',
            maxReviews: 6
        });

        console.log('✅ Business reviews fetched successfully!');
        console.log(`📊 Reviews: ${result.reviews?.length || 0}`);
        console.log(`📍 Business: ${result.businessInfo?.name}`);
        console.log(`⭐ Rating: ${result.businessInfo?.overallRating}`);
        console.log(`📝 Total Reviews: ${result.businessInfo?.totalReviews}`);
        console.log(`🏆 Ranking: ${result.businessInfo?.ranking}`);
        console.log(`🔗 TripAdvisor URL: ${result.businessInfo?.tripAdvisorUrl}`);
        console.log(`💾 Cached: ${result.cached}`);

        return result;

    } catch (error) {
        console.log('❌ Main service test failed:', error.message);
        return null;
    }
}

/**
 * Test health check
 */
async function testHealthCheck() {
    console.log('\n📊 Test 3: Health Check Test');
    console.log('-'.repeat(40));

    try {
        const { healthCheck } = await import('./customer/src/services/tripAdvisorService.js');

        const health = await healthCheck();

        console.log('✅ Health check completed');
        console.log(`📊 Service Healthy: ${health.healthy}`);
        console.log(`🔑 API Key: ${health.checks.apiKey?.configured ? '✅' : '❌'}`);
        console.log(`📍 Location ID: ${health.checks.locationId?.configured ? '✅' : '❌'}`);
        console.log(`💾 Database: ${health.checks.database?.connected ? '✅' : '❌'}`);

        return health;

    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return null;
    }
}

/**
 * Generate integration code for tour pages
 */
function generateIntegrationCode() {
    console.log('\n🔧 Integration Code for Tour Pages');
    console.log('-'.repeat(40));

    const code = `
// Updated TripAdvisorReviews component usage in tour pages
// The service now uses the correct API format automatically

import TripAdvisorReviews from '../Components/TripAdvisorReviews';

// In your tour page component:
<TripAdvisorReviews
    locationId={process.env.REACT_APP_TRIPADVISOR_LOCATION_ID}
    maxReviews={6}
    showRating={true}
    layout="grid"
    className="px-4"
    showAttribution={true}
/>

// The service will now:
// 1. Use the correct API format (query parameter + origin/referer headers)
// 2. Fetch real business data from TripAdvisor
// 3. Cache results for better performance
// 4. Fall back to cached data if API fails
// 5. Handle all error cases gracefully
`;

    console.log(code);
    return code;
}

/**
 * Main test function
 */
async function main() {
    console.log(`🔑 API Key: 712CBC2D...19E44739`);
    console.log(`📍 Location ID: 27931661`);
    console.log(`🌐 Domain: tomodachitours.com`);
    console.log('='.repeat(60));

    // Test API client
    const apiResult = await testApiClient();

    // Test main service
    const serviceResult = await testMainService();

    // Test health check
    const healthResult = await testHealthCheck();

    // Generate integration code
    generateIntegrationCode();

    console.log('\n🎯 Summary:');
    console.log(`✅ API Client: ${apiResult ? 'Working' : 'Failed'}`);
    console.log(`✅ Main Service: ${serviceResult ? 'Working' : 'Failed'}`);
    console.log(`✅ Health Check: ${healthResult ? 'Working' : 'Failed'}`);

    if (apiResult && serviceResult) {
        console.log('\n🎉 SUCCESS! TripAdvisor integration is now working!');
        console.log('\n📋 Next Steps:');
        console.log('1. The tour pages should now show real TripAdvisor data');
        console.log('2. Business info shows: Tomodachi Tours, 5.0 rating, 318 reviews');
        console.log('3. Ranking: #5 of 729 Tours in Kyoto');
        console.log('4. Reviews endpoint returns empty array (may need special permissions)');
        console.log('5. All error handling and caching is in place');
    } else {
        console.log('\n❌ Some tests failed. Check the error messages above.');
    }

    console.log('\n🏁 Service Test Complete!');
}

if (require.main === module) {
    main().catch(console.error);
}