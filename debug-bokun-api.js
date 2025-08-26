// Debug script to inspect Bokun API response structure
// This will help us understand why participant data isn't being parsed correctly

const SUPABASE_URL = 'https://nmjnrsfquvwugjjcogfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tam5yc2ZxdXZ3dWdqamNvZ2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDQzNzgsImV4cCI6MjA2NDYyMDM3OH0.W7T-jYMCfGMW2cK46d7XB-ZpJOBZ4XfJptZ-jgNKnXI';

async function inspectBokunApi() {
    try {
        const productId = '932404'; // Night tour
        const startDate = '2026-01-01';
        const endDate = '2026-12-31';

        const params = new URLSearchParams({
            productId,
            startDate,
            endDate
        });

        const response = await fetch(`${SUPABASE_URL}/functions/v1/bokun-proxy/bookings?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        console.log('=== FULL BOKUN API RESPONSE ===');
        console.log(JSON.stringify(data, null, 2));

        const bookings = data?.results || data;
        if (Array.isArray(bookings) && bookings.length > 0) {
            console.log('\n=== FIRST BOOKING STRUCTURE ===');
            const firstBooking = bookings[0];
            console.log(JSON.stringify(firstBooking, null, 2));

            console.log('\n=== PARTICIPANT DATA ANALYSIS ===');
            console.log('participants:', firstBooking.participants);
            console.log('fields.totalParticipants:', firstBooking.fields?.totalParticipants);
            console.log('fields:', firstBooking.fields);

            // Look for any field that might contain participant info
            console.log('\n=== ALL FIELDS CONTAINING "PARTICIPANT" OR SIMILAR ===');
            Object.keys(firstBooking).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('participant') || lowerKey.includes('adult') ||
                    lowerKey.includes('child') || lowerKey.includes('infant') ||
                    lowerKey.includes('pax') || lowerKey.includes('guest')) {
                    console.log(`${key}:`, firstBooking[key]);
                }
            });

            // Check nested objects too
            if (firstBooking.fields) {
                console.log('\n=== FIELDS OBJECT PARTICIPANT DATA ===');
                Object.keys(firstBooking.fields).forEach(key => {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('participant') || lowerKey.includes('adult') ||
                        lowerKey.includes('child') || lowerKey.includes('infant') ||
                        lowerKey.includes('pax') || lowerKey.includes('guest')) {
                        console.log(`fields.${key}:`, firstBooking.fields[key]);
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error inspecting Bokun API:', error);
    }
}

// Run the inspection
inspectBokunApi();