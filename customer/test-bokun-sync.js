/**
 * Simple test script for Bokun product sync
 * Run from customer directory: node test-bokun-sync.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class SecureBokunAPI {
    constructor() {
        this.baseURL = `${supabaseUrl}/functions/v1/bokun-proxy`;
        this.anonKey = supabaseKey;
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.anonKey}`,
                'apikey': this.anonKey
            }
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};
    }

    async getProduct(productId) {
        return this.makeRequest(`/product/${productId}`, 'GET');
    }
}

async function testSync() {
    console.log('🧪 Testing Bokun Product Sync\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Check bokun_products table
        console.log('\n📋 Step 1: Checking bokun_products table...');
        const { data: products, error: productsError } = await supabase
            .from('bokun_products')
            .select('*')
            .eq('is_active', true);

        if (productsError) {
            console.error('❌ Error fetching products:', productsError);
            return;
        }

        if (!products || products.length === 0) {
            console.log('⚠️  No active products found in bokun_products table');
            console.log('   Make sure you have products configured');
            return;
        }

        console.log(`✅ Found ${products.length} active product(s):`);
        products.forEach(p => {
            console.log(`   - ${p.local_tour_type}: ${p.bokun_product_id}`);
            console.log(`     Current cutoff: ${p.booking_cutoff_hours || 'not set'} hours`);
            console.log(`     Last sync: ${p.last_product_sync_at || 'never'}`);
        });

        // Step 2: Test fetching product details from Bokun
        console.log('\n📋 Step 2: Testing Bokun API connection...');
        const api = new SecureBokunAPI();
        const testProduct = products[0];

        console.log(`   Fetching details for ${testProduct.local_tour_type} (${testProduct.bokun_product_id})...`);
        
        try {
            const productDetails = await api.getProduct(testProduct.bokun_product_id);
            console.log('✅ Successfully fetched product details from Bokun');
            console.log(`   Product title: ${productDetails.title || 'N/A'}`);
            
            // Show ALL top-level fields in the response
            console.log('\n   📋 Available fields in Bokun response:');
            console.log('   ' + Object.keys(productDetails).join(', '));
            
            // Show bookingSettings if available
            if (productDetails.bookingSettings) {
                console.log('\n   📋 Bokun bookingSettings found:');
                console.log('   ' + JSON.stringify(productDetails.bookingSettings, null, 2).split('\n').join('\n   '));
            } else {
                console.log('\n   ⚠️  No bookingSettings found in response');
            }
            
            // Check for any cutoff-related fields
            const cutoffFields = Object.keys(productDetails).filter(key => 
                key.toLowerCase().includes('cutoff') || 
                key.toLowerCase().includes('advance') ||
                key.toLowerCase().includes('booking')
            );
            if (cutoffFields.length > 0) {
                console.log('\n   🔍 Found cutoff-related fields:', cutoffFields);
                cutoffFields.forEach(field => {
                    console.log(`      ${field}: ${JSON.stringify(productDetails[field])}`);
                });
            }
            
            // Extract cutoff
            let cutoffHours = 24; // default
            if (productDetails.bookingSettings?.cutOffMinutes) {
                cutoffHours = Math.ceil(productDetails.bookingSettings.cutOffMinutes / 60);
                console.log(`\n   ✅ Found cutOffMinutes: ${productDetails.bookingSettings.cutOffMinutes} (${cutoffHours} hours)`);
            } else if (productDetails.bookingSettings?.advanceBookingMinimum) {
                cutoffHours = Math.ceil(productDetails.bookingSettings.advanceBookingMinimum / 60);
                console.log(`\n   ✅ Found advanceBookingMinimum: ${productDetails.bookingSettings.advanceBookingMinimum} (${cutoffHours} hours)`);
            } else if (productDetails.bookingSettings?.bookingCutoff) {
                cutoffHours = productDetails.bookingSettings.bookingCutoff;
                console.log(`\n   ✅ Found bookingCutoff: ${cutoffHours} hours`);
            } else if (productDetails.cutOffMinutes) {
                cutoffHours = Math.ceil(productDetails.cutOffMinutes / 60);
                console.log(`\n   ✅ Found top-level cutOffMinutes: ${productDetails.cutOffMinutes} (${cutoffHours} hours)`);
            } else {
                console.log(`\n   ⚠️  No cutoff found in Bokun, will use default: ${cutoffHours} hours`);
                console.log('   Available fields in bookingSettings:', Object.keys(productDetails.bookingSettings || {}));
            }

            // Step 3: Update database
            console.log('\n📋 Step 3: Updating database...');
            const { error: updateError } = await supabase
                .from('bokun_products')
                .update({
                    booking_cutoff_hours: cutoffHours,
                    last_product_sync_at: new Date().toISOString()
                })
                .eq('bokun_product_id', testProduct.bokun_product_id);

            if (updateError) {
                console.error('❌ Error updating database:', updateError);
            } else {
                console.log(`✅ Updated ${testProduct.local_tour_type} cutoff to ${cutoffHours} hours`);
            }

        } catch (apiError) {
            console.error('❌ Error fetching from Bokun API:', apiError.message);
            console.log('   This might be due to:');
            console.log('   - Invalid product ID');
            console.log('   - Bokun API credentials not configured');
            console.log('   - Network issues');
        }

        // Step 4: Verify final state
        console.log('\n📋 Step 4: Verifying final state...');
        const { data: updatedProducts } = await supabase
            .from('bokun_products')
            .select('local_tour_type, booking_cutoff_hours, last_product_sync_at')
            .eq('is_active', true);

        console.log('✅ Current state:');
        updatedProducts.forEach(p => {
            console.log(`   ${p.local_tour_type}: ${p.booking_cutoff_hours} hours (synced: ${p.last_product_sync_at || 'never'})`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Test complete!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
    }
}

// Run the test
testSync().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
