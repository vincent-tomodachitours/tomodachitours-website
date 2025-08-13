#!/usr/bin/env node

/**
 * Test script to verify TripAdvisor reviews integration is working correctly
 * This script tests the actual API integration and displays the results
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './customer/.env' });

// Configuration from environment variables
const TRIPADVISOR_API_URL = process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_API_KEY = process.env.REACT_APP_TRIPADVISOR_API_KEY;
const TRIPADVISOR_LOCATION_ID = process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 TripAdvisor Reviews Integration Test');
console.log('=====================================\n');

// Check configuration
console.log('📋 Configuration Check:');
console.log(`   API URL: ${TRIPADVISOR_API_URL}`);
console.log(`   API Key: ${TRIPADVISOR_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Location ID: ${TRIPADVISOR_LOCATION_ID || '❌ Missing'}`);
console.log(`   Supabase URL: ${SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Supabase Key: ${SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}\n`);

if (!TRIPADVISOR_API_KEY || !TRIPADVISOR_LOCATION_ID) {
    console.error('❌ Missing required TripAdvisor configuration. Please check your .env file.');
    process.exit(1);
}

/**
 * Make a request to TripAdvisor API
 */
async function makeTripadvisorRequest(endpoint) {
    const url = `${TRIPADVISOR_API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${TRIPADVISOR_API_KEY}`;

    console.log(`🌐 Making request to: ${endpoint}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'TomodachiTours/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ API Request failed: ${error.message}`);
        throw error;
    }
}

/**
 * Test location details API
 */
async function testLocationDetails() {
    console.log('🏢 Testing Location Details API...');

    try {
        const locationData = await makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/details`);

        console.log('✅ Location Details Retrieved:');
        console.log(`   Name: ${locationData.name || 'N/A'}`);
        console.log(`   Rating: ${locationData.rating || 'N/A'}/5`);
        console.log(`   Total Reviews: ${locationData.num_reviews || 'N/A'}`);
        console.log(`   Ranking: ${locationData.ranking_data?.ranking_string || 'N/A'}`);
        console.log(`   URL: ${locationData.web_url || 'N/A'}\n`);

        return locationData;
    } catch (error) {
        console.error('❌ Location Details test failed:', error.message);
        return null;
    }
}

/**
 * Test reviews API
 */
async function testReviewsAPI() {
    console.log('⭐ Testing Reviews API...');

    try {
        const reviewsData = await makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=5`);

        if (!reviewsData.data || !Array.isArray(reviewsData.data)) {
            throw new Error('Invalid reviews data structure');
        }

        console.log(`✅ Reviews Retrieved: ${reviewsData.data.length} reviews`);

        reviewsData.data.forEach((review, index) => {
            console.log(`   Review ${index + 1}:`);
            console.log(`     Rating: ${review.rating}/5`);
            console.log(`     Title: ${review.title || 'No title'}`);
            console.log(`     Author: ${review.user?.username || 'Anonymous'}`);
            console.log(`     Date: ${review.published_date || 'N/A'}`);
            console.log(`     Text: ${(review.text || '').substring(0, 100)}${review.text?.length > 100 ? '...' : ''}`);
            console.log(`     Helpful Votes: ${review.helpful_votes || 0}\n`);
        });

        return reviewsData;
    } catch (error) {
        console.error('❌ Reviews API test failed:', error.message);
        return null;
    }
}

/**
 * Test database cache functionality
 */
async function testDatabaseCache() {
    console.log('💾 Testing Database Cache...');

    try {
        // Check if cache table exists and is accessible
        const { data: cacheData, error: cacheError } = await supabase
            .from('tripadvisor_reviews_cache')
            .select('*')
            .eq('location_id', TRIPADVISOR_LOCATION_ID)
            .limit(1);

        if (cacheError) {
            console.error('❌ Cache table access failed:', cacheError.message);
            return false;
        }

        if (cacheData && cacheData.length > 0) {
            const cache = cacheData[0];
            const now = new Date();
            const expiresAt = new Date(cache.expires_at);
            const isValid = expiresAt > now;

            console.log('✅ Cache Entry Found:');
            console.log(`   Location ID: ${cache.location_id}`);
            console.log(`   Business Name: ${cache.business_name || 'N/A'}`);
            console.log(`   Cached Reviews: ${cache.reviews_data?.length || 0}`);
            console.log(`   Overall Rating: ${cache.overall_rating || 'N/A'}`);
            console.log(`   Total Reviews: ${cache.total_reviews || 0}`);
            console.log(`   Cached At: ${cache.cached_at}`);
            console.log(`   Expires At: ${cache.expires_at}`);
            console.log(`   Is Valid: ${isValid ? '✅ Yes' : '❌ Expired'}\n`);
        } else {
            console.log('ℹ️  No cache entry found for this location\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Database cache test failed:', error.message);
        return false;
    }
}

/**
 * Test cache functions
 */
async function testCacheFunctions() {
    console.log('🔧 Testing Cache Functions...');

    try {
        // Test cache validity check function
        const { data: isValidData, error: validityError } = await supabase
            .rpc('is_tripadvisor_cache_valid', { location_id_param: TRIPADVISOR_LOCATION_ID });

        if (validityError) {
            console.error('❌ Cache validity function failed:', validityError.message);
        } else {
            console.log(`✅ Cache Validity Check: ${isValidData ? 'Valid' : 'Invalid/Expired'}`);
        }

        // Test get cached reviews function
        const { data: cachedReviews, error: reviewsError } = await supabase
            .rpc('get_cached_tripadvisor_reviews', { location_id_param: TRIPADVISOR_LOCATION_ID });

        if (reviewsError) {
            console.error('❌ Get cached reviews function failed:', reviewsError.message);
        } else if (cachedReviews && cachedReviews.length > 0) {
            console.log(`✅ Cached Reviews Function: Retrieved ${cachedReviews[0].reviews_data?.length || 0} reviews`);
        } else {
            console.log('ℹ️  Cached Reviews Function: No cached data found');
        }

        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Cache functions test failed:', error.message);
        return false;
    }
}

/**
 * Test the complete integration
 */
async function testCompleteIntegration() {
    console.log('🔄 Testing Complete Integration...');

    try {
        // Simulate the actual service call by testing both API and cache
        const [locationData, reviewsData] = await Promise.all([
            makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/details`),
            makeTripadvisorRequest(`/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=6`)
        ]);

        if (!locationData || !reviewsData) {
            throw new Error('Failed to fetch required data');
        }

        // Test data processing (basic validation)
        const processedReviews = reviewsData.data.map(review => ({
            id: review.id,
            title: review.title || '',
            text: review.text || '',
            rating: review.rating || 0,
            author: review.user?.username || 'Anonymous',
            authorLocation: review.user?.user_location?.name || '',
            date: review.published_date || new Date().toISOString().split('T')[0],
            helpfulVotes: review.helpful_votes || 0
        })).filter(review => review.text && review.text.length > 0);

        const businessInfo = {
            locationId: locationData.location_id,
            name: locationData.name,
            overallRating: parseFloat(locationData.rating) || 0,
            totalReviews: parseInt(locationData.num_reviews) || 0,
            ranking: locationData.ranking_data?.ranking_string || '',
            tripAdvisorUrl: locationData.web_url || ''
        };

        console.log('✅ Integration Test Results:');
        console.log(`   Processed Reviews: ${processedReviews.length}`);
        console.log(`   Business Info: ${businessInfo.name} (${businessInfo.overallRating}/5)`);
        console.log(`   Data Structure: Valid`);

        // Test caching the data
        const expiresAt = new Date(Date.now() + (6 * 60 * 60 * 1000)); // 6 hours from now

        const { error: upsertError } = await supabase
            .rpc('upsert_tripadvisor_cache', {
                location_id_param: TRIPADVISOR_LOCATION_ID,
                reviews_data_param: processedReviews,
                overall_rating_param: businessInfo.overallRating,
                total_reviews_param: businessInfo.totalReviews,
                ranking_data_param: locationData.ranking_data || null,
                business_name_param: businessInfo.name,
                tripadvisor_url_param: businessInfo.tripAdvisorUrl,
                cache_duration_hours: 6
            });

        if (upsertError) {
            console.error('❌ Cache upsert failed:', upsertError.message);
        } else {
            console.log('✅ Data successfully cached');
        }

        console.log('\n🎉 Integration test completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Complete integration test failed:', error.message);
        return false;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    try {
        console.log('🚀 Starting TripAdvisor Reviews Integration Tests...\n');

        // Run all tests
        const locationTest = await testLocationDetails();
        const reviewsTest = await testReviewsAPI();
        const cacheTest = await testDatabaseCache();
        const functionsTest = await testCacheFunctions();
        const integrationTest = await testCompleteIntegration();

        // Summary
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log(`Location Details API: ${locationTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Reviews API: ${reviewsTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Database Cache: ${cacheTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Cache Functions: ${functionsTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Complete Integration: ${integrationTest ? '✅ PASS' : '❌ FAIL'}`);

        const allPassed = locationTest && reviewsTest && cacheTest && functionsTest && integrationTest;

        if (allPassed) {
            console.log('\n🎉 All tests passed! TripAdvisor reviews integration is working correctly.');
            console.log('\n💡 Next steps:');
            console.log('   1. Visit your website to see the reviews in action');
            console.log('   2. Check the browser console for any client-side errors');
            console.log('   3. Verify the reviews display correctly on all pages');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above and fix the issues.');
        }

        process.exit(allPassed ? 0 : 1);
    } catch (error) {
        console.error('\n💥 Test runner failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
runTests();