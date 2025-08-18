/**
 * Browser-based TripAdvisor API test
 * Copy and paste this into the browser console at http://localhost:3000
 */

// Test function to run in browser console
const testTripAdvisorInBrowser = async () => {
    console.log('🧪 Testing TripAdvisor API from Browser');
    console.log('=' .repeat(50));
    
    const API_KEY = '712CBC2D1532411593E1994319E44739';
    const LOCATION_ID = '27931661';
    
    try {
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'origin': window.location.origin,
                'referer': window.location.href
            }
        };

        const url = `https://api.content.tripadvisor.com/api/v1/location/${LOCATION_ID}/details?key=${API_KEY}&language=en&currency=USD`;
        
        console.log('🔍 Making API call from browser...');
        console.log('🌐 Origin:', window.location.origin);
        
        const response = await fetch(url, options);
        
        console.log('📡 Response Status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ API Error Response:', errorText);
            return { error: `API Error: ${response.status} - ${errorText}` };
        }
        
        const data = await response.json();
        
        console.log('✅ API Call Successful!');
        console.log('📊 Business Data:');
        console.log('   Name:', data.name);
        console.log('   Total Reviews:', data.num_reviews);
        console.log('   Rating:', data.rating);
        console.log('   Ranking:', data.ranking_data?.ranking_string);
        console.log('   Raw Data:', data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Browser Test Failed:', error);
        return { error: error.message };
    }
};

// Also test our existing function
const testOurFunction = async () => {
    console.log('\n🔧 Testing Our getRealBusinessInfoWithAPI Function');
    console.log('=' .repeat(50));
    
    try {
        // Import and test our function
        const { getRealBusinessInfoWithAPI } = await import('./src/data/realTripAdvisorReviews.js');
        const result = await getRealBusinessInfoWithAPI();
        
        console.log('📊 Our Function Result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Our Function Failed:', error);
        return { error: error.message };
    }
};

console.log('🚀 TripAdvisor API Browser Test Ready!');
console.log('📋 Run these commands in your browser console:');
console.log('');
console.log('1. Test direct API call:');
console.log('   testTripAdvisorInBrowser()');
console.log('');
console.log('2. Test our function:');
console.log('   testOurFunction()');
console.log('');

// Make functions available globally
window.testTripAdvisorInBrowser = testTripAdvisorInBrowser;
window.testOurFunction = testOurFunction;
