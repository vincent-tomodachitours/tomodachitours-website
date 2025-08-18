// Copy and paste this into the browser console at http://localhost:3000

console.log('🧪 Testing TripAdvisor API in Browser Console');
console.log('═'.repeat(50));

// Your exact working code
const url = 'https://api.content.tripadvisor.com/api/v1/location/27931661/details?key=712CBC2D1532411593E1994319E44739&language=en&currency=USD';
const options = { method: 'GET', headers: { accept: 'application/json' } };

console.log('🔍 Making API call with your exact working code...');

fetch(url, options)
    .then(res => {
        console.log('📡 Response Status:', res.status, res.statusText);
        return res.json();
    })
    .then(json => {
        console.log('✅ API Call Successful!');
        console.log('📊 Complete Response:', json);
        console.log('📈 Key Business Data:');
        console.log('   Name:', json.name);
        console.log('   Total Reviews:', json.num_reviews);
        console.log('   Rating:', json.rating);
        console.log('   Ranking:', json.ranking_data?.ranking_string);

        // Test if this would fix our component
        if (json.num_reviews && json.num_reviews > 17) {
            console.log('🎉 SUCCESS! API returns', json.num_reviews, 'reviews (more than our manual 17)');
            console.log('🔧 Our component should now show this data!');
        } else {
            console.log('⚠️ API returned', json.num_reviews, 'reviews');
        }
    })
    .catch(err => {
        console.error('❌ API Error:', err);
    });

// Also test our function directly
console.log('\n🔧 Testing our getRealBusinessInfoWithAPI function...');
import('./src/data/realTripAdvisorReviews.js')
    .then(module => {
        return module.getRealBusinessInfoWithAPI();
    })
    .then(result => {
        console.log('📊 Our function result:', result);
        console.log('📈 Total Reviews from our function:', result.totalReviews);
    })
    .catch(err => {
        console.error('❌ Our function error:', err);
    });
