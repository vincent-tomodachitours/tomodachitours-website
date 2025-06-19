/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, refundSchema, addSecurityHeaders } from '../validation-middleware/index.ts'
import { withRateLimit } from '../rate-limit-middleware/wrapper.ts'

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
        { status: 400 }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request data' }),
        { status: 400 }
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
        { status: 404 }
      )
    }

    if (!booking.charge_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No payment found for this booking'
        }),
        { status: 400 }
      )
    }

    // Process refund with PayJP
    const secretKey = Deno.env.get('PAYJP_SECRET_KEY')
    if (!secretKey) {
      throw new Error('PayJP secret key not configured')
    }

    const refundResponse = await fetch(`https://api.pay.jp/v1/charges/${booking.charge_id}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${secretKey}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const refund: RefundInfo = await refundResponse.json()

    if (!refundResponse.ok) {
      console.error('PayJP refund error:', refund)
      throw new Error('Failed to process refund')
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'REFUNDED',
        refund_id: refund.id,
        refund_amount: refund.amount
      })
      .eq('id', data.bookingId)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update booking status'
        }),
        { status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status
        }
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Refund processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export default serve(withRateLimit(handler))

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-refund' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"bookingId":1,"email":"test@example.com"}'

*/