/**
 * Simple script to set booking cutoff times for tours
 * Run from customer directory: node set-booking-cutoffs.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// Try service role key first (for admin operations), fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Set either SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log(`Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon'} key\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Configure cutoff times for each tour (in hours)
const CUTOFF_TIMES = {
    'NIGHT_TOUR': 24,
    'MORNING_TOUR': 24,
    'GION_TOUR': 24,
    'UJI_TOUR': 48,  // Uji tour needs more time for coordination
    'UJI_WALKING_TOUR': 48,
    'MUSIC_TOUR': 24,
    'MUSIC_PERFORMANCE': 24
};

async function setCutoffTimes() {
    console.log('🔧 Setting Booking Cutoff Times\n');
    console.log('='.repeat(60));

    try {
        // Get all active products
        const { data: products, error: fetchError } = await supabase
            .from('bokun_products')
            .select('*')
            .eq('is_active', true);

        if (fetchError) {
            console.error('❌ Error fetching products:', fetchError);
            return;
        }

        console.log(`\n📋 Found ${products.length} active product(s)\n`);

        // Update each product
        for (const product of products) {
            const cutoffHours = CUTOFF_TIMES[product.local_tour_type] || 24;

            const { data: updateData, error: updateError } = await supabase
                .from('bokun_products')
                .update({
                    booking_cutoff_hours: cutoffHours,
                    last_product_sync_at: new Date().toISOString()
                })
                .eq('id', product.id)
                .select();

            if (updateError) {
                console.error(`❌ Error updating ${product.local_tour_type}:`, updateError);
            } else if (!updateData || updateData.length === 0) {
                console.error(`⚠️  ${product.local_tour_type.padEnd(20)} → Update returned no data (possible RLS issue)`);
            } else {
                console.log(`✅ ${product.local_tour_type.padEnd(20)} → ${cutoffHours} hours (confirmed: ${updateData[0].booking_cutoff_hours})`);
            }
        }

        // Verify final state
        console.log('\n' + '='.repeat(60));
        console.log('📋 Final State:\n');

        const { data: updatedProducts } = await supabase
            .from('bokun_products')
            .select('local_tour_type, booking_cutoff_hours, last_product_sync_at')
            .eq('is_active', true)
            .order('local_tour_type');

        updatedProducts.forEach(p => {
            console.log(`   ${p.local_tour_type.padEnd(20)} ${p.booking_cutoff_hours} hours`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Cutoff times updated successfully!\n');

    } catch (error) {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    }
}

setCutoffTimes().then(() => process.exit(0));
