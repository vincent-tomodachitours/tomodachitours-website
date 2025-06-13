// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @deno-types="https://esm.sh/v128/@supabase/supabase-js@2.38.4/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, refundSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware/index.ts'

interface RefundInfo {
  id: string;
  amount: number;
  status: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request data
    const { data, error } = await validateRequest(req, refundSchema)
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { bookingId } = data!

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    const typedBooking = booking as any

    // Check if booking is already cancelled
    if (typedBooking.status === 'cancelled') {
      throw new Error('Booking is already cancelled')
    }

    // Get tour price from tours table
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('base_price')
      .eq('type', typedBooking.tour_type)
      .single()

    if (tourError || !tour) {
      console.error('Failed to fetch tour price:', tourError)
      throw new Error('Failed to fetch tour price')
    }

    // Calculate refund amount based on cancellation policy
    const bookingDate = new Date(typedBooking.booking_date)
    const now = new Date()
    const hoursUntilTour = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let refundInfo: RefundInfo | null = null
    const originalAmount = tour.base_price * (typedBooking.adults + typedBooking.children)

    // Check if booking was already refunded
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (existingRefund) {
      refundInfo = {
        id: 'previously_refunded',
        amount: existingRefund.amount,
        status: existingRefund.status
      }
    } else if (hoursUntilTour >= 48) {
      // Full refund if cancelled more than 48 hours before
      refundInfo = {
        id: crypto.randomUUID(),
        amount: originalAmount,
        status: 'pending'
      }
    } else if (hoursUntilTour >= 24) {
      // 50% refund if cancelled between 24-48 hours before
      refundInfo = {
        id: crypto.randomUUID(),
        amount: originalAmount * 0.5,
        status: 'pending'
      }
    }
    // No refund if cancelled less than 24 hours before

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error('Failed to update booking status')
    }

    // Create refund record if applicable
    if (refundInfo && refundInfo.id !== 'previously_refunded') {
      const { error: refundError } = await supabase
        .from('refunds')
        .insert({
          id: refundInfo.id,
          booking_id: bookingId,
          amount: refundInfo.amount,
          status: refundInfo.status
        })

      if (refundError) {
        console.error('Failed to create refund record:', refundError)
        throw new Error('Failed to create refund record')
      }
    }

    // Get updated booking for email
    const { data: updatedBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError) {
      throw new Error('Failed to fetch updated booking')
    }

    // Remove email sending functionality for now
    // We'll implement a new email system later

    return new Response(
      JSON.stringify({
        success: true,
        message: refundInfo?.id === 'previously_refunded'
          ? 'Booking cancelled. This booking was already refunded.'
          : refundInfo
            ? `Booking cancelled successfully. A refund will be processed.`
            : 'Booking cancelled successfully.',
        refund: sanitizeOutput(refundInfo)
      }),
      {
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        }))
      }
    )

  } catch (error) {
    console.error('Error in process-refund:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
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
