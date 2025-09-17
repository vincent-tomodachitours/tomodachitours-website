/**
 * Test script for begin_checkout event tracking
 * Run this in the browser console to test the begin_checkout event
 */

// Test function to trigger begin_checkout event
function testBeginCheckout() {
    console.log('🧪 Testing begin_checkout event...');

    // Test data
    const testCheckoutData = {
        value: 5000,
        currency: 'JPY',
        items: [{
            item_id: 'test-tour-123',
            item_name: 'Test Tour',
            item_category: 'tour',
            quantity: 1,
            price: 5000
        }],
        tour_id: 'test-tour-123',
        tour_name: 'Test Tour',
        booking_date: '2025-01-15',
        payment_provider: 'stripe'
    };

    const testTourData = {
        tourId: 'test-tour-123',
        tourName: 'Test Tour',
        tourCategory: 'cultural',
        tourLocation: 'Tokyo',
        tourDuration: '3 hours',
        bookingDate: '2025-01-15',
        paymentProvider: 'stripe',
        priceRange: '5000-10000'
    };

    console.log('📊 Test data:', { testCheckoutData, testTourData });

    // Method 1: Direct dataLayer push (most reliable)
    console.log('\n🔄 Method 1: Testing direct dataLayer push...');
    try {
        if (window.dataLayer) {
            const initialLength = window.dataLayer.length;

            window.dataLayer.push({
                event: 'begin_checkout',
                ecommerce: {
                    value: 5000,
                    currency: 'JPY',
                    items: [{
                        item_id: 'test-tour-123',
                        item_name: 'Test Tour',
                        item_category: 'tour',
                        quantity: 1,
                        price: 5000
                    }]
                },
                tour_id: 'test-tour-123',
                tour_name: 'Test Tour',
                checkout_step: 1,
                checkout_option: 'tour_booking',
                _test_event: 'begin_checkout'
            });

            const newLength = window.dataLayer.length;
            console.log('✅ DataLayer event pushed. Length changed from', initialLength, 'to', newLength);
            console.log('📊 Latest dataLayer event:', window.dataLayer[window.dataLayer.length - 1]);
        } else {
            console.warn('⚠️ DataLayer not available');
        }
    } catch (error) {
        console.error('❌ Method 1 failed:', error);
    }

    // Method 2: Test via bookingFlowManager (if available)
    console.log('\n🔄 Method 2: Testing via bookingFlowManager...');
    try {
        if (window.bookingFlowManager) {
            // Initialize booking
            const bookingId = window.bookingFlowManager.initializeBooking({
                tourId: 'test-tour-123',
                tourName: 'Test Tour',
                price: 5000,
                date: '2025-01-15',
                time: '10:00',
                location: 'Tokyo',
                category: 'tour'
            });
            console.log('✅ Booking initialized:', bookingId);

            // Track begin checkout
            const result = window.bookingFlowManager.trackBeginCheckout({
                customerData: {
                    email: 'test@example.com',
                    phone: '+81-90-1234-5678',
                    name: 'Test User',
                    firstName: 'Test',
                    lastName: 'User'
                }
            });
            console.log('📈 Begin checkout result:', result);

            // Check if tracked
            const isTracked = window.bookingFlowManager.isConversionTracked('begin_checkout');
            console.log('✅ Is begin_checkout tracked:', isTracked);
        } else {
            console.warn('⚠️ bookingFlowManager not available on window');
        }
    } catch (error) {
        console.error('❌ Method 2 failed:', error);
    }

    // Check dataLayer for recent events
    console.log('\n📊 Recent dataLayer events:');
    if (window.dataLayer && window.dataLayer.length > 0) {
        const recentEvents = window.dataLayer.slice(-5);
        recentEvents.forEach((event, index) => {
            console.log(`Event ${index + 1}:`, event);
        });
    }

    console.log('\n🏁 Test completed!');
    console.log('\n💡 If services are not available on window, you may need to expose them for testing.');
    console.log('💡 The direct dataLayer push (Method 1) should work regardless.');
}

// Make function available globally
window.testBeginCheckout = testBeginCheckout;

console.log('🧪 Begin checkout test script loaded!');
console.log('📝 Run testBeginCheckout() to test the begin_checkout event');