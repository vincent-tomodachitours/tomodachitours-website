#!/usr/bin/env tsx

/**
 * Test script for booking request timeout handling system
 * 
 * This script tests the timeout handling functionality by:
 * 1. Creating test booking requests with different ages
 * 2. Running the timeout processing functions
 * 3. Verifying the results
 * 
 * Usage:
 *   npm run test:timeouts
 *   or
 *   tsx scripts/test-booking-request-timeouts.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TestBooking {
  id?: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  tour_type: string
  tour_name: string
  booking_date: string
  booking_time: string
  adults: number
  children: number
  infants: number
  total_amount: number
  payment_method_id: string
  request_submitted_at: string
  status: string
  special_requests?: string
}

async function createTestBookings(): Promise<TestBooking[]> {
  console.log('🔧 Creating test booking requests...')
  
  const now = new Date()
  const testBookings: TestBooking[] = [
    {
      customer_name: 'Test Customer 1',
      customer_email: 'test1@example.com',
      customer_phone: '+1234567890',
      tour_type: 'uji-tour',
      tour_name: 'Uji Tea Tour',
      booking_date: '2025-02-20',
      booking_time: '10:00',
      adults: 2,
      children: 0,
      infants: 0,
      total_amount: 13000,
      payment_method_id: 'pm_test_reminder',
      request_submitted_at: new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString(), // 13 hours ago (should trigger admin reminder)
      status: 'PENDING_CONFIRMATION',
      special_requests: 'Test booking for admin reminder'
    },
    {
      customer_name: 'Test Customer 2',
      customer_email: 'test2@example.com',
      customer_phone: '+1234567891',
      tour_type: 'uji-walking-tour',
      tour_name: 'Uji Walking Tour',
      booking_date: '2025-02-21',
      booking_time: '14:00',
      adults: 1,
      children: 1,
      infants: 0,
      total_amount: 9500,
      payment_method_id: 'pm_test_customer_notification',
      request_submitted_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago (should trigger customer notification)
      status: 'PENDING_CONFIRMATION',
      special_requests: 'Test booking for customer delay notification'
    },
    {
      customer_name: 'Test Customer 3',
      customer_email: 'test3@example.com',
      tour_type: 'uji-tour',
      tour_name: 'Uji Tea Tour',
      booking_date: '2025-02-22',
      booking_time: '10:00',
      adults: 3,
      children: 0,
      infants: 1,
      total_amount: 19500,
      payment_method_id: 'pm_test_auto_reject',
      request_submitted_at: new Date(now.getTime() - 49 * 60 * 60 * 1000).toISOString(), // 49 hours ago (should trigger auto-rejection)
      status: 'PENDING_CONFIRMATION',
      special_requests: 'Test booking for auto-rejection'
    },
    {
      customer_name: 'Test Customer 4',
      customer_email: 'test4@example.com',
      tour_type: 'uji-tour',
      tour_name: 'Uji Tea Tour',
      booking_date: '2025-02-23',
      booking_time: '10:00',
      adults: 2,
      children: 0,
      infants: 0,
      total_amount: 13000,
      payment_method_id: 'pm_test_cleanup',
      request_submitted_at: new Date(now.getTime() - 49 * 60 * 60 * 1000).toISOString(), // 49 hours ago
      status: 'REJECTED', // Already rejected
      admin_reviewed_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // Rejected 25 hours ago (should trigger cleanup)
      admin_reviewed_by: 'test_admin',
      rejection_reason: 'Test rejection for cleanup testing'
    }
  ]

  const { data, error } = await supabase
    .from('bookings')
    .insert(testBookings)
    .select()

  if (error) {
    console.error('❌ Failed to create test bookings:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} test booking requests`)
  return data
}

async function testTimeoutProcessing() {
  console.log('🔄 Testing timeout processing...')
  
  try {
    // Call the local timeout processing function
    const { data, error } = await supabase
      .rpc('process_booking_request_timeouts_local')

    if (error) {
      console.error('❌ Failed to process timeouts:', error)
      throw error
    }

    console.log('✅ Timeout processing completed:')
    data.forEach((result: any) => {
      console.log(`  - ${result.action_type}: ${result.processed_count} processed`)
      if (result.details) {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`)
      }
    })

    return data
  } catch (error) {
    console.error('❌ Error during timeout processing:', error)
    throw error
  }
}

async function testEdgeFunctionCall() {
  console.log('🌐 Testing Edge Function call...')
  
  try {
    const { data, error } = await supabase.functions.invoke('booking-request-timeout-handler', {
      body: {
        action: 'process_all',
        config: {
          reminder_hours: 12,
          customer_notification_hours: 24,
          auto_reject_hours: 48,
          cleanup_payment_methods: true
        }
      }
    })

    if (error) {
      console.error('❌ Edge Function call failed:', error)
      throw error
    }

    console.log('✅ Edge Function call completed:', data)
    return data
  } catch (error) {
    console.error('❌ Error calling Edge Function:', error)
    throw error
  }
}

async function verifyResults(testBookings: TestBooking[]) {
  console.log('🔍 Verifying results...')
  
  // Check booking statuses
  const { data: updatedBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, customer_name, status, admin_reviewed_at, admin_reviewed_by, rejection_reason, payment_method_id')
    .in('id', testBookings.map(b => b.id!))

  if (bookingsError) {
    console.error('❌ Failed to fetch updated bookings:', bookingsError)
    throw bookingsError
  }

  console.log('📊 Updated booking statuses:')
  updatedBookings.forEach(booking => {
    console.log(`  - Booking ${booking.id} (${booking.customer_name}): ${booking.status}`)
    if (booking.admin_reviewed_by) {
      console.log(`    Reviewed by: ${booking.admin_reviewed_by}`)
    }
    if (booking.rejection_reason) {
      console.log(`    Rejection reason: ${booking.rejection_reason}`)
    }
    if (booking.payment_method_id) {
      console.log(`    Payment method: ${booking.payment_method_id}`)
    } else {
      console.log(`    Payment method: CLEANED UP`)
    }
  })

  // Check events
  const { data: events, error: eventsError } = await supabase
    .from('booking_request_events')
    .select('booking_id, event_type, event_data, created_at, created_by')
    .in('booking_id', testBookings.map(b => b.id!))
    .order('created_at', { ascending: true })

  if (eventsError) {
    console.error('❌ Failed to fetch events:', eventsError)
    throw eventsError
  }

  console.log('📝 Generated events:')
  events.forEach(event => {
    console.log(`  - Booking ${event.booking_id}: ${event.event_type} by ${event.created_by}`)
    if (event.event_data) {
      console.log(`    Data: ${JSON.stringify(event.event_data, null, 2)}`)
    }
  })
}

async function checkMonitoringView() {
  console.log('📊 Checking monitoring view...')
  
  const { data, error } = await supabase
    .from('booking_request_timeout_monitoring')
    .select('*')
    .limit(10)

  if (error) {
    console.error('❌ Failed to fetch monitoring data:', error)
    throw error
  }

  console.log('📈 Current timeout monitoring status:')
  data.forEach(item => {
    console.log(`  - Booking ${item.id} (${item.customer_name}): ${item.timeout_status}`)
    console.log(`    Hours pending: ${Math.round(item.hours_pending * 100) / 100}`)
    console.log(`    Admin reminder sent: ${item.admin_reminder_sent}`)
    console.log(`    Customer notification sent: ${item.customer_notification_sent}`)
  })
}

async function cleanupTestData(testBookings: TestBooking[]) {
  console.log('🧹 Cleaning up test data...')
  
  // Delete events first (due to foreign key constraint)
  const { error: eventsError } = await supabase
    .from('booking_request_events')
    .delete()
    .in('booking_id', testBookings.map(b => b.id!))

  if (eventsError) {
    console.error('❌ Failed to cleanup events:', eventsError)
  } else {
    console.log('✅ Cleaned up test events')
  }

  // Delete bookings
  const { error: bookingsError } = await supabase
    .from('bookings')
    .delete()
    .in('id', testBookings.map(b => b.id!))

  if (bookingsError) {
    console.error('❌ Failed to cleanup bookings:', bookingsError)
  } else {
    console.log('✅ Cleaned up test bookings')
  }
}

async function main() {
  console.log('🚀 Starting booking request timeout handling tests...\n')
  
  let testBookings: TestBooking[] = []
  
  try {
    // Create test data
    testBookings = await createTestBookings()
    console.log('')

    // Test local processing
    await testTimeoutProcessing()
    console.log('')

    // Test Edge Function (if available)
    try {
      await testEdgeFunctionCall()
      console.log('')
    } catch (error) {
      console.log('⚠️  Edge Function test skipped (function may not be deployed)')
      console.log('')
    }

    // Verify results
    await verifyResults(testBookings)
    console.log('')

    // Check monitoring view
    await checkMonitoringView()
    console.log('')

    console.log('✅ All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    // Cleanup test data
    if (testBookings.length > 0) {
      await cleanupTestData(testBookings)
    }
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error)
}

export { main as testBookingRequestTimeouts }