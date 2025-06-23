/**
 * Test script to manually trigger Bokun sync for the most recent booking
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration');
    process.exit(1);
}

async function testBokunSync() {
    try {
        console.log('🧪 Testing Bokun sync function...');

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

        // Test the sync function
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

        const syncResult = await syncResponse.json();

        console.log('📊 Sync response status:', syncResponse.status);
        console.log('📊 Sync response:', syncResult);

        if (syncResponse.ok && syncResult.success) {
            console.log('✅ Bokun sync completed successfully!');

            // Check the bokun_bookings table
            const bokunBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bokun_bookings?select=*&local_booking_id=eq.${latestBooking.id}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (bokunBookingsResponse.ok) {
                const bokunBookings = await bokunBookingsResponse.json();
                console.log('📋 Bokun bookings table:', bokunBookings);
            }
        } else {
            console.log('❌ Bokun sync failed:', syncResult);
        }

    } catch (error) {
        console.error('❌ Error testing Bokun sync:', error);
    }
}

// Run the test
testBokunSync(); 