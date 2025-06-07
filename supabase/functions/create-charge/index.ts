// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Payjp } from 'https://esm.sh/payjp-typescript'
import { validateRequest, paymentSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Payment processing function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request data
    const { data, error } = await validateRequest(req, paymentSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { token, amount, bookingId, discountCode, originalAmount } = data!

    // Initialize clients
    const payjp = new Payjp(Deno.env.get('PAYJP_SECRET_KEY') || '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Create charge with PayJP
    try {
      const charge = await payjp.charges.create({
        amount,
        currency: 'jpy',
        card: token,
        capture: true,
        metadata: {
          booking_id: bookingId.toString(),
          discount_code: discountCode || '',
          original_amount: originalAmount?.toString() || amount.toString()
        }
      })

      if (!charge.paid) {
        throw new Error('Payment failed')
      }

      // Update booking status in database
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          payment_id: charge.id,
          payment_status: 'PAID',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Failed to update booking:', updateError)
        throw new Error('Failed to update booking status')
      }

      // If discount code was used, increment its usage
      if (discountCode) {
        const { error: discountError } = await supabase
          .rpc('increment_discount_code_usage', {
            code: discountCode
          })

        if (discountError) {
          console.error('Failed to update discount code usage:', discountError)
          // Don't throw error here as payment was successful
        }
      }

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
