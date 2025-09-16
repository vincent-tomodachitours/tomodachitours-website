#!/usr/bin/env node

/**
 * Test script for server-side conversion backup system
 * Usage: npx tsx scripts/test-server-side-conversions.ts [command] [options]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

interface TestConversion {
    conversion_action: string;
    conversion_value: number;
    currency: string;
    order_id: string;
    conversion_date_time: string;
}

interface TestBooking {
    id: string;
    status: string;
    total_amount: number;
    currency: string;
    customer_email: string;
    customer_phone: string;
    tour_id: string;
    booking_date: string;
    gclid: string;
    created_at: string;
}

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

class ConversionTestSuite {
    private functionUrl: string;

    constructor() {
        this.functionUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/google-ads-conversion`
    }

    async testBookingValidation(bookingId: string): Promise<boolean> {
        console.log(`\n🔍 Testing booking validation for: ${bookingId}`)

        try {
            const { data, error } = await supabase.functions.invoke('google-ads-conversion', {
                body: { booking_id: bookingId },
                method: 'POST',
            })

            if (error) {
                console.error('❌ Function invocation error:', error)
                return false
            }

            if (data.success) {
                console.log('✅ Booking validation successful')
                console.log('📊 Booking data:', JSON.stringify(data.booking_data, null, 2))
                console.log('🎯 Conversion data:', JSON.stringify(data.conversion_data, null, 2))
                return true
            } else {
                console.error('❌ Booking validation failed:', data.error)
                return false
            }
        } catch (error) {
            console.error('❌ Test error:', error.message)
            return false
        }
    }

    async testManualConversion(): Promise<boolean> {
        console.log('\n🔧 Testing manual conversion upload')

        const testConversion: TestConversion = {
            conversion_action: process.env.GOOGLE_ADS_PURCHASE_CONVERSION_ACTION || 'test-action',
            conversion_value: 5000,
            currency: 'JPY',
            order_id: `test-order-${Date.now()}`,
            conversion_date_time: new Date().toISOString(),
        }

        try {
            const response = await fetch(`${this.functionUrl}?action=manual_conversion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                },
                body: JSON.stringify(testConversion),
            })

            const result = await response.json()

            if (result.success) {
                console.log('✅ Manual conversion successful')
                console.log('📊 Conversion data:', JSON.stringify(testConversion, null, 2))
                return true
            } else {
                console.error('❌ Manual conversion failed:', result.error)
                return false
            }
        } catch (error) {
            console.error('❌ Manual conversion test error:', error.message)
            return false
        }
    }

    async testConversionReconciliation(days: number = 7): Promise<boolean> {
        console.log(`\n📈 Testing conversion reconciliation for last ${days} days`)

        const endDate = new Date().toISOString()
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        try {
            const response = await fetch(`${this.functionUrl}?action=reconcile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                }),
            })

            const result = await response.json()

            if (response.ok) {
                console.log('✅ Reconciliation successful')
                console.log('📊 Results:')
                console.log(`   Date range: ${result.date_range}`)
                console.log(`   Client-side conversions: ${result.client_side_conversions}`)
                console.log(`   Server-side conversions: ${result.server_side_conversions}`)
                console.log(`   Matched conversions: ${result.matched_conversions}`)
                console.log(`   Accuracy: ${result.accuracy_percentage}%`)

                if (result.discrepancies.length > 0) {
                    console.log('⚠️  Discrepancies found:')
                    result.discrepancies.forEach((disc, index) => {
                        console.log(`   ${index + 1}. Booking ${disc.booking_id}: ${disc.issue}`)
                    })
                } else {
                    console.log('✅ No discrepancies found')
                }
                return true
            } else {
                console.error('❌ Reconciliation failed:', result.error)
                return false
            }
        } catch (error) {
            console.error('❌ Reconciliation test error:', error.message)
            return false
        }
    }

    async createTestBooking(): Promise<string | null> {
        console.log('\n🏗️  Creating test booking for validation')

        const testBooking: TestBooking = {
            id: `test-booking-${Date.now()}`,
            status: 'confirmed',
            total_amount: 5000,
            currency: 'JPY',
            customer_email: 'test@example.com',
            customer_phone: '+81-90-1234-5678',
            tour_id: 'test-tour-1',
            booking_date: new Date().toISOString().split('T')[0],
            gclid: 'test-gclid-123',
            created_at: new Date().toISOString(),
        }

        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert(testBooking)
                .select()
                .single()

            if (error) {
                console.error('❌ Failed to create test booking:', error.message)
                return null
            }

            console.log('✅ Test booking created:', data.id)
            return data.id
        } catch (error) {
            console.error('❌ Test booking creation error:', error.message)
            return null
        }
    }

    async cleanupTestBookings(): Promise<boolean> {
        console.log('\n🧹 Cleaning up test bookings')

        try {
            const { data, error } = await supabase
                .from('bookings')
                .delete()
                .like('id', 'test-booking-%')

            if (error) {
                console.error('❌ Cleanup failed:', error.message)
                return false
            }

            console.log('✅ Test bookings cleaned up')
            return true
        } catch (error) {
            console.error('❌ Cleanup error:', error.message)
            return false
        }
    }

    async runFullTestSuite(): Promise<boolean> {
        console.log('🚀 Running full server-side conversion test suite\n')

        const results = {
            bookingValidation: false,
            manualConversion: false,
            reconciliation: false,
        }

        // Test 1: Create test booking and validate
        const testBookingId = await this.createTestBooking()
        if (testBookingId) {
            results.bookingValidation = await this.testBookingValidation(testBookingId)
        }

        // Test 2: Manual conversion
        results.manualConversion = await this.testManualConversion()

        // Test 3: Reconciliation
        results.reconciliation = await this.testConversionReconciliation()

        // Cleanup
        await this.cleanupTestBookings()

        // Summary
        console.log('\n📋 Test Results Summary:')
        console.log(`   Booking Validation: ${results.bookingValidation ? '✅' : '❌'}`)
        console.log(`   Manual Conversion: ${results.manualConversion ? '✅' : '❌'}`)
        console.log(`   Reconciliation: ${results.reconciliation ? '✅' : '❌'}`)

        const passedTests = Object.values(results).filter(Boolean).length
        const totalTests = Object.keys(results).length

        console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`)

        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Server-side conversion system is working correctly.')
        } else {
            console.log('⚠️  Some tests failed. Please check the configuration and logs.')
        }

        return passedTests === totalTests
    }
}

// CLI interface
async function main(): Promise<void> {
    const args = process.argv.slice(2)
    const command = args[0] || 'full'

    const testSuite = new ConversionTestSuite()

    switch (command) {
        case 'validate':
            const bookingId = args[1]
            if (!bookingId) {
                console.error('Usage: node test-server-side-conversions.js validate <booking_id>')
                process.exit(1)
            }
            await testSuite.testBookingValidation(bookingId)
            break

        case 'manual':
            await testSuite.testManualConversion()
            break

        case 'reconcile':
            const days = parseInt(args[1]) || 7
            await testSuite.testConversionReconciliation(days)
            break

        case 'cleanup':
            await testSuite.cleanupTestBookings()
            break

        case 'full':
        default:
            const success = await testSuite.runFullTestSuite()
            process.exit(success ? 0 : 1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Script error:', error.message)
        process.exit(1)
    })
}

export { ConversionTestSuite };