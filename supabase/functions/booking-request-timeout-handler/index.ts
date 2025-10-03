import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  id: number
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

interface TimeoutConfig {
  reminder_hours: number
  customer_notification_hours: number
  auto_reject_hours: number
  cleanup_payment_methods: boolean
}

const DEFAULT_CONFIG: TimeoutConfig = {
  reminder_hours: 12, // Send admin reminder after 12 hours
  customer_notification_hours: 24, // Notify customer after 24 hours
  auto_reject_hours: 48, // Auto-reject after 48 hours
  cleanup_payment_methods: true
}

// SendGrid template IDs for timeout notifications
const SENDGRID_TEMPLATES = {
  ADMIN_REMINDER: 'd-timeout-admin-reminder', // To be created
  CUSTOMER_DELAY_NOTIFICATION: 'd-timeout-customer-delay', // To be created
  AUTO_REJECTION_CUSTOMER: 'd-timeout-auto-rejection', // To be created
  AUTO_REJECTION_ADMIN: 'd-timeout-auto-rejection-admin' // To be created
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, config } = await req.json()
    const timeoutConfig = { ...DEFAULT_CONFIG, ...config }

    console.log(`Processing timeout handler action: ${action}`)

    switch (action) {
      case 'send_admin_reminders':
        return await sendAdminReminders(supabaseClient, timeoutConfig)
      
      case 'send_customer_notifications':
        return await sendCustomerDelayNotifications(supabaseClient, timeoutConfig)
      
      case 'auto_reject_expired':
        return await autoRejectExpiredRequests(supabaseClient, timeoutConfig)
      
      case 'cleanup_payment_methods':
        return await cleanupExpiredPaymentMethods(supabaseClient, timeoutConfig)
      
      case 'process_all':
        return await processAllTimeouts(supabaseClient, timeoutConfig)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in booking-request-timeout-handler:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendAdminReminders(supabaseClient: any, config: TimeoutConfig) {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - config.reminder_hours)

  // Find requests that need admin reminders
  const { data: pendingRequests, error } = await supabaseClient
    .from('bookings')
    .select(`
      id, customer_name, customer_email, customer_phone,
      tour_type, tour_name, booking_date, booking_time,
      adults, children, infants, total_amount,
      payment_method_id, request_submitted_at, special_requests
    `)
    .eq('status', 'PENDING_CONFIRMATION')
    .lt('request_submitted_at', cutoffTime.toISOString())
    .is('admin_reviewed_at', null)

  if (error) {
    throw new Error(`Failed to fetch pending requests: ${error.message}`)
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return new Response(
      JSON.stringify({ 
        message: 'No pending requests requiring admin reminders',
        processed: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check which requests haven't had reminder emails sent
  const requestIds = pendingRequests.map(r => r.id)
  const { data: existingReminders } = await supabaseClient
    .from('booking_request_events')
    .select('booking_id')
    .in('booking_id', requestIds)
    .eq('event_type', 'timeout_reminder')

  const remindersSent = new Set(existingReminders?.map(r => r.booking_id) || [])
  const requestsNeedingReminders = pendingRequests.filter(r => !remindersSent.has(r.id))

  let processed = 0
  const results = []

  for (const request of requestsNeedingReminders) {
    try {
      await sendAdminReminderEmail(supabaseClient, request)
      
      // Log the reminder event
      await supabaseClient
        .from('booking_request_events')
        .insert({
          booking_id: request.id,
          event_type: 'timeout_reminder',
          event_data: {
            reminder_type: 'admin',
            hours_pending: config.reminder_hours,
            sent_at: new Date().toISOString()
          },
          created_by: 'system'
        })

      processed++
      results.push({ booking_id: request.id, status: 'sent' })
    } catch (error) {
      console.error(`Failed to send admin reminder for booking ${request.id}:`, error)
      results.push({ booking_id: request.id, status: 'failed', error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Processed ${processed} admin reminders`,
      processed,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendCustomerDelayNotifications(supabaseClient: any, config: TimeoutConfig) {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - config.customer_notification_hours)

  // Find requests that need customer delay notifications
  const { data: delayedRequests, error } = await supabaseClient
    .from('bookings')
    .select(`
      id, customer_name, customer_email, customer_phone,
      tour_type, tour_name, booking_date, booking_time,
      adults, children, infants, total_amount,
      payment_method_id, request_submitted_at, special_requests
    `)
    .eq('status', 'PENDING_CONFIRMATION')
    .lt('request_submitted_at', cutoffTime.toISOString())

  if (error) {
    throw new Error(`Failed to fetch delayed requests: ${error.message}`)
  }

  if (!delayedRequests || delayedRequests.length === 0) {
    return new Response(
      JSON.stringify({ 
        message: 'No delayed requests requiring customer notifications',
        processed: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check which requests haven't had delay notifications sent
  const requestIds = delayedRequests.map(r => r.id)
  const { data: existingNotifications } = await supabaseClient
    .from('booking_request_events')
    .select('booking_id')
    .in('booking_id', requestIds)
    .eq('event_type', 'customer_delay_notification')

  const notificationsSent = new Set(existingNotifications?.map(r => r.booking_id) || [])
  const requestsNeedingNotifications = delayedRequests.filter(r => !notificationsSent.has(r.id))

  let processed = 0
  const results = []

  for (const request of requestsNeedingNotifications) {
    try {
      await sendCustomerDelayEmail(supabaseClient, request, config.customer_notification_hours)
      
      // Log the notification event
      await supabaseClient
        .from('booking_request_events')
        .insert({
          booking_id: request.id,
          event_type: 'customer_delay_notification',
          event_data: {
            hours_pending: config.customer_notification_hours,
            sent_at: new Date().toISOString()
          },
          created_by: 'system'
        })

      processed++
      results.push({ booking_id: request.id, status: 'sent' })
    } catch (error) {
      console.error(`Failed to send customer delay notification for booking ${request.id}:`, error)
      results.push({ booking_id: request.id, status: 'failed', error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Processed ${processed} customer delay notifications`,
      processed,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function autoRejectExpiredRequests(supabaseClient: any, config: TimeoutConfig) {
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - config.auto_reject_hours)

  // Find requests that should be auto-rejected
  const { data: expiredRequests, error } = await supabaseClient
    .from('bookings')
    .select(`
      id, customer_name, customer_email, customer_phone,
      tour_type, tour_name, booking_date, booking_time,
      adults, children, infants, total_amount,
      payment_method_id, request_submitted_at, special_requests
    `)
    .eq('status', 'PENDING_CONFIRMATION')
    .lt('request_submitted_at', cutoffTime.toISOString())

  if (error) {
    throw new Error(`Failed to fetch expired requests: ${error.message}`)
  }

  if (!expiredRequests || expiredRequests.length === 0) {
    return new Response(
      JSON.stringify({ 
        message: 'No expired requests requiring auto-rejection',
        processed: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let processed = 0
  const results = []

  for (const request of expiredRequests) {
    try {
      // Update booking status to REJECTED
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({
          status: 'REJECTED',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: 'system_auto_reject',
          rejection_reason: `Automatically rejected after ${config.auto_reject_hours} hours without admin review`
        })
        .eq('id', request.id)

      if (updateError) {
        throw new Error(`Failed to update booking status: ${updateError.message}`)
      }

      // Send auto-rejection emails
      await sendAutoRejectionEmails(supabaseClient, request, config.auto_reject_hours)
      
      // Log the auto-rejection event
      await supabaseClient
        .from('booking_request_events')
        .insert({
          booking_id: request.id,
          event_type: 'auto_rejected',
          event_data: {
            hours_pending: config.auto_reject_hours,
            rejection_reason: `Automatically rejected after ${config.auto_reject_hours} hours without admin review`,
            auto_rejected_at: new Date().toISOString()
          },
          created_by: 'system'
        })

      processed++
      results.push({ booking_id: request.id, status: 'auto_rejected' })
    } catch (error) {
      console.error(`Failed to auto-reject booking ${request.id}:`, error)
      results.push({ booking_id: request.id, status: 'failed', error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Auto-rejected ${processed} expired requests`,
      processed,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function cleanupExpiredPaymentMethods(supabaseClient: any, config: TimeoutConfig) {
  if (!config.cleanup_payment_methods) {
    return new Response(
      JSON.stringify({ 
        message: 'Payment method cleanup is disabled',
        processed: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Find rejected bookings with payment methods that need cleanup
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - 24) // Cleanup payment methods 24 hours after rejection

  const { data: rejectedBookings, error } = await supabaseClient
    .from('bookings')
    .select('id, payment_method_id, admin_reviewed_at')
    .eq('status', 'REJECTED')
    .not('payment_method_id', 'is', null)
    .lt('admin_reviewed_at', cutoffTime.toISOString())

  if (error) {
    throw new Error(`Failed to fetch rejected bookings: ${error.message}`)
  }

  if (!rejectedBookings || rejectedBookings.length === 0) {
    return new Response(
      JSON.stringify({ 
        message: 'No payment methods requiring cleanup',
        processed: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let processed = 0
  const results = []

  for (const booking of rejectedBookings) {
    try {
      // Detach payment method from Stripe (this doesn't delete it, just detaches it from customer)
      // The actual cleanup would be done via Stripe API, but we'll just clear our reference
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ payment_method_id: null })
        .eq('id', booking.id)

      if (updateError) {
        throw new Error(`Failed to clear payment method reference: ${updateError.message}`)
      }

      // Log the cleanup event
      await supabaseClient
        .from('booking_request_events')
        .insert({
          booking_id: booking.id,
          event_type: 'payment_method_cleanup',
          event_data: {
            payment_method_id: booking.payment_method_id,
            cleaned_at: new Date().toISOString()
          },
          created_by: 'system'
        })

      processed++
      results.push({ booking_id: booking.id, status: 'cleaned' })
    } catch (error) {
      console.error(`Failed to cleanup payment method for booking ${booking.id}:`, error)
      results.push({ booking_id: booking.id, status: 'failed', error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Cleaned up ${processed} payment method references`,
      processed,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processAllTimeouts(supabaseClient: any, config: TimeoutConfig) {
  const results = {
    admin_reminders: 0,
    customer_notifications: 0,
    auto_rejections: 0,
    payment_cleanups: 0,
    errors: []
  }

  try {
    // Send admin reminders
    const adminResult = await sendAdminReminders(supabaseClient, config)
    const adminData = await adminResult.json()
    results.admin_reminders = adminData.processed || 0
  } catch (error) {
    results.errors.push(`Admin reminders failed: ${error.message}`)
  }

  try {
    // Send customer delay notifications
    const customerResult = await sendCustomerDelayNotifications(supabaseClient, config)
    const customerData = await customerResult.json()
    results.customer_notifications = customerData.processed || 0
  } catch (error) {
    results.errors.push(`Customer notifications failed: ${error.message}`)
  }

  try {
    // Auto-reject expired requests
    const rejectResult = await autoRejectExpiredRequests(supabaseClient, config)
    const rejectData = await rejectResult.json()
    results.auto_rejections = rejectData.processed || 0
  } catch (error) {
    results.errors.push(`Auto-rejections failed: ${error.message}`)
  }

  try {
    // Cleanup payment methods
    const cleanupResult = await cleanupExpiredPaymentMethods(supabaseClient, config)
    const cleanupData = await cleanupResult.json()
    results.payment_cleanups = cleanupData.processed || 0
  } catch (error) {
    results.errors.push(`Payment cleanup failed: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      message: 'Processed all timeout actions',
      results,
      total_processed: results.admin_reminders + results.customer_notifications + results.auto_rejections + results.payment_cleanups
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendAdminReminderEmail(supabaseClient: any, request: BookingRequest) {
  const emailData = {
    to: [
      { email: 'spirivincent03@gmail.com', name: 'Vincent' },
      { email: 'contact@tomodachitours.com', name: 'Tomodachi Tours' },
      { email: 'yutaka.m@tomodachitours.com', name: 'Yutaka' }
    ],
    template_id: SENDGRID_TEMPLATES.ADMIN_REMINDER,
    dynamic_template_data: {
      bookingId: request.id.toString(),
      tourName: request.tour_name,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      tourDate: formatDate(request.booking_date),
      tourTime: request.booking_time,
      adults: request.adults,
      children: request.children,
      infants: request.infants,
      totalAmount: formatCurrency(request.total_amount),
      specialRequests: request.special_requests,
      hoursPending: Math.floor((Date.now() - new Date(request.request_submitted_at).getTime()) / (1000 * 60 * 60)),
      requestSubmittedAt: formatDateTime(request.request_submitted_at)
    }
  }

  await sendEmail(supabaseClient, emailData, 'admin_reminder', request.id)
}

async function sendCustomerDelayEmail(supabaseClient: any, request: BookingRequest, hoursPending: number) {
  const emailData = {
    to: [{ email: request.customer_email, name: request.customer_name }],
    template_id: SENDGRID_TEMPLATES.CUSTOMER_DELAY_NOTIFICATION,
    dynamic_template_data: {
      bookingId: request.id.toString(),
      tourName: request.tour_name,
      customerName: request.customer_name,
      tourDate: formatDate(request.booking_date),
      tourTime: request.booking_time,
      adults: request.adults,
      children: request.children,
      infants: request.infants,
      totalAmount: formatCurrency(request.total_amount),
      specialRequests: request.special_requests,
      hoursPending: Math.floor((Date.now() - new Date(request.request_submitted_at).getTime()) / (1000 * 60 * 60)),
      requestSubmittedAt: formatDateTime(request.request_submitted_at)
    }
  }

  await sendEmail(supabaseClient, emailData, 'customer_delay_notification', request.id)
}

async function sendAutoRejectionEmails(supabaseClient: any, request: BookingRequest, hoursPending: number) {
  // Send customer auto-rejection email
  const customerEmailData = {
    to: [{ email: request.customer_email, name: request.customer_name }],
    template_id: SENDGRID_TEMPLATES.AUTO_REJECTION_CUSTOMER,
    dynamic_template_data: {
      bookingId: request.id.toString(),
      tourName: request.tour_name,
      customerName: request.customer_name,
      tourDate: formatDate(request.booking_date),
      tourTime: request.booking_time,
      adults: request.adults,
      children: request.children,
      infants: request.infants,
      totalAmount: formatCurrency(request.total_amount),
      specialRequests: request.special_requests,
      hoursPending,
      rejectionReason: `Your booking request was automatically cancelled after ${hoursPending} hours without confirmation. This helps us manage availability for other customers.`
    }
  }

  // Send admin auto-rejection notification
  const adminEmailData = {
    to: [
      { email: 'spirivincent03@gmail.com', name: 'Vincent' },
      { email: 'contact@tomodachitours.com', name: 'Tomodachi Tours' },
      { email: 'yutaka.m@tomodachitours.com', name: 'Yutaka' }
    ],
    template_id: SENDGRID_TEMPLATES.AUTO_REJECTION_ADMIN,
    dynamic_template_data: {
      bookingId: request.id.toString(),
      tourName: request.tour_name,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      tourDate: formatDate(request.booking_date),
      tourTime: request.booking_time,
      adults: request.adults,
      children: request.children,
      infants: request.infants,
      totalAmount: formatCurrency(request.total_amount),
      specialRequests: request.special_requests,
      hoursPending,
      autoRejectedAt: formatDateTime(new Date().toISOString())
    }
  }

  await Promise.all([
    sendEmail(supabaseClient, customerEmailData, 'auto_rejection_customer', request.id),
    sendEmail(supabaseClient, adminEmailData, 'auto_rejection_admin', request.id)
  ])
}

async function sendEmail(supabaseClient: any, emailData: any, emailType: string, bookingId: number) {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not set')
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: 'contact@tomodachitours.com', name: 'Tomodachi Tours' },
        personalizations: [{
          to: emailData.to,
          dynamic_template_data: emailData.dynamic_template_data
        }],
        template_id: emailData.template_id
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`)
    }

    console.log(`Successfully sent ${emailType} email for booking ${bookingId}`)
  } catch (error) {
    console.error(`Failed to send ${emailType} email for booking ${bookingId}:`, error)
    
    // Log email failure
    await supabaseClient
      .from('email_failures')
      .insert({
        booking_id: bookingId,
        email_type: emailType,
        recipient_email: emailData.to[0]?.email,
        error_message: error.message,
        template_data: emailData.dynamic_template_data,
        failed_at: new Date().toISOString()
      })

    throw error
  }
}

// Utility functions
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString()}`
}