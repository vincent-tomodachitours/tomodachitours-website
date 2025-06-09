// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import { validateRequest, refundSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request data
    const { data, error } = await validateRequest(req, refundSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { bookingId, email } = data!

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_email', email)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Check 24-hour cancellation policy
    const bookingTime = booking.booking_time.padStart(5, '0') // Fix time format
    const bookingDateTime = new Date(`${booking.booking_date}T${bookingTime}`)
    const now = new Date()
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 3600)

    if (hoursDifference < 24) {
      throw new Error('Cancellation must be made at least 24 hours before the tour date')
    }

    let refundInfo = null

    // Process refund if charge_id exists
    if (booking.charge_id) {
      const payjpKey = Deno.env.get('PAYJP_SECRET_KEY')
      if (!payjpKey) {
        throw new Error('PAYJP_SECRET_KEY not configured')
      }

      const refundResponse = await fetch(`https://api.pay.jp/v1/charges/${booking.charge_id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(payjpKey + ':')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: ''
      })

      const refund = await refundResponse.json()

      if (refund.error) {
        throw new Error(refund.error.message || 'Refund processing failed')
      }

      refundInfo = {
        amount: refund.amount,
        id: refund.id
      }
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        payment_status: 'REFUNDED',
        refund_id: refundInfo?.id,
        refund_amount: refundInfo?.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error('Failed to update booking status')
    }

    // Send cancellation email
    try {
      const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          type: 'cancellation',
          bookingId: bookingId
        })
      })

      const notificationResult = await notificationResponse.json()
      if (!notificationResult.success) {
        console.error('Failed to send cancellation email:', notificationResult.error)
        // Don't throw error as refund was successful
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
      // Don't throw error as refund was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking cancelled successfully',
        refund: sanitizeOutput(refundInfo)
      }),
      {
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        }))
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        })),
        status: 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-refund' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"bookingId":1,"email":"test@example.com"}'

*/
