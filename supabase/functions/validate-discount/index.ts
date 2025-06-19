// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { addSecurityHeaders } from '../validation-middleware/index.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { validateRequest } from '../validation-middleware/index.ts'
import { withRateLimit } from '../rate-limit-middleware/wrapper.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-mode',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

// Validation schema for discount code request
const discountRequestSchema = z.object({
  code: z.string().min(1).max(50),
  originalAmount: z.number().int().positive()
})

console.log("Discount validation function loaded")

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Validate request data
    const { data, error } = await validateRequest(req, discountRequestSchema)
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

    // Get discount code from database
    const { data: discountCode, error: discountError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', data.code)
      .eq('active', true)
      .single()

    if (discountError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid discount code'
        }),
        { status: 400 }
      )
    }

    // Validate discount code
    const now = new Date()
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Discount code is not yet valid'
        }),
        { status: 400 }
      )
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Discount code has expired'
        }),
        { status: 400 }
      )
    }

    if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Discount code has reached maximum usage'
        }),
        { status: 400 }
      )
    }

    // Calculate discounted price
    const originalAmount = data.originalAmount
    let discountedPrice = originalAmount

    if (discountCode.type === 'percentage') {
      discountedPrice = Math.floor(originalAmount * (1 - discountCode.value / 100))
    } else if (discountCode.type === 'fixed') {
      discountedPrice = Math.max(0, originalAmount - discountCode.value)
    }

    // Apply minimum booking amount if set
    if (discountCode.min_booking_amount && originalAmount < discountCode.min_booking_amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Minimum booking amount is ¥${discountCode.min_booking_amount}`
        }),
        { status: 400 }
      )
    }

    // Apply maximum discount amount if set
    if (discountCode.max_discount_amount) {
      const discount = originalAmount - discountedPrice
      if (discount > discountCode.max_discount_amount) {
        discountedPrice = originalAmount - discountCode.max_discount_amount
      }
    }

    const response = {
      success: true,
      code: discountCode.code,
      originalAmount: originalAmount,
      discountedPrice,
      type: discountCode.type,
      value: discountCode.value
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: addSecurityHeaders(new Headers({
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
      { status: 500 }
    )
  }
}

// Export the wrapped handler
export default serve(withRateLimit(handler))

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/validate-discount' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"code":"WELCOME10","originalAmount":6500}'

*/
