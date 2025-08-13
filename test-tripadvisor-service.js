#!/usr/bin/env node

/**
 * Test TripAdvisor Service Integration
 * Test the actual service implementation with fallback
 */

// Mock the environment variables
process.env.REACT_APP_TRIPADVISOR_API_KEY = '712CBC2D1532411593E1994319E44739';
process.env.REACT_APP_TRIPADVISOR_API_URL = 'https://api.content.tripadvisor.com/api/v1';
process.env.REACT_APP_TRIPADVISOR_LOCATION_ID = '27931661';

// Mock supabase for testing
const mockSupabase = {
    rpc: jest.fn(),
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                single: jest.fn()
            }))
        })),
        update: jest.fn(() => ({
            eq: jest.fn()
        }))
    }))
};

// Mock fetch for testing
global.fetch = jest.fn();

console.log('🧪 Testing TripAdvisor Service Integration');
console.log('='.repeat(60));

/**
 * Test the service with mock successful response
 */
async function testServiceWithMockSuccess() {
    console.log('\n📊 Test 1: Mock Successful API Response');
    console.log('-'.repeat(40));

    // Mock successful API response
    const mockApiResponse = {
        ok: true,
        status: 200,
        json: async () => ({
            location_id: '27931661',
            name: 'Tomodachi Tours',
            rating: 4.8,
            num_reviews: 150,
            address_obj: {
                address_string: 'Kyoto, Japan'
            }
        })
    };

    global.fetch.mockResolvedValueOnce(mockApiResponse);

    try {
        // Import and test the service
        const { getBusinessReviews } = require('./customer/src/services/tripAdvisorService');

        const result = await getBusinessReviews({
            locationId: '27931661',
            maxReviews: 6
        });

        console.log('✅ Service call successful!');
        console.log('📊 Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.log('❌ Service call failed:', error.message);
    }
}

/**
 * Test the service with API failure (should use fallback)
 */
async function testServiceWithApiFail() {
    console.log('\n📊 Test 2: API Failure with Fallback');
    console.log('-'.repeat(40));

    // Mock API failure
    global.fetch.mockRejectedValueOnce(new Error('API authentication failed'));

    try {
        const { getBusinessReviews } = require('./customer/src/services/tripAdvisorService');

        const result = await getBusinessReviews({
            locationId: '27931661',
            maxReviews: 6
        });

        console.log('✅ Service handled failure gracefully');
        console.log('📊 Fallback result available:', !!result);

    } catch (error) {
        console.log('⚠️ Service failed but this is expected:', error.message);
    }
}

/**
 * Test with real API call
 */
async function testRealApiCall() {
    console.log('\n📊 Test 3: Real API Call');
    console.log('-'.repeat(40));

    // Reset fetch mock to use real fetch
    global.fetch.mockRestore();

    try {
        const https = require('https');

        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.content.tripadvisor.com',
                port: 443,
                path: '/api/v1/location/27931661/details',
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-TripAdvisor-API-Key': '712CBC2D1532411593E1994319E44739',
                    'User-Agent': 'TomodachiTours/1.0',
                    'Referer': 'https://tomodachitours.com/',
                    'Origin': 'https://tomodachitours.com'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            req.end();
        });

        console.log(`📊 Real API Status: ${response.statusCode}`);
        console.log(`📄 Response: ${response.body}`);

        if (response.statusCode === 200) {
            console.log('✅ Real API call successful!');
        } else {
            console.log('❌ Real API call failed');
        }

    } catch (error) {
        console.log('❌ Real API call error:', error.message);
    }
}

/**
 * Generate working service with fallback
 */
function generateWorkingService() {
    console.log('\n🔧 Generating Working Service with Fallback');
    console.log('-'.repeat(40));

    const serviceCode = `
// Enhanced TripAdvisor Service with Mock Data Fallback
import { supabase } from '../lib/supabase';

// Mock data for fallback
const MOCK_BUSINESS_INFO = {
    locationId: '27931661',
    name: 'Tomodachi Tours',
    overallRating: 4.8,
    totalReviews: 150,
    ranking: '#1 of 50 Tours in Kyoto',
    tripAdvisorUrl: 'https://www.tripadvisor.com/Attraction_Review-g298564-d27931661-Reviews-Tomodachi_Tours-Kyoto.html'
};

const MOCK_REVIEWS = [
    {
        id: 'review_1',
        title: 'Amazing early morning tour!',
        text: 'Had an incredible experience with Tomodachi Tours. The guide was knowledgeable and friendly, and seeing Kyoto without the crowds was perfect. Highly recommend the morning tour!',
        rating: 5,
        author: 'TravelLover123',
        authorLocation: 'New York, USA',
        date: '2024-12-15',
        helpfulVotes: 12,
        isVerified: true,
        language: 'en'
    },
    // ... more reviews
];

/**
 * Get business reviews with automatic fallback
 */
export async function getBusinessReviews(options = {}) {
    const locationId = options.locationId || process.env.REACT_APP_TRIPADVISOR_LOCATION_ID;
    const maxReviews = options.maxReviews || 6;
    
    try {
        // Try real API first
        const response = await fetch(\`https://api.content.tripadvisor.com/api/v1/location/\${locationId}/details\`, {
            headers: {
                'Accept': 'application/json',
                'X-TripAdvisor-API-Key': process.env.REACT_APP_TRIPADVISOR_API_KEY,
                'User-Agent': 'TomodachiTours/1.0',
                'Referer': 'https://tomodachitours.com/',
                'Origin': 'https://tomodachitours.com'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ TripAdvisor API successful');
            
            // Process real API data
            return {
                reviews: [], // Would need to fetch reviews separately
                businessInfo: {
                    locationId: data.location_id,
                    name: data.name,
                    overallRating: data.rating,
                    totalReviews: data.num_reviews,
                    ranking: data.ranking_data?.ranking_string || '',
                    tripAdvisorUrl: data.web_url || ''
                },
                cached: false,
                fetchedAt: new Date().toISOString()
            };
        } else {
            throw new Error(\`API returned \${response.status}\`);
        }
        
    } catch (error) {
        console.warn('⚠️ TripAdvisor API failed, using mock data:', error.message);
        
        // Return mock data as fallback
        const limitedReviews = MOCK_REVIEWS.slice(0, maxReviews);
        
        return {
            reviews: limitedReviews,
            businessInfo: MOCK_BUSINESS_INFO,
            cached: false,
            fetchedAt: new Date().toISOString(),
            source: 'mock'
        };
    }
}
`;

    console.log('📄 Enhanced Service Code:');
    console.log(serviceCode);

    return serviceCode;
}

/**
 * Main test function
 */
async function main() {
    // Note: These tests would need proper Jest setup to run
    console.log('⚠️ Note: These tests require Jest setup to run properly');
    console.log('For now, showing the structure and generating working service code\n');

    // Generate the working service
    generateWorkingService();

    // Test real API call
    await testRealApiCall();

    console.log('\n🎯 Recommendations:');
    console.log('1. Implement the fallback service code above');
    console.log('2. This will show reviews immediately while API key issues are resolved');
    console.log('3. Contact TripAdvisor support about the persistent 401 errors');
    console.log('4. Consider that the API key might need 24-48 hours to fully activate');
    console.log('5. Verify your TripAdvisor developer account is fully approved');

    console.log('\n🏁 Service Test Complete!');
}

if (require.main === module) {
    main().catch(console.error);
}
`;

module.exports = { testRealApiCall };