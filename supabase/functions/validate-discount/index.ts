// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from '@supabase/supabase-js'
import { validateRequest, addSecurityHeaders, sanitizeOutput } from '../validation-middleware'
import { z } from 'zod'

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema for discount code request
const discountRequestSchema = z.object({
  code: z.string().min(1).max(50),
  tourPrice: z.number().int().positive()
})

console.log("Discount validation function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request data
    const { data, error } = await validateRequest(req, discountRequestSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { code, tourPrice } = data!

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get discount code details
    const { data: discountCode, error: discountError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (discountError) {
      throw new Error('Invalid discount code')
    }

    // Validate discount code
    const now = new Date()
    const startDate = new Date(discountCode.valid_from)
    const endDate = discountCode.valid_until ? new Date(discountCode.valid_until) : null

    if (now < startDate || (endDate && now > endDate)) {
      throw new Error('Discount code has expired or is not yet valid')
    }

    if (discountCode.max_uses && discountCode.times_used >= discountCode.max_uses) {
      throw new Error('Discount code has reached maximum usage')
    }

    // Calculate discounted price
    let discountedPrice = tourPrice
    if (discountCode.discount_type === 'percentage') {
      discountedPrice = Math.round(tourPrice * (1 - discountCode.discount_value / 100))
    } else if (discountCode.discount_type === 'fixed') {
      discountedPrice = tourPrice - discountCode.discount_value
    }

    // Ensure minimum price
    if (discountCode.minimum_price && discountedPrice < discountCode.minimum_price) {
      discountedPrice = discountCode.minimum_price
    }

    const response = {
      success: true,
      code: discountCode.code,
      originalPrice: tourPrice,
      discountedPrice,
      discountType: discountCode.discount_type,
      discountValue: discountCode.discount_value
    }

    return new Response(
      JSON.stringify(sanitizeOutput(response)),
      {
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        }))
      }
    )

  } catch (error) {
    console.error('Discount validation error:', error)
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
        status: 400
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
