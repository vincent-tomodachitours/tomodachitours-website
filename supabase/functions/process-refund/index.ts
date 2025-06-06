// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Refund processing function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, email } = await req.json()

    console.log("Refund request received:", { bookingId, email })

    if (!bookingId || !email) {
      throw new Error('Missing required fields: bookingId or email')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_email', email)
      .single()

    if (error || !booking) {
      console.error("Booking not found:", error)
      throw new Error('Booking not found')
    }

    console.log("Booking found:", booking.id, booking.tour_type)

    // Check 24-hour cancellation policy
    const bookingTime = booking.booking_time.padStart(5, '0') // Fix time format
    const bookingDateTime = new Date(`${booking.booking_date}T${bookingTime}`)
    const now = new Date()
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 3600)

    console.log("Time check:", { bookingDateTime, now, hoursDifference })

    if (hoursDifference < 24) {
      throw new Error('Cancellation must be made at least 24 hours before the tour date')
    }

    let refundInfo = null

    // Process refund if charge_id exists
    if (booking.charge_id) {
      console.log("Processing refund for charge:", booking.charge_id)

      const payjpKey = Deno.env.get('PAYJP_SECRET_KEY')
      if (!payjpKey) {
        throw new Error('PAYJP_SECRET_KEY not configured')
      }

      const refundResponse = await fetch(`https://api.pay.jp/v1/charges/${booking.charge_id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(payjpKey + ':')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: ''
      })

      const refund = await refundResponse.json()

      if (refund.error) {
        console.error("Pay.jp refund failed:", refund.error)
        throw new Error(refund.error.message || 'Refund processing failed')
      }

      refundInfo = {
        amount: refund.amount,
        id: refund.id
      }

      console.log("✅ Refund successful:", refund.id, refund.amount)
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId)

    if (updateError) {
      console.error("Failed to update booking status:", updateError)
      throw new Error('Failed to update booking status')
    }

    console.log("✅ Booking status updated to CANCELLED")

    // Send cancellation emails (customer + company)
    try {
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbx7ZkjQRaqafa2BdzRxCYBvX7rVwBYE12Zr6z4YQWi7y_RvInXqa4MCkm4MzWOdHNm9/exec'

      // 1. Send cancellation email to customer
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'ifyoureadthisyouregay',
          type: 'cancellation',
          name: booking.customer_name,
          email: booking.customer_email,
          tourname: booking.tour_type,
          date: booking.booking_date,
          time: booking.booking_time,
          refundAmount: refundInfo?.amount || 'N/A'
        })
      })

      console.log("✅ Customer cancellation email sent")

      // 2. Send cancellation notification to company
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: 'ifyoureadthisyouregay',
          type: 'company_cancellation',
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone || 'Not provided',
          tourname: booking.tour_type,
          date: booking.booking_date,
          time: booking.booking_time,
          adults: booking.adults,
          children: booking.children,
          infants: booking.infants,
          refundAmount: refundInfo?.amount || 'N/A',
          chargeId: booking.charge_id || 'N/A'
        })
      })

      console.log("✅ Company cancellation notification sent")
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
      // Don't fail the cancellation for email issues
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking cancelled successfully',
        refund: refundInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error("Refund processing failed:", error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-refund' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"bookingId":1,"email":"test@example.com"}'

*/
