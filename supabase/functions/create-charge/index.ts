/// <reference lib="deno.ns" />
/// <reference lib="dom" />
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, paymentSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware/index.ts'
// import { withRateLimit } from '../rate-limit-middleware/wrapper.ts' // Temporarily disabled due to broken wrapper
import sgMail from "npm:@sendgrid/mail"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-mode',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

console.log("Payment processing function loaded")

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// SendGrid template IDs
const SENDGRID_TEMPLATES = {
  BOOKING_CONFIRMATION: 'd-80e109cadad44eeab06c1b2396b504b2',
  BOOKING_NOTIFICATION: 'd-3337db456cc04cebb2009460bd23a629'
}

// SendGrid sender config
const SENDGRID_FROM = {
  email: 'contact@tomodachitours.com',
  name: 'Tomodachi Tours'
}

async function getTourName(supabase: any, tourType: string): Promise<{ name: string; meetingPoint: any }> {
  try {
    const { data: tour, error } = await supabase
      .from('tours')
      .select('name, meeting_point')
      .eq('type', tourType)
      .single();

    if (error || !tour) {
      console.error('Failed to fetch tour name:', error);
      // Fallback to formatted tour type if database fetch fails
      return {
        name: tourType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
        meetingPoint: {
          location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
          google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
          additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
        }
      };
    }

    // Return both name and meeting point
    return {
      name: tour.name,
      meetingPoint: tour.meeting_point || {
        location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
        google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
        additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
      }
    };
  } catch (error) {
    console.error('Error fetching tour name:', error);
    // Fallback to formatted tour type
    return {
      name: tourType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
      meetingPoint: {
        location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
        google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
        additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
      }
    };
  }
}

async function sendBookingEmails(supabase: any, booking: any) {
  if (!SENDGRID_API_KEY) {
    console.log('SendGrid API key not found, skipping email notifications');
    return;
  }

  try {
    // Format date and time
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get proper tour name and meeting point from database
    const { name: tourName, meetingPoint } = await getTourName(supabase, booking.tour_type);

    // Send customer confirmation email
    await sgMail.send({
      to: booking.customer_email,
      from: SENDGRID_FROM,
      templateId: SENDGRID_TEMPLATES.BOOKING_CONFIRMATION,
      dynamicTemplateData: {
        bookingId: booking.id,
        tourName: tourName,
        tourDate: formattedDate,
        tourTime: booking.booking_time,
        adults: booking.adults,
        children: booking.children || 0,
        infants: booking.infants || 0,
        totalAmount: booking.amount?.toLocaleString() || '0',
        meetingPoint: meetingPoint
      }
    });

    // Send company notification email
    const now = new Date();
    await sgMail.send({
      to: 'spirivincent03@gmail.com', // Company email
      from: SENDGRID_FROM,
      templateId: SENDGRID_TEMPLATES.BOOKING_NOTIFICATION,
      dynamicTemplateData: {
        bookingId: booking.id,
        productBookingRef: '',
        extBookingRef: '',
        productId: booking.tour_type,
        tourName: tourName,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone || '',
        tourDate: formattedDate,
        tourTime: booking.booking_time,
        adults: booking.adults,
        adultPlural: booking.adults > 1,
        children: booking.children || 0,
        infants: booking.infants || 0,
        createdDate: now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' }),
        createdTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        totalAmount: booking.amount?.toLocaleString() || '0',
        meetingPoint: meetingPoint
      }
    });

    console.log('Booking confirmation emails sent successfully');
  } catch (error) {
    console.error('Failed to send booking emails:', error);
    // Don't throw error as payment was successful
  }
}

interface PayJPCharge {
  id: string
  amount: number
  status: string
  paid: boolean
  error?: {
    message: string
  }
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    console.log('Received payment request')

    // Validate request data
    const { data, error } = await validateRequest(req, paymentSchema)
    if (error) {
      console.error('Validation error:', error)
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
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

    // Create charge with PayJP REST API
    const secretKey = Deno.env.get('PAYJP_SECRET_KEY')
    if (!secretKey) {
      throw new Error('PayJP secret key not configured')
    }

    const payjpResponse = await fetch('https://api.pay.jp/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${secretKey}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: data.amount.toString(),
        currency: 'jpy',
        card: data.token,
        capture: 'true',
        'metadata[booking_id]': data.bookingId.toString(),
        'metadata[discount_code]': data.discountCode || '',
        'metadata[original_amount]': (data.originalAmount || data.amount).toString()
      }).toString()
    })

    const charge: PayJPCharge = await payjpResponse.json()

    if (!payjpResponse.ok || !charge.paid) {
      console.error('PayJP error:', charge.error || charge)
      throw new Error(charge.error?.message || 'Payment failed')
    }

    // Update booking with charge information
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        charge_id: charge.id,
        status: 'CONFIRMED'
      })
      .eq('id', data.bookingId)

    if (bookingError) {
      console.error('Failed to update booking:', bookingError)
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

    console.log('Booking status updated, fetching booking details...')

    // Get booking details for email
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data.bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('Failed to fetch booking details:', fetchError)
      // Don't throw error as payment was successful
    } else {
      // Send confirmation emails
      await sendBookingEmails(supabase, booking)
    }

    // If discount code was used, increment its usage
    if (data.discountCode) {
      console.log('Updating discount code usage...')
      const { error: discountError } = await supabase
        .rpc('increment_discount_code_usage', {
          code: data.discountCode
        })

      if (discountError) {
        console.error('Failed to update discount code usage:', discountError)
        // Don't throw error here as payment was successful
      } else {
        console.log('Discount code usage updated')
      }
    }

    console.log('Payment process completed successfully')

    // Return sanitized response
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
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        }))
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}

// Export the wrapped handler
export default serve(handler) // Temporarily removed withRateLimit wrapper

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-charge' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"token":"tok_test","amount":6500,"bookingId":1}'

*/
