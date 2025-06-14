// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @deno-types="https://esm.sh/v128/@supabase/supabase-js@2.38.4/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, refundSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware/index.ts'
import sgMail from "npm:@sendgrid/mail"

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface RefundInfo {
  id: string;
  amount: number;
  status: string;
  created: number;
}

interface Booking {
  id: string;
  customer_email: string;
  customer_name: string;
  tour_type: string;
  booking_date: string;
  booking_time: string;
  adults: number;
  children?: number;
  infants?: number;
}

interface SendEmailOptions {
  to: string;
  templateId: string;
  dynamicTemplateData: {
    bookingId: string;
    tourName: string;
    tourDate: string;
    tourTime: string;
    adults: number;
    children: number;
    infants: number;
    refundAmount: string;
    customerName?: string;
    customerEmail?: string;
    adultPlural?: boolean;
    cancelledDate?: string;
    cancelledTime?: string;
  };
}

interface RequestData {
  bookingId: string;
  email: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// SendGrid template IDs
const SENDGRID_TEMPLATES = {
  CANCELLATION_CONFIRMATION: 'd-50d0cfd6a7294a5f91f415b8e4248535',
  CANCELLATION_NOTIFICATION: 'd-827197c8d2b34edc8c706c00dff6cf87'
}

// SendGrid sender config
const SENDGRID_FROM = {
  email: 'contact@tomodachitours.com',
  name: 'Tomodachi Tours'
}

async function getTourName(supabase: any, tourType: string): Promise<string> {
  try {
    const { data: tour, error } = await supabase
      .from('tours')
      .select('name')
      .eq('type', tourType)
      .single();

    if (error || !tour) {
      console.error('Failed to fetch tour name:', error);
      // Fallback to formatted tour type if database fetch fails
      return tourType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    }

    return tour.name;
  } catch (error) {
    console.error('Error fetching tour name:', error);
    // Fallback to formatted tour type
    return tourType.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  }
}

async function sendEmail({ to, templateId, dynamicTemplateData }: SendEmailOptions) {
  console.log('Attempting to send email:', { to, templateId });

  const msg = {
    to,
    from: SENDGRID_FROM,
    templateId,
    dynamicTemplateData,
  };

  try {
    console.log('SendGrid message configuration:', JSON.stringify(msg, null, 2));
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
    throw new Error('Failed to send email');
  }
}

async function sendCancellationEmails(supabase: any, booking: Booking, refundAmount: number) {
  console.log('Starting sendCancellationEmails with booking:', booking.id);

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

    console.log('Getting tour name for:', booking.tour_type);
    // Get proper tour name from database
    const tourName = await getTourName(supabase, booking.tour_type);
    console.log('Retrieved tour name:', tourName);

    // Send customer cancellation confirmation email
    console.log('Sending customer cancellation confirmation email');
    await sendEmail({
      to: booking.customer_email,
      templateId: SENDGRID_TEMPLATES.CANCELLATION_CONFIRMATION,
      dynamicTemplateData: {
        bookingId: booking.id,
        tourName: tourName,
        tourDate: formattedDate,
        tourTime: booking.booking_time,
        adults: booking.adults,
        children: booking.children || 0,
        infants: booking.infants || 0,
        refundAmount: refundAmount.toLocaleString()
      }
    });

    // Send company cancellation notification email
    console.log('Sending company cancellation notification email');
    const now = new Date();
    await sendEmail({
      to: 'spirivincent03@gmail.com', // Company email
      templateId: SENDGRID_TEMPLATES.CANCELLATION_NOTIFICATION,
      dynamicTemplateData: {
        bookingId: booking.id,
        tourName: tourName,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        tourDate: formattedDate,
        tourTime: booking.booking_time,
        adults: booking.adults,
        adultPlural: booking.adults > 1,
        children: booking.children || 0,
        infants: booking.infants || 0,
        cancelledDate: now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' }),
        cancelledTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        refundAmount: refundAmount.toLocaleString()
      }
    });

    console.log('Cancellation confirmation emails sent successfully');
  } catch (error) {
    console.error('Failed to send cancellation emails:', error);
    // Don't throw error as cancellation was successful
  }
}

serve(async (req) => {
  console.log('Received cancellation request');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request data
    console.log('Validating request data');
    const { data, error } = await validateRequest(req, refundSchema)
    if (error) {
      console.error('Validation error:', error);
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { bookingId } = data as RequestData
    console.log('Processing cancellation for booking:', bookingId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get booking details
    console.log('Fetching booking details');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      console.error('Failed to fetch booking:', bookingError);
      throw new Error('Failed to fetch booking')
    }

    // Get tour details for pricing
    console.log('Fetching tour details');
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('base_price')
      .eq('type', booking.tour_type)
      .single()

    if (tourError) {
      console.error('Failed to fetch tour:', tourError);
      throw new Error('Failed to fetch tour')
    }

    // Calculate refund based on cancellation policy
    console.log('Calculating refund amount');
    const bookingDate = new Date(booking.booking_date)
    const now = new Date()
    const hoursUntilTour = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let refundAmount = 0
    const originalAmount = tour.base_price * (booking.adults + (booking.children || 0))

    if (hoursUntilTour >= 48) {
      // Full refund if cancelled more than 48 hours before
      refundAmount = originalAmount
    } else if (hoursUntilTour >= 24) {
      // 50% refund if cancelled between 24-48 hours before
      refundAmount = originalAmount * 0.5
    }
    console.log('Calculated refund amount:', refundAmount);

    // Update booking status
    console.log('Updating booking status to CANCELLED');
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED'
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking status:', updateError);
      throw new Error('Failed to update booking status')
    }

    // Get updated booking for email
    console.log('Fetching updated booking');
    const { data: updatedBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch updated booking:', fetchError);
      throw new Error('Failed to fetch updated booking')
    }

    // After successful cancellation, send emails
    console.log('Sending cancellation emails');
    await sendCancellationEmails(supabase, booking, refundAmount);

    console.log('Cancellation process completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        message: refundAmount > 0
          ? `Booking cancelled successfully. A refund of ¥${refundAmount.toLocaleString()} will be processed.`
          : 'Booking cancelled successfully. No refund will be issued as per cancellation policy.',
        refund: refundAmount > 0 ? {
          amount: refundAmount,
          status: 'pending'
        } : null
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