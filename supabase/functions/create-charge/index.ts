// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'

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
    const { token, amount, discountCode, originalAmount, bookingId } = await req.json()

    console.log("Payment request received:", { amount, discountCode, bookingId })

    if (!token || !amount || !bookingId) {
      throw new Error('Missing required fields: token, amount, or bookingId')
    }

    // Initialize Pay.jp
    const payjpKey = Deno.env.get('PAYJP_SECRET_KEY')
    if (!payjpKey) {
      throw new Error('PAYJP_SECRET_KEY not configured')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // If there's a discount code, get its ID
    let discountCodeId = null
    let discountAmount = null
    if (discountCode) {
      const { data: discountData } = await supabaseClient
        .from('discount_codes')
        .select('id')
        .eq('code', discountCode)
        .single()

      if (discountData) {
        discountCodeId = discountData.id
        discountAmount = originalAmount - amount
      }
    }

    console.log("Creating charge with Pay.jp...")

    // Create charge with Pay.jp
    const chargeParams = new URLSearchParams({
      amount: amount.toString(),
      currency: 'jpy',
      card: token,
      description: discountCode ?
        `Tour payment (${discountCode} applied - Original: ¥${originalAmount})` :
        "Tour payment"
    })

    if (discountCode) {
      chargeParams.append('metadata[discount_code]', discountCode)
      chargeParams.append('metadata[original_amount]', originalAmount?.toString() || amount.toString())
    }

    const chargeResponse = await fetch('https://api.pay.jp/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(payjpKey + ':')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: chargeParams
    })

    const charge = await chargeResponse.json()

    if (charge.error) {
      console.error("Pay.jp charge failed:", charge.error)
      throw new Error(charge.error.message || 'Payment failed')
    }

    console.log("✅ Charge successful:", charge.id)

    // Update booking with charge ID and discount info in Supabase
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        charge_id: charge.id,
        discount_code_id: discountCodeId,
        discount_amount: discountAmount,
        status: 'CONFIRMED'
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error("Failed to update booking:", updateError)
      // Don't throw error here, as payment was successful
    }

    // Send confirmation email
    try {
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (booking) {
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbx7ZkjQRaqafa2BdzRxCYBvX7rVwBYE12Zr6z4YQWi7y_RvInXqa4MCkm4MzWOdHNm9/exec'

        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: 'ifyoureadthisyouregay',
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            date: booking.booking_date,
            time: booking.booking_time,
            adults: booking.adults,
            children: booking.children,
            infants: booking.infants,
            tourname: booking.tour_type,
            tourprice: amount
          })
        })

        console.log("✅ Email notification sent")
      }
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
      // Don't fail the payment for email issues
    }

    return new Response(
      JSON.stringify({
        success: true,
        charge
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error("Payment failed:", error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-charge' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"token":"tok_test","amount":6500,"bookingId":1}'

*/
