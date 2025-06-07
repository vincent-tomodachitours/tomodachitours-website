// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Query the discount code
    const { data: discountCode, error } = await supabaseClient
      .from('discount_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('active', true)
      .single()

    if (error || !discountCode) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid or expired discount code'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Check if code is valid based on dates
    const now = new Date()
    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'This discount code has expired'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Check usage limit
    if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'This discount code has reached its usage limit'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Calculate discount
    let discountAmount = 0
    let finalAmount = originalAmount

    if (discountCode.type === 'percentage') {
      discountAmount = Math.floor(originalAmount * (discountCode.value / 100))
      finalAmount = originalAmount - discountAmount
    } else {
      discountAmount = discountCode.value
      finalAmount = Math.max(0, originalAmount - discountAmount)
    }

    console.log("✅ Discount applied:", { code: upperCode, discountAmount, finalAmount })

    // Increment the used_count
    const { error: updateError } = await supabaseClient
      .from('discount_codes')
      .update({ used_count: discountCode.used_count + 1 })
      .eq('id', discountCode.id)

    if (updateError) {
      console.error("Failed to update discount code usage count:", updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        discount: {
          code: upperCode,
          amount: discountAmount,
          type: discountCode.type,
          percentage: discountCode.type === 'percentage' ? discountCode.value : null,
          id: discountCode.id
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
