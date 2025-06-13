// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, paymentSchema, addSecurityHeaders, sanitizeOutput } from './validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Payment processing function loaded")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received payment request')

    // Validate request data
    const { data, error } = await validateRequest(req, paymentSchema)
    if (error) {
      console.error('Validation error:', error)
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { token, amount, bookingId, discountCode, originalAmount } = data!
    console.log('Payment details:', { amount, bookingId, discountCode, originalAmount, hasToken: !!token })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Create charge with PayJP REST API
    try {
      console.log('Creating PayJP charge...')
      const secretKey = Deno.env.get('PAYJP_SECRET_KEY')
      console.log('PayJP key available:', !!secretKey)
      console.log('PayJP key length:', secretKey?.length)
      const payjpResponse = await fetch('https://api.pay.jp/v1/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${secretKey}:`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: amount.toString(),
          currency: 'jpy',
          card: token,
          capture: 'true',
          'metadata[booking_id]': bookingId.toString(),
          'metadata[discount_code]': discountCode || '',
          'metadata[original_amount]': originalAmount?.toString() || amount.toString()
        }).toString()
      })

      const charge = await payjpResponse.json()
      console.log('PayJP response:', charge)

      if (!payjpResponse.ok) {
        console.error('PayJP error:', charge.error)
        throw new Error(charge.error?.message || 'Payment failed')
      }

      if (!charge.paid) {
        console.error('Payment not marked as paid:', charge)
        throw new Error('Payment failed')
      }

      console.log('Payment successful, updating booking status...')
      console.log('Charge ID to be stored:', charge.id)

      // Update booking status in database - only use fields that exist in schema
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          charge_id: charge.id
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Failed to update booking:', updateError)
        console.log('Error details:', updateError)
        throw new Error('Failed to update booking status: ' + updateError.message)
      }

      console.log('Booking update successful, charge_id stored')

      console.log('Booking status updated, fetching booking details...')

      // Get booking details for email
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        console.error('Failed to fetch booking details:', bookingError)
        // Don't throw error as payment was successful
      } else {
        // Email functionality removed - will be reimplemented later
        console.log('Email notification system is being updated')
      }

      // If discount code was used, increment its usage
      if (discountCode) {
        console.log('Updating discount code usage...')
        const { error: discountError } = await supabase
          .rpc('increment_discount_code_usage', {
            code: discountCode
          })

        if (discountError) {
          console.error('Failed to update discount code usage:', discountError)
          // Don't throw error here as payment was successful
        } else {
          console.log('Discount code usage updated')
        }
      }

      console.log('Payment process completed successfully')

      // Return sanitized response
      return new Response(
        JSON.stringify({
          success: true,
          charge: sanitizeOutput(charge)
        }),
        {
          headers: addSecurityHeaders(new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json'
          }))
        }
      )

    } catch (error) {
      console.error('Payment processing error:', error)
      throw error
    }

  } catch (error) {
    console.error('Request processing error:', error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-charge' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"token":"tok_test","amount":6500,"bookingId":1}'

*/
