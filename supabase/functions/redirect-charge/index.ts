/// <reference lib="deno.ns" />
/// <reference lib="dom" />
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { addSecurityHeaders } from '../validation-middleware/index.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { validateRequest } from '../validation-middleware/index.ts'
// import { withRateLimit } from '../rate-limit-middleware/wrapper.ts' // Temporarily disabled

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-mode',
    'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

console.log("3D Secure redirect handler loaded")

// Validation schema for 3D Secure redirect
const redirectSchema = z.object({
    charge_id: z.string().min(1),
    booking_id: z.number().int().positive()
})

const handler = async (req: Request): Promise<Response> => {
    try {
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        // Validate request data
        const { data, error } = await validateRequest(req, redirectSchema)
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

        // Get charge status from PayJP
        const secretKey = Deno.env.get('PAYJP_SECRET_KEY')
        if (!secretKey) {
            throw new Error('PayJP secret key not configured')
        }

        const chargeResponse = await fetch(`https://api.pay.jp/v1/charges/${data.charge_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${secretKey}:`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const charge = await chargeResponse.json()

        if (!chargeResponse.ok || !charge.paid) {
            console.error('PayJP charge verification failed:', charge)
            throw new Error('Payment verification failed')
        }

        // Update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'CONFIRMED'
            })
            .eq('id', data.booking_id)

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

        return new Response(
            JSON.stringify({
                success: true,
                charge: {
                    id: charge.id,
                    amount: charge.amount,
                    status: charge.status
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('3D Secure redirect error:', error)
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

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/redirect-charge?charge_id=ch_test_charge' \
    --header 'Authorization: Bearer [ANON_KEY]'

*/ 