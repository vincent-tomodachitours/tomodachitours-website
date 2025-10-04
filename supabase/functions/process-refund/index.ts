/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, refundSchema, addSecurityHeaders } from '../validation-middleware/index.ts'
import { StripeService } from '../_shared/stripe-service.ts'
// import { withRateLimit } from '../rate-limit-middleware/wrapper.ts' // Temporarily disabled

console.log("Refund processing function loaded")

interface RefundInfo {
  id: string
  amount: number
  status: string
  created: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-mode',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Validate request data
    const { data, error } = await validateRequest(req, refundSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data.bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Booking not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Determine payment provider and check if payment exists
    const paymentProvider = booking.payment_provider || 'stripe'
    const hasStripePayment = booking.stripe_payment_intent_id || booking.charge_id

    if (!hasStripePayment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No payment found for this booking'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let refund: RefundInfo | null = null
    let refundResponse: any = null

    // Process Stripe refund
    try {
      const stripeService = new StripeService()
      const paymentIntentId = booking.stripe_payment_intent_id || booking.charge_id
      const stripeRefund = await stripeService.createRefund(paymentIntentId)

      refund = {
        id: stripeRefund.id,
        amount: stripeRefund.amount,
        status: stripeRefund.status,
        created: stripeRefund.created
      }

      refundResponse = { ok: true }
      console.log('Stripe refund processed successfully:', refund)
    } catch (error) {
      console.error('Stripe refund error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already refunded') || errorMessage.includes('cannot refund')) {
        console.log('Stripe payment already refunded, updating booking status...')
        refundResponse = { ok: false, error: { code: 'already_refunded' } }
      } else if (errorMessage.includes('does not have a successful charge to refund')) {
        console.log('PaymentIntent has no successful charge - likely a test booking or failed payment, proceeding with cancellation...')
        refundResponse = { ok: false, error: { code: 'no_successful_charge' } }
      } else {
        throw new Error('Failed to process Stripe refund')
      }
    }

    // Update booking status (this runs whether the refund was successful OR already_refunded)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED'
        // Note: Using 'CANCELLED' instead of 'REFUNDED' to match database constraint
        // Refund information is tracked in Stripe and can be retrieved using payment intent ID
      })
      .eq('id', data.bookingId)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update booking status'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send cancellation notification email
    try {
      const tourTypeMapping: Record<string, string> = {
        'morning-tour': 'Morning Walking Tour',
        'night-tour': 'Night Walking Tour',
        'uji-tour': 'Uji Tea Tour',
        'uji-walking-tour': 'Uji Walking Tour',
        'gion-tour': 'Gion District Tour'
      }

      const tourName = tourTypeMapping[booking.tour_type] || booking.tour_type

      // Format dates
      const bookingDate = new Date(booking.booking_date)
      const cancelledDate = new Date()

      const templateData = {
        bookingId: booking.id.toString(),
        tourName: tourName,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        tourDate: bookingDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: booking.booking_time,
        adults: booking.adults,
        adultPlural: booking.adults > 1,
        children: booking.children || 0,
        infants: booking.infants || 0,
        cancelledDate: cancelledDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        cancelledTime: cancelledDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        refundAmount: refundResponse.ok && refund ? `¥${refund.amount.toLocaleString()}` : 'Already processed'
      }

      // Send cancellation confirmation to customer
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: booking.customer_email,
          templateId: 'd-50d0cfd6a7294a5f91f415b8e4248535', // CANCELLATION_CONFIRMATION template
          templateData: templateData
        })
      })

      // Send cancellation notifications to all company emails
      const companyEmails = [
        'spirivincent03@gmail.com',
        'contact@tomodachitours.com',
        'yutaka.m@tomodachitours.com'
      ];

      // Send cancellation notifications using proper SendGrid personalizations
      const personalizations = companyEmails.map(email => ({
        to: [{ email: email }],
        dynamic_template_data: templateData
      }));

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: 'd-827197c8d2b34edc8c706c00dff6cf87', // CANCELLATION_NOTIFICATION template
          personalizations: personalizations
        })
      })

      console.log('Cancellation emails sent successfully')
    } catch (emailError) {
      console.error('Failed to send cancellation emails:', emailError)
      // Don't fail the entire operation if email fails
    }

    // Prepare response based on refund status
    let responseData
    if (refundResponse.ok && refund) {
      responseData = {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status
        }
      }
    } else if (refundResponse.error?.code === 'already_refunded') {
      responseData = {
        success: true,
        message: 'Booking cancelled successfully (charge was already refunded)',
        alreadyRefunded: true
      }
    } else if (refundResponse.error?.code === 'no_successful_charge') {
      responseData = {
        success: true,
        message: 'Booking cancelled successfully (no payment to refund)',
        noChargeToRefund: true
      }
    } else {
      responseData = {
        success: true,
        message: 'Booking cancelled successfully',
        noRefundProcessed: true
      }
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Refund processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Export the wrapped handler
export default serve(handler) // Temporarily removed withRateLimit wrapper

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-refund' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"bookingId":1,"email":"test@example.com"}'

*/