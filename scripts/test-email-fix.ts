#!/usr/bin/env node

/**
 * Test script to verify the email fix for paid_amount showing as 0 yen
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY!
);

async function testEmailFix(): Promise<void> {
    try {
        console.log('🔍 Testing email fix for paid_amount issue...');

        // Get recent confirmed bookings to check their paid_amount values
        const { data: recentBookings, error } = await supabase
            .from('bookings')
            .select('id, customer_email, paid_amount, status, created_at, adults, children, tour_type, discount_amount')
            .eq('status', 'CONFIRMED')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Error fetching bookings:', error);
            return;
        }

        if (!recentBookings || recentBookings.length === 0) {
            console.log('✅ No recent confirmed bookings found');
            return;
        }

        console.log(`📧 Found ${recentBookings.length} recent confirmed bookings`);
        console.log('='.repeat(80));

        for (const booking of recentBookings) {
            const expectedAmount = 6500 * (booking.adults + (booking.children || 0));
            const discountedAmount = booking.discount_amount ? expectedAmount - booking.discount_amount : expectedAmount;

            const status = booking.paid_amount && booking.paid_amount > 0 ? '✅ VALID' : '❌ INVALID (0 yen)';

            console.log(`${status} | ID: ${booking.id} | Email: ${booking.customer_email}`);
            console.log(`         | Paid Amount: ¥${(booking.paid_amount || 0).toLocaleString()}`);
            console.log(`         | Expected: ¥${discountedAmount.toLocaleString()} (${booking.adults} adults + ${booking.children || 0} children)`);
            console.log(`         | Tour: ${booking.tour_type} | Created: ${new Date(booking.created_at).toLocaleString()}`);

            if (booking.discount_amount) {
                console.log(`         | Discount Applied: ¥${booking.discount_amount.toLocaleString()}`);
            }

            console.log('-'.repeat(80));
        }

        // Count problematic bookings
        const problematicBookings = recentBookings.filter(b => !b.paid_amount || b.paid_amount <= 0);

        if (problematicBookings.length > 0) {
            console.log(`\n🚨 FOUND ${problematicBookings.length} BOOKINGS WITH INVALID PAID_AMOUNT:`);
            console.log('These bookings would show "0 yen" in confirmation emails.');
            console.log('\nTo fix these manually, you can run:');

            for (const booking of problematicBookings) {
                const expectedAmount = 6500 * (booking.adults + (booking.children || 0));
                const discountedAmount = booking.discount_amount ? expectedAmount - booking.discount_amount : expectedAmount;

                console.log(`UPDATE bookings SET paid_amount = ${discountedAmount} WHERE id = ${booking.id}; -- ${booking.customer_email}`);
            }
        } else {
            console.log('\n✅ All recent bookings have valid paid_amount values!');
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the script
testEmailFix();