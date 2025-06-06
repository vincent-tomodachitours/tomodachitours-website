// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hard-coded discount codes (matching existing Firebase function)
const discountCodes = {
  'WELCOME10': { discount: 10, type: 'percentage' },
  'SAVE1000': { discount: 1000, type: 'fixed' },
  'FIRSTTIME': { discount: 15, type: 'percentage' },
  'REPEAT20': { discount: 20, type: 'percentage' }
}

console.log("Discount validation function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, originalAmount } = await req.json()

    console.log("Discount validation request:", { code, originalAmount })

    if (!code || !originalAmount) {
      throw new Error('Missing required fields: code or originalAmount')
    }

    const upperCode = code.toUpperCase()

    if (!discountCodes[upperCode]) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid discount code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const discount = discountCodes[upperCode]
    let discountAmount = 0
    let finalAmount = originalAmount

    if (discount.type === 'percentage') {
      discountAmount = Math.floor(originalAmount * (discount.discount / 100))
      finalAmount = originalAmount - discountAmount
    } else {
      discountAmount = discount.discount
      finalAmount = Math.max(0, originalAmount - discountAmount)
    }

    console.log("✅ Discount applied:", { code: upperCode, discountAmount, finalAmount })

    return new Response(
      JSON.stringify({
        success: true,
        discount: {
          code: upperCode,
          amount: discountAmount,
          type: discount.type,
          percentage: discount.type === 'percentage' ? discount.discount : null
        },
        originalAmount,
        finalAmount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error("Discount validation failed:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-discount' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"code":"WELCOME10","originalAmount":6500}'

*/
