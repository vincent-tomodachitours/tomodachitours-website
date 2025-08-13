#!/usr/bin/env node

/**
 * Test script to fetch bookings and verify API functionality
 */

require('dotenv').config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    process.exit(1);
}

async function testBookingsAPI() {
    try {
        console.log('🚀 Testing Bookings API...');
        console.log('📍 Supabase URL:', SUPABASE_URL);
        console.log('');

        // Test 1: Fetch recent bookings
        console.log('📋 Test 1: Fetching recent bookings...');
        const bookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc&limit=5`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!bookingsResponse.ok) {
            throw new Error(`Failed to fetch bookings: ${bookingsResponse.status} ${bookingsResponse.statusText}`);
        }

        const bookings = await bookingsResponse.json();
        console.log(`✅ Successfully fetched ${bookings.length} bookings`);

        if (bookings.length > 0) {
            console.log('📊 Sample booking data:');
            const sampleBooking = bookings[0];
            console.log({
                id: sampleBooking.id,
                tour_type: sampleBooking.tour_type,
                customer_name: sampleBooking.customer_name,
                booking_date: sampleBooking.booking_date,
                booking_time: sampleBooking.booking_time,
                status: sampleBooking.status,
                total_participants: sampleBooking.total_participants,
                created_at: sampleBooking.created_at
            });
        } else {
            console.log('ℹ️  No bookings found in the database');
        }

        console.log('');

        // Test 2: Fetch bookings with filters
        console.log('📋 Test 2: Fetching confirmed bookings...');
        const confirmedBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&status=eq.CONFIRMED&limit=3`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!confirmedBookingsResponse.ok) {
            throw new Error(`Failed to fetch confirmed bookings: ${confirmedBookingsResponse.status} ${confirmedBookingsResponse.statusText}`);
        }

        const confirmedBookings = await confirmedBookingsResponse.json();
        console.log(`✅ Successfully fetched ${confirmedBookings.length} confirmed bookings`);

        console.log('');

        // Test 3: Fetch today's bookings
        console.log('📋 Test 3: Fetching today\'s bookings...');
        const today = new Date().toISOString().split('T')[0];
        const todayBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&booking_date=eq.${today}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!todayBookingsResponse.ok) {
            throw new Error(`Failed to fetch today's bookings: ${todayBookingsResponse.status} ${todayBookingsResponse.statusText}`);
        }

        const todayBookings = await todayBookingsResponse.json();
        console.log(`✅ Successfully fetched ${todayBookings.length} bookings for today (${today})`);

        console.log('');

        // Test 4: Test Bokun bookings cache
        console.log('📋 Test 4: Fetching Bokun bookings cache...');
        const bokunBookingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bokun_bookings_cache?select=*&limit=3`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!bokunBookingsResponse.ok) {
            console.log(`⚠️  Bokun bookings cache not accessible: ${bokunBookingsResponse.status} ${bokunBookingsResponse.statusText}`);
        } else {
            const bokunBookings = await bokunBookingsResponse.json();
            console.log(`✅ Successfully fetched ${bokunBookings.length} Bokun bookings from cache`);
        }

        console.log('');

        // Test 5: Test employees table (for guide assignment)
        console.log('📋 Test 5: Fetching active employees...');
        const employeesResponse = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,first_name,last_name,role,status&status=eq.active&limit=3`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!employeesResponse.ok) {
            console.log(`⚠️  Employees table not accessible: ${employeesResponse.status} ${employeesResponse.statusText}`);
        } else {
            const employees = await employeesResponse.json();
            console.log(`✅ Successfully fetched ${employees.length} active employees`);

            if (employees.length > 0) {
                console.log('👥 Sample employee data:');
                employees.forEach(emp => {
                    console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.role})`);
                });
            }
        }

        console.log('');

        // Summary
        console.log('🎉 API Test Summary:');
        console.log('✅ Bookings API is working correctly');
        console.log('✅ Database connection is established');
        console.log('✅ Authentication is working');
        console.log(`📊 Total bookings in database: ${bookings.length > 0 ? 'Available' : 'Empty'}`);
        console.log(`📊 Confirmed bookings: ${confirmedBookings.length}`);
        console.log(`📊 Today's bookings: ${todayBookings.length}`);

        return true;

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        console.error('');
        console.error('🔍 Troubleshooting tips:');
        console.error('1. Check your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY');
        console.error('2. Verify your Supabase project is running');
        console.error('3. Check if the bookings table exists in your database');
        console.error('4. Verify RLS (Row Level Security) policies allow reading');

        return false;
    }
}

// Run the test
if (require.main === module) {
    testBookingsAPI()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testBookingsAPI };