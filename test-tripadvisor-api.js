/**
 * Direct test of TripAdvisor API to debug the issue
 */

// Use the API key from environment or fallback for testing
const API_KEY = process.env.REACT_APP_TRIPADVISOR_API_KEY || '712CBC2D1532411593E1994319E44739';
const LOCATION_ID = '27931661';

async function testTripAdvisorAPI() {
    console.log('🧪 Testing TripAdvisor API Direct Call');
    console.log('='.repeat(50));
    console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
    console.log('📍 Location ID:', LOCATION_ID);

    try {
        // Use the exact working code pattern
        const url = `https://api.content.tripadvisor.com/api/v1/location/${LOCATION_ID}/details?key=${API_KEY}&language=en&currency=USD`;
        const options = { method: 'GET', headers: { accept: 'application/json' } };

        console.log('\n🔍 Making API call to:', url.replace(API_KEY, 'API_KEY_HIDDEN'));

        const data = await fetch(url, options)
            .then(res => {
                console.log('📡 Response Status:', res.status, res.statusText);
                if (!res.ok) {
                    throw new Error(`API responded with status: ${res.status}`);
                }
                return res.json();
            })
            .then(json => {
                console.log('📊 API Response received successfully');
                return json;
            });

        console.log('\n✅ API Call Successful!');
        console.log('📊 Raw API Response Keys:', Object.keys(data));
        console.log('\n📈 Business Data:');
        console.log('   Name:', data.name);
        console.log('   Location ID:', data.location_id);
        console.log('   Rating:', data.rating);
        console.log('   Number of Reviews:', data.num_reviews);
        console.log('   Ranking Data:', JSON.stringify(data.ranking_data, null, 2));
        console.log('   Web URL:', data.web_url);

        // Test what our processing function would do
        console.log('\n🔧 Processed Business Info:');
        const businessInfo = {
            locationId: data.location_id || LOCATION_ID,
            name: data.name || 'Tomodachi Tours',
            overallRating: parseFloat(data.rating) || 5.0,
            totalReviews: parseInt(data.num_reviews) || 17,
            ranking: data.ranking_data?.ranking_string || '#1 of 1,443 Tours & Activities in Kyoto',
            tripAdvisorUrl: data.web_url || 'https://www.tripadvisor.com/Attraction_Review-g298564-d27931661-Reviews-Tomodachi_Tours-Kyoto.html'
        };

        console.log('   Processed:', JSON.stringify(businessInfo, null, 2));

        return data;

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Run the test
testTripAdvisorAPI()
    .then(() => console.log('\n🎉 Test completed successfully!'))
    .catch(error => {
        console.error('\n💥 Test failed with error:', error.message);
        process.exit(1);
    });
