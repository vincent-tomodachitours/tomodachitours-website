#!/usr/bin/env node

/**
 * Script to send missed booking confirmation emails
 * Run this after fixing your email service to catch up on missed notifications
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function sendMissedEmails() {
    try {
        console.log('🔍 Looking for recent bookings without email confirmations...');

        // Get recent confirmed bookings (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'CONFIRMED')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching bookings:', error);
            return;
        }

        if (!recentBookings || recentBookings.length === 0) {
            console.log('✅ No recent confirmed bookings found');
            return;
        }

        console.log(`📧 Found ${recentBookings.length} recent confirmed bookings`);

        // Check for failed email attempts
        const { data: emailFailures } = await supabase
            .from('email_failures')
            .select('booking_id')
            .in('booking_id', recentBookings.map(b => b.id));

        const failedBookingIds = new Set(emailFailures?.map(f => f.booking_id) || []);

        console.log('\n📋 Recent Bookings Status:');
        console.log('='.repeat(80));

        for (const booking of recentBookings) {
            const hasEmailFailure = failedBookingIds.has(booking.id);
            const status = hasEmailFailure ? '❌ EMAIL FAILED' : '✅ EMAIL SENT';

            console.log(`${status} | ID: ${booking.id} | ${booking.customer_name} (${booking.customer_email})`);
            console.log(`         | Tour: ${booking.tour_type} | Date: ${booking.booking_date} ${booking.booking_time}`);
            console.log(`         | Created: ${new Date(booking.created_at).toLocaleString()}`);
            console.log('-'.repeat(80));
        }

        // Show instructions for manual follow-up
        const failedBookings = recentBookings.filter(b => failedBookingIds.has(b.id));

        if (failedBookings.length > 0) {
            console.log('\n🚨 MANUAL ACTION REQUIRED:');
            console.log(`${failedBookings.length} bookings need email confirmations sent manually.`);
            console.log('\nOptions to fix:');
            console.log('1. Fix SendGrid account (add credits/upgrade plan)');
            console.log('2. Set up alternative email service (Resend, Mailgun, etc.)');
            console.log('3. Send emails manually to customers');

            console.log('\n📝 Customer emails to contact manually:');
            failedBookings.forEach(booking => {
                console.log(`- ${booking.customer_email} (Booking #${booking.id})`);
            });
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the script
sendMissedEmails();