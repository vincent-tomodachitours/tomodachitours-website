/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, bookingRequestSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware/index.ts'
import sgMail from "npm:@sendgrid/mail"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

console.log("Booking request function loaded")

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// SendGrid template IDs for booking requests
// NOTE: These template IDs need to be updated once templates are created in SendGrid
// See EMAIL_TEMPLATES.md for template creation instructions
const SENDGRID_TEMPLATES = {
  REQUEST_CONFIRMATION: 'd-booking-request-confirmation', // Customer confirmation template
  ADMIN_NOTIFICATION: 'd-booking-request-admin-notification' // Admin notification template
}

// SendGrid sender config
const SENDGRID_FROM = {
  email: 'contact@tomodachitours.com',
  name: 'Tomodachi Tours'
}

/**
 * Get tour name and details from database
 */
async function getTourDetails(supabase: any, tourType: string): Promise<{ name: string; meetingPoint: any }> {
  try {
    const { data: tour, error } = await supabase
      .from('tours')
      .select('name, meeting_point')
      .eq('type', tourType)
      .single();

    if (error || !tour) {
      console.error('Failed to fetch tour details:', error);
      // Fallback to formatted tour type if database fetch fails
      return {
        name: tourType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        meetingPoint: {
          location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
          google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
          additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
        }
      };
    }

    return {
      name: tour.name,
      meetingPoint: tour.meeting_point || {
        location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
        google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
        additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
      }
    };
  } catch (error) {
    console.error('Error fetching tour details:', error);
    // Fallback to formatted tour type
    return {
      name: tourType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      meetingPoint: {
        location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
        google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
        additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
      }
    };
  }
}

/**
 * Send booking request confirmation emails
 */
async function sendRequestEmails(supabase: any, booking: any, tourDetails: any) {
  try {
    // Helper function to escape special characters for Handlebars
    const escapeHandlebars = (str: string) => {
      if (!str) return str;
      return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    // Format date and time
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalAmountFormatted = booking.total_amount.toLocaleString();

    let emailSent = false;

    if (SENDGRID_API_KEY) {
      try {
        // Send customer request confirmation email
        await sgMail.send({
          to: booking.customer_email,
          from: SENDGRID_FROM,
          template_id: SENDGRID_TEMPLATES.REQUEST_CONFIRMATION,
          personalizations: [{
            to: [{ email: booking.customer_email }],
            dynamic_template_data: {
              bookingId: booking.id.toString(),
              tourName: escapeHandlebars(tourDetails.name),
              tourDate: escapeHandlebars(formattedDate),
              tourTime: escapeHandlebars(booking.booking_time),
              adults: booking.adults,
              children: booking.children || 0,
              infants: booking.infants || 0,
              totalAmount: `¥${totalAmountFormatted}`,
              customerName: escapeHandlebars(booking.customer_name),
              specialRequests: escapeHandlebars(booking.special_requests || ''),
              meetingPoint: {
                location: escapeHandlebars(tourDetails.meetingPoint.location),
                google_maps_url: tourDetails.meetingPoint.google_maps_url,
                additional_info: escapeHandlebars(tourDetails.meetingPoint.additional_info || '')
              }
            }
          }]
        });

        // Send admin notification emails
        const adminEmails = [
          'spirivincent03@gmail.com',
          'contact@tomodachitours.com',
          'yutaka.m@tomodachitours.com'
        ];

        const now = new Date();
        const adminNotificationData = {
          bookingId: booking.id.toString(),
          tourName: escapeHandlebars(tourDetails.name),
          customerName: escapeHandlebars(booking.customer_name),
          customerEmail: escapeHandlebars(booking.customer_email),
          customerPhone: escapeHandlebars(booking.customer_phone || ''),
          tourDate: escapeHandlebars(formattedDate),
          tourTime: escapeHandlebars(booking.booking_time),
          adults: booking.adults,
          children: booking.children || 0,
          infants: booking.infants || 0,
          totalAmount: `¥${totalAmountFormatted}`,
          specialRequests: escapeHandlebars(booking.special_requests || ''),
          requestedDate: escapeHandlebars(now.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'long', 
            day: '2-digit' 
          })),
          requestedTime: escapeHandlebars(now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })),
          meetingPoint: {
            location: escapeHandlebars(tourDetails.meetingPoint.location),
            google_maps_url: tourDetails.meetingPoint.google_maps_url,
            additional_info: escapeHandlebars(tourDetails.meetingPoint.additional_info || '')
          }
        };

        // Send admin notification emails
        const personalizations = adminEmails.map(email => ({
          to: [{ email: email }],
          dynamic_template_data: adminNotificationData
        }));

        try {
          console.log(`Sending admin notifications for booking request ${booking.id}`);
          await sgMail.send({
            from: SENDGRID_FROM,
            template_id: SENDGRID_TEMPLATES.ADMIN_NOTIFICATION,
            personalizations: personalizations
          });
          console.log(`✅ Successfully sent admin notifications for booking request ${booking.id}`);
        } catch (emailError) {
          console.error(`❌ Failed to send admin notifications:`, emailError);
          if (emailError.response) {
            console.error(`Response body:`, emailError.response.body);
          }
        }

        emailSent = true;
        console.log('Booking request emails sent successfully via SendGrid');
      } catch (sendgridError) {
        console.error('SendGrid failed:', sendgridError);

        // Check if it's a credits exceeded error
        if (sendgridError.response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
          console.error('SendGrid credits exceeded - need to upgrade plan or add credits');
        }
      }
    }

    // If SendGrid failed or isn't configured, log the booking details for manual follow-up
    if (!emailSent) {
      console.log('EMAIL SERVICE UNAVAILABLE - MANUAL FOLLOW-UP REQUIRED');
      console.log('Booking Request Details for Manual Email:');
      console.log(`- Booking ID: ${booking.id}`);
      console.log(`- Customer: ${booking.customer_name} (${booking.customer_email})`);
      console.log(`- Tour: ${tourDetails.name}`);
      console.log(`- Date: ${formattedDate} at ${booking.booking_time}`);
      console.log(`- Participants: ${booking.adults} adults, ${booking.children || 0} children`);
      console.log(`- Amount: ¥${totalAmountFormatted}`);
      console.log(`- Status: PENDING_CONFIRMATION (Request)`);

      // Store failed email attempt in database for follow-up
      try {
        await supabase
          .from('email_failures')
          .insert({
            booking_id: booking.id,
            customer_email: booking.customer_email,
            email_type: 'booking_request_confirmation',
            failure_reason: 'SendGrid unavailable or credits exceeded',
            booking_details: {
              tourName: tourDetails.name,
              tourDate: formattedDate,
              tourTime: booking.booking_time,
              adults: booking.adults,
              children: booking.children || 0,
              totalAmount: `¥${totalAmountFormatted}`,
              status: 'PENDING_CONFIRMATION',
              meetingPoint: tourDetails.meetingPoint
            },
            created_at: new Date().toISOString()
          });
        console.log('Email failure logged for manual follow-up');
      } catch (logError) {
        console.error('Failed to log email failure:', logError);
      }
    }

  } catch (error) {
    console.error('Failed to send booking request emails:', error);
    // Don't throw error as booking request creation was successful
  }
}

/**
 * Validate that the tour type is eligible for booking requests
 */
function isUjiTour(tourType: string): boolean {
  const ujiTourTypes = ['uji-tour', 'uji-walking-tour'];
  return ujiTourTypes.includes(tourType.toLowerCase());
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    console.log('Received booking request')

    // Validate request data
    const { data, error } = await validateRequest(req, bookingRequestSchema)
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

    // Validate that this is a Uji tour (booking requests are only for Uji tours)
    if (!isUjiTour(data.tour_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Booking requests are only available for Uji tours. Please use the regular booking flow for other tours.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    console.log('Creating booking request...')

    // Create booking record with PENDING_CONFIRMATION status
    const bookingData = {
      tour_type: data.tour_type,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      adults: data.adults,
      children: data.children || 0,
      infants: data.infants || 0,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone || null,
      payment_method_id: data.payment_method_id,
      total_amount: data.total_amount,
      discount_code: data.discount_code || null,
      special_requests: data.special_requests || null,
      status: 'PENDING_CONFIRMATION',
      request_submitted_at: new Date().toISOString(),
      // Set tour_id to a default value (will be updated when we have proper tour management)
      tour_id: 1,
      // Set number_of_people for compatibility with existing schema
      number_of_people: data.adults + (data.children || 0) + (data.infants || 0)
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (bookingError) {
      console.error('Failed to create booking request:', bookingError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create booking request'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Booking request created with ID: ${booking.id}`)

    // Log the booking request event
    try {
      await supabase
        .from('booking_request_events')
        .insert({
          booking_id: booking.id,
          event_type: 'submitted',
          event_data: {
            tour_type: data.tour_type,
            total_amount: data.total_amount,
            adults: data.adults,
            children: data.children || 0,
            infants: data.infants || 0,
            payment_method_id: data.payment_method_id
          },
          created_by: 'customer'
        });
      console.log(`Logged booking request event for booking ${booking.id}`);
    } catch (eventError) {
      console.error('Failed to log booking request event:', eventError);
      // Don't fail the request creation for logging errors
    }

    // Get tour details for emails
    const tourDetails = await getTourDetails(supabase, data.tour_type);

    // Send confirmation emails
    await sendRequestEmails(supabase, booking, tourDetails);

    console.log('Booking request process completed successfully')

    // Return sanitized response
    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        status: 'PENDING_CONFIRMATION',
        message: 'Your booking request has been submitted successfully. You will receive a confirmation email shortly, and we will review your request within 24 hours.'
      }),
      {
        headers: addSecurityHeaders(new Headers({
          ...corsHeaders,
          'Content-Type': 'application/json'
        }))
      }
    )

  } catch (error) {
    console.error('Booking request processing error:', error)
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

// Export the handler
export default serve(handler)

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-booking-request' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "tour_type": "uji-tour",
      "booking_date": "2025-02-15",
      "booking_time": "10:00",
      "adults": 2,
      "children": 0,
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+1234567890",
      "payment_method_id": "pm_test_123",
      "total_amount": 13000
    }'

*/