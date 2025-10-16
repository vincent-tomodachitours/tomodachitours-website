/**
 * Test script for Bokun booking cutoff integration
 * Demonstrates how the system fetches and caches cutoff times
 */

import { bokunProductSyncService } from './product-sync-service.js';

async function testCutoffSystem() {
    console.log('🧪 Testing Bokun Booking Cutoff System\n');
    console.log('=' .repeat(60));
    
    // Test 1: Get cutoff for a single tour
    console.log('\n📋 Test 1: Get cutoff for NIGHT_TOUR');
    console.log('-'.repeat(60));
    try {
        const cutoff = await bokunProductSyncService.getBookingCutoff('NIGHT_TOUR');
        console.log(`✅ NIGHT_TOUR cutoff: ${cutoff} hours`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 2: Get cutoffs for multiple tours
    console.log('\n📋 Test 2: Get cutoffs for multiple tours');
    console.log('-'.repeat(60));
    try {
        const cutoffs = await bokunProductSyncService.getBookingCutoffs([
            'NIGHT_TOUR',
            'MORNING_TOUR',
            'UJI_TOUR',
            'GION_TOUR'
        ]);
        console.log('✅ Cutoffs retrieved:');
        Object.entries(cutoffs).forEach(([tour, hours]) => {
            console.log(`   ${tour}: ${hours} hours`);
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 3: Force sync a specific product
    console.log('\n📋 Test 3: Force sync NIGHT_TOUR from Bokun');
    console.log('-'.repeat(60));
    try {
        await bokunProductSyncService.syncProductDetails('932404', 'NIGHT_TOUR');
        console.log('✅ Sync completed');
        
        // Get updated cutoff
        const updatedCutoff = await bokunProductSyncService.getBookingCutoff('NIGHT_TOUR');
        console.log(`   Updated cutoff: ${updatedCutoff} hours`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 4: Test fallback behavior
    console.log('\n📋 Test 4: Test fallback for non-existent tour');
    console.log('-'.repeat(60));
    try {
        const fallbackCutoff = await bokunProductSyncService.getBookingCutoff('FAKE_TOUR');
        console.log(`✅ Fallback cutoff: ${fallbackCutoff} hours (should be 24)`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Testing complete!\n');
}

// Run tests
testCutoffSystem().catch(console.error);
