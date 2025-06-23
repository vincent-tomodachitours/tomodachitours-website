/**
 * Test script for Bokun integration
 * Run this with: node test-bokun-integration.js
 */

require('dotenv').config();

// Mock React environment for Node.js testing
global.fetch = require('node-fetch');

// Import our services
const bokunAPI = require('./src/services/bokun/api-client.js').default;
const { checkAvailability, getAvailableTimeSlots } = require('./src/services/toursService.js');

async function testBokunIntegration() {
    console.log('🧪 Testing Bokun Integration...\n');

    // Test 1: Check API credentials
    console.log('1. Testing API Connection...');
    try {
        const connected = await bokunAPI.testConnection();
        if (connected) {
            console.log('✅ Bokun API connection successful!');
        } else {
            console.log('❌ Bokun API connection failed');
            return;
        }
    } catch (error) {
        console.log('❌ Bokun API connection error:', error.message);
        return;
    }

    // Test 2: Search activities
    console.log('\n2. Testing Activity Search...');
    try {
        const searchResults = await bokunAPI.searchActivities();
        console.log('✅ Activity search successful!');
        console.log('📦 Number of activities found:', searchResults.results?.length || 'N/A');

        if (searchResults.results && searchResults.results.length > 0) {
            console.log('🎯 Sample activities:');
            searchResults.results.slice(0, 3).forEach(activity => {
                console.log(`   - ${activity.title} (ID: ${activity.id})`);
            });
        }
    } catch (error) {
        console.log('❌ Activity search error:', error.message);
    }

    // Test 3: Get specific activity details for all tours
    console.log('\n3. Testing Activity Details...');
    const productIds = {
        'Night Tour': process.env.NIGHT_TOUR_PRODUCT_ID,
        'Morning Tour': process.env.MORNING_TOUR_PRODUCT_ID,
        'Uji Tour': process.env.UJI_TOUR_PRODUCT_ID,
        'Gion Tour': process.env.GION_TOUR_PRODUCT_ID
    };

    for (const [tourName, productId] of Object.entries(productIds)) {
        if (productId) {
            try {
                const activity = await bokunAPI.getActivityDetails(productId);
                console.log(`✅ ${tourName} details retrieved successfully!`);
                console.log(`   Title: ${activity.title || activity.id}`);
                console.log(`   Location: ${activity.meetingPoint?.name || 'N/A'}`);
                console.log(`   Duration: ${activity.duration || 'N/A'}`);
            } catch (error) {
                console.log(`❌ ${tourName} details error:`, error.message);
                console.log(`💡 Make sure ${tourName.toUpperCase().replace(' ', '_')}_PRODUCT_ID is set correctly in your .env file`);
            }
        } else {
            console.log(`⚠️  ${tourName.toUpperCase().replace(' ', '_')}_PRODUCT_ID not set in environment variables`);
        }
    }

    // Test 4: Test availability for a future date
    console.log('\n4. Testing Availability Check...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // 7 days from now
    const testDateString = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
        const availableSlots = await getAvailableTimeSlots('night-tour', testDateString);
        console.log('✅ Availability check successful!');
        console.log('🕐 Available time slots for', testDateString + ':', availableSlots.length);

        if (availableSlots.length > 0) {
            console.log('📅 Sample slots:');
            availableSlots.slice(0, 3).forEach(slot => {
                console.log(`   - ${slot.time}: ${slot.availableSpots} spots (source: ${slot.source})`);
            });
        }
    } catch (error) {
        console.log('❌ Availability check error:', error.message);
    }

    // Test 5: Test specific time slot availability
    console.log('\n5. Testing Specific Time Slot...');
    try {
        const isAvailable = await checkAvailability('night-tour', testDateString, '18:00', 2);
        console.log('✅ Specific slot check successful!');
        console.log(`🎫 Night tour at 18:00 on ${testDateString} for 2 people:`,
            isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE');
    } catch (error) {
        console.log('❌ Specific slot check error:', error.message);
    }

    console.log('\n🎉 Integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy the webhook function: supabase functions deploy bokun-webhook');
    console.log('   2. Configure webhooks in your Bokun dashboard');
    console.log('   3. Update your frontend to use the new availability functions');
}

// Handle both module.exports and ES6 exports
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    testBokunIntegration().catch(console.error);
} else {
    // Browser environment
    window.testBokunIntegration = testBokunIntegration;
} 