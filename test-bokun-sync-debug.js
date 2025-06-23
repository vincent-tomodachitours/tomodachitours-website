/**
 * Debug test script for Bokun sync with detailed error reporting
 */

const SUPABASE_URL = 'https://nmjnrsfquvwugjjcogfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tam5yc2ZxdXZ3dWdqamNvZ2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDQzNzgsImV4cCI6MjA2NDYyMDM3OH0.W7T-jYMCfGMW2cK46d7XB-ZpJOBZ4XfJptZ-jgNKnXI';

async function debugBokunSync() {
    try {
        console.log('🔧 Debug Bokun sync function...');

        // First, check the Bokun product mapping
        console.log('📋 Checking Bokun product mapping...');
        const productResponse = await fetch(`${SUPABASE_URL}/rest/v1/bokun_products?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (productResponse.ok) {
            const products = await productResponse.json();
            console.log('🎯 Bokun products:', products);
        } else {
            console.log('❌ Failed to fetch Bokun products:', await productResponse.text());
        }

        // Get the most recent booking
        const bookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!bookingsResponse.ok) {
            throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
        }

        const bookings = await bookingsResponse.json();

        if (!bookings || bookings.length === 0) {
            console.log('❌ No bookings found');
            return;
        }

        const latestBooking = bookings[0];
        console.log('📋 Latest booking:', {
            id: latestBooking.id,
            tour_type: latestBooking.tour_type,
            customer_name: latestBooking.customer_name,
            booking_date: latestBooking.booking_date,
            booking_time: latestBooking.booking_time,
            status: latestBooking.status,
            bokun_synced: latestBooking.bokun_synced
        });

        // Check if there's already a bokun_bookings record
        const bokunBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bokun_bookings?select=*&local_booking_id=eq.${latestBooking.id}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (bokunBookingsResponse.ok) {
            const existingBokunBookings = await bokunBookingsResponse.json();
            console.log('📋 Existing Bokun booking records:', existingBokunBookings);
        }

        // Test the sync function with detailed error capture
        console.log('🔄 Triggering Bokun sync...');

        const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-bokun-booking`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingId: latestBooking.id
            })
        });

        console.log('📊 Sync response status:', syncResponse.status);
        console.log('📊 Sync response headers:', Object.fromEntries(syncResponse.headers.entries()));

        const responseText = await syncResponse.text();
        console.log('📊 Raw sync response:', responseText);

        try {
            const syncResult = JSON.parse(responseText);
            console.log('📊 Parsed sync response:', syncResult);
        } catch (parseError) {
            console.log('❌ Failed to parse response as JSON:', parseError.message);
        }

        // Check the bokun_bookings table after sync attempt
        const afterSyncResponse = await fetch(`${SUPABASE_URL}/rest/v1/bokun_bookings?select=*&local_booking_id=eq.${latestBooking.id}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (afterSyncResponse.ok) {
            const afterSyncBookings = await afterSyncResponse.json();
            console.log('📋 Bokun bookings after sync attempt:', afterSyncBookings);
        }

    } catch (error) {
        console.error('❌ Error in debug test:', error);
    }
}

// Run the debug test
debugBokunSync(); 