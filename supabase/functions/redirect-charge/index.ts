// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("3D Secure redirect function loaded")

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const chargeId = url.searchParams.get('charge_id') || url.searchParams.get('token_id')

        console.log("3D Secure redirect request:", { chargeId, url: req.url })

        if (!chargeId) {
            console.error("Missing charge_id in redirect")
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

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

        if (!finishResponse.ok) {
            const errorText = await finishResponse.text()
            console.error("Failed to finish 3DS charge:", errorText)
            return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
        }

        console.log("✅ 3D Secure processing completed successfully")

        // Redirect to success page
        return Response.redirect('https://tomodachitours.vercel.app/tours', 302)

    } catch (error) {
        console.error("3D Secure redirect failed:", error)
        return Response.redirect('https://tomodachitours.vercel.app/commercial-disclosure', 302)
    }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/redirect-charge?charge_id=ch_test_charge' \
    --header 'Authorization: Bearer [ANON_KEY]'

*/ 