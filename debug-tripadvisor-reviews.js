#!/usr/bin/env node

/**
 * Debug script to see exactly what the TripAdvisor reviews API returns
 */

require('dotenv').config({ path: './customer/.env' });

const TRIPADVISOR_API_URL = process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_API_KEY = process.env.REACT_APP_TRIPADVISOR_API_KEY;
const TRIPADVISOR_LOCATION_ID = process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;

console.log('🔍 Debugging TripAdvisor Reviews API Response');
console.log('==============================================\n');

async function debugReviewsAPI() {
    try {
        const url = `${TRIPADVISOR_API_URL}/location/${TRIPADVISOR_LOCATION_ID}/reviews?language=en&limit=10&key=${TRIPADVISOR_API_KEY}`;

        console.log('🌐 Making request to reviews endpoint...');
        console.log(`   URL: ${url.replace(TRIPADVISOR_API_KEY, 'API_KEY_HIDDEN')}`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'origin': 'https://tomodachitours.com',
                'referer': 'https://tomodachitours.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${errorText}`);
            return;
        }

        const data = await response.json();

        console.log('\n📊 Raw API Response:');
        console.log('====================');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n🔍 Analysis:');
        console.log('============');
        console.log(`   Response type: ${typeof data}`);
        console.log(`   Has data property: ${!!data.data}`);
        console.log(`   Data is array: ${Array.isArray(data.data)}`);
        console.log(`   Number of reviews: ${data.data ? data.data.length : 0}`);

        if (data.data && data.data.length > 0) {
            console.log('\n📝 Review Details:');
            data.data.forEach((review, index) => {
                console.log(`\n   Review ${index + 1}:`);
                console.log(`     ID: ${review.id || 'N/A'}`);
                console.log(`     Title: ${review.title || 'N/A'}`);
                console.log(`     Rating: ${review.rating || 'N/A'}`);
                console.log(`     Author: ${review.user?.username || 'N/A'}`);
                console.log(`     Date: ${review.published_date || 'N/A'}`);
                console.log(`     Language: ${review.lang || 'N/A'}`);
                console.log(`     Has text: ${!!review.text}`);
                console.log(`     Text length: ${review.text ? review.text.length : 0}`);
                console.log(`     Text preview: ${review.text ? review.text.substring(0, 100) + '...' : 'No text'}`);
                console.log(`     Helpful votes: ${review.helpful_votes || 0}`);
                console.log(`     Full review object keys: ${Object.keys(review).join(', ')}`);
            });
        } else {
            console.log('\n⚠️  No reviews found in response');
        }

        // Test different parameters
        console.log('\n🧪 Testing Different Parameters:');
        console.log('=================================');

        const testParams = [
            'language=en&limit=5',
            'language=en&limit=5&offset=0',
            'limit=5',
            'language=en&limit=20',
            'language=ja&limit=5'
        ];

        for (const params of testParams) {
            const testUrl = `${TRIPADVISOR_API_URL}/location/${TRIPADVISOR_LOCATION_ID}/reviews?${params}&key=${TRIPADVISOR_API_KEY}`;

            console.log(`\n🔍 Testing: ${params}`);

            try {
                const testResponse = await fetch(testUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'origin': 'https://tomodachitours.com',
                        'referer': 'https://tomodachitours.com',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (testResponse.ok) {
                    const testData = await testResponse.json();
                    console.log(`   ✅ Success: ${testData.data ? testData.data.length : 0} reviews`);

                    if (testData.data && testData.data.length > 0) {
                        const hasText = testData.data.filter(r => r.text && r.text.length > 0).length;
                        console.log(`   📝 Reviews with text: ${hasText}`);
                    }
                } else {
                    console.log(`   ❌ Failed: ${testResponse.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Run the debug
if (require.main === module) {
    debugReviewsAPI().catch(console.error);
}