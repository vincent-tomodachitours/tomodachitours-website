// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import { addSecurityHeaders } from '../validation-middleware'
import { z } from 'zod'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("3D Secure redirect handler loaded")

// URL parameter validation schema
const urlParamsSchema = z.object({
    charge_id: z.string().optional(),
    token_id: z.string().optional()
}).refine(data => data.charge_id || data.token_id, {
    message: "Either charge_id or token_id must be provided"
})

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const params = {
            charge_id: url.searchParams.get('charge_id'),
            token_id: url.searchParams.get('token_id')
        }

        // Validate URL parameters
        const result = urlParamsSchema.safeParse(params)
        if (!result.success) {
            console.error("Invalid URL parameters:", result.error)
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

        const chargeId = params.charge_id || params.token_id
        console.log("3D Secure redirect request:", { chargeId, url: req.url })

        const payjpKey = Deno.env.get('PAYJP_SECRET_KEY')
        if (!payjpKey) {
            console.error("PAYJP_SECRET_KEY not configured")
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

        // Step 1: Fetch the charge info
        const chargeResponse = await fetch(`https://api.pay.jp/v1/charges/${chargeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(payjpKey + ':')}`
            }
        })

        const chargeData = await chargeResponse.json()

        if (chargeData.error) {
            console.error("Failed to fetch charge:", chargeData.error)
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

        // If 3D Secure was not completed properly
        if (chargeData.three_d_secure_status === 'attempted') {
            console.log("3D Secure attempted but not completed")
            return Response.redirect('https://tomodachitours.vercel.app/cancellation-policy', 302)
        }

        // Step 2: Finish the 3DS redirect flow
        const finishResponse = await fetch(`https://api.pay.jp/v1/charges/${chargeId}/tds_finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(payjpKey + ':')}`
            }
        })

        const finishData = await finishResponse.json()

        if (finishData.error) {
            console.error("Failed to finish 3D Secure:", finishData.error)
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

        // Update booking status if payment was successful
        if (finishData.paid) {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') || '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
            )

            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    status: 'CONFIRMED',
                    payment_status: 'PAID',
                    three_d_secure_status: finishData.three_d_secure_status,
                    updated_at: new Date().toISOString()
                })
                .eq('payment_id', chargeId)

            if (updateError) {
                console.error("Failed to update booking status:", updateError)
                // Continue to success page anyway as payment was successful
            }

            return Response.redirect('https://tomodachitours.vercel.app/thankyou', 302)
        }

        return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)

    } catch (error) {
        console.error("3D Secure redirect processing error:", error)
        return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
    }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/redirect-charge?charge_id=ch_test_charge' \
    --header 'Authorization: Bearer [ANON_KEY]'

*/ 