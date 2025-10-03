/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { addSecurityHeaders } from '../validation-middleware/index.ts'
import sgMail from "npm:@sendgrid/mail"
import { StripeService } from '../_shared/stripe-service.ts'
import { PaymentProviderService } from '../_shared/payment-provider-service.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

console.log("Manage booking request function loaded")

// Initialize SendGrid
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// SendGrid template IDs for booking request status notifications
// NOTE: These template IDs need to be updated once templates are created in SendGrid
const SENDGRID_TEMPLATES = {
  REQUEST_APPROVED: 'd-booking-request-approved', // Customer approval notification
  REQUEST_REJECTED: 'd-booking-request-rejected', // Customer rejection notification
  PAYMENT_FAILED: 'd-booking-request-payment-failed', // Customer payment failure notification
  ADMIN_PAYMENT_FAILED: 'd-booking-request-admin-payment-failed' // Admin payment failure notification
}

// SendGrid sender config
const SENDGRID_FROM = {
  email: 'contact@tomodachitours.com',
  name: 'Tomodachi Tours'
}

// Validation schema for manage booking request
const manageBookingRequestSchema = z.object({
  booking_id: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
  admin_id: z.string().min(1),
  rejection_reason: z.string().optional()
})

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
 * Send booking request status notification emails
 */
async function sendStatusNotificationEmails(
  supabase: any, 
  booking: any, 
  tourDetails: any, 
  action: string, 
  rejectionReason?: string,
  paymentError?: string
) {
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
        let templateId: string;
        let templateData: any = {
          bookingId: booking.id.toString(),
          tourName: escapeHandlebars(tourDetails.name),
          tourDate: escapeHandlebars(formattedDate),
          tourTime: escapeHandlebars(booking.booking_time),
          adults: booking.adults,
          children: booking.children || 0,
          infants: booking.infants || 0,
          totalAmount: `¥${totalAmountFormatted}`,
          customerName: escapeHandlebars(booking.customer_name),
          meetingPoint: {
            location: escapeHandlebars(tourDetails.meetingPoint.location),
            google_maps_url: tourDetails.meetingPoint.google_maps_url,
            additional_info: escapeHandlebars(tourDetails.meetingPoint.additional_info || '')
          }
        };

        // Determine template and data based on action
        if (action === 'approve') {
          templateId = SENDGRID_TEMPLATES.REQUEST_APPROVED;
        } else if (action === 'reject') {
          templateId = SENDGRID_TEMPLATES.REQUEST_REJECTED;
          templateData.rejectionReason = escapeHandlebars(rejectionReason || 'No specific reason provided');
        } else if (action === 'payment_failed') {
          templateId = SENDGRID_TEMPLATES.PAYMENT_FAILED;
          templateData.paymentError = escapeHandlebars(paymentError || 'Payment processing failed');
        }

        // Send customer notification email
        await sgMail.send({
          to: booking.customer_email,
          from: SENDGRID_FROM,
          template_id: templateId,
          personalizations: [{
            to: [{ email: booking.customer_email }],
            dynamic_template_data: templateData
          }]
        });

        // Send admin notification for payment failures
        if (action === 'payment_failed') {
          const adminEmails = [
            'spirivincent03@gmail.com',
            'contact@tomodachitours.com',
            'yutaka.m@tomodachitours.com'
          ];

          const adminNotificationData = {
            ...templateData,
            customerEmail: escapeHandlebars(booking.customer_email),
            customerPhone: escapeHandlebars(booking.customer_phone || ''),
            paymentMethodId: booking.payment_method_id,
            errorDetails: escapeHandlebars(paymentError || 'Unknown payment error')
          };

          const personalizations = adminEmails.map(email => ({
            to: [{ email: email }],
            dynamic_template_data: adminNotificationData
          }));

          try {
            await sgMail.send({
              from: SENDGRID_FROM,
              template_id: SENDGRID_TEMPLATES.ADMIN_PAYMENT_FAILED,
              personalizations: personalizations
            });
            console.log(`✅ Successfully sent admin payment failure notifications for booking ${booking.id}`);
          } catch (emailError) {
            console.error(`❌ Failed to send admin payment failure notifications:`, emailError);
          }
        }

        emailSent = true;
        console.log(`Booking request ${action} notification emails sent successfully via SendGrid`);
      } catch (sendgridError) {
        console.error('SendGrid failed:', sendgridError);

        // Check if it's a credits exceeded error
        if (sendgridError.response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
          console.error('SendGrid credits exceeded - need to upgrade plan or add credits');
        }
      }
    }

    // If SendGrid failed or isn't configured, log the details for manual follow-up
    if (!emailSent) {
      console.log('EMAIL SERVICE UNAVAILABLE - MANUAL FOLLOW-UP REQUIRED');
      console.log(`Booking Request ${action.toUpperCase()} Details for Manual Email:`);
      console.log(`- Booking ID: ${booking.id}`);
      console.log(`- Customer: ${booking.customer_name} (${booking.customer_email})`);
      console.log(`- Tour: ${tourDetails.name}`);
      console.log(`- Date: ${formattedDate} at ${booking.booking_time}`);
      console.log(`- Participants: ${booking.adults} adults, ${booking.children || 0} children`);
      console.log(`- Amount: ¥${totalAmountFormatted}`);
      console.log(`- Action: ${action}`);
      if (rejectionReason) console.log(`- Rejection Reason: ${rejectionReason}`);
      if (paymentError) console.log(`- Payment Error: ${paymentError}`);

      // Store failed email attempt in database for follow-up
      try {
        await supabase
          .from('email_failures')
          .insert({
            booking_id: booking.id,
            customer_email: booking.customer_email,
            email_type: `booking_request_${action}`,
            failure_reason: 'SendGrid unavailable or credits exceeded',
            booking_details: {
              tourName: tourDetails.name,
              tourDate: formattedDate,
              tourTime: booking.booking_time,
              adults: booking.adults,
              children: booking.children || 0,
              totalAmount: `¥${totalAmountFormatted}`,
              action: action,
              rejectionReason: rejectionReason,
              paymentError: paymentError,
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
    console.error(`Failed to send booking request ${action} emails:`, error);
    // Don't throw error as the main action was successful
  }
}

/**
 * Process payment for approved booking request
 */
async function processApprovedPayment(supabase: any, booking: any): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Processing payment for approved booking request ${booking.id}`);

    if (!booking.payment_method_id) {
      throw new Error('No payment method stored for this booking request');
    }

    // Initialize payment services
    const paymentService = new PaymentProviderService(supabase);
    const stripeService = new StripeService();

    // Process payment using stored payment method
    const paymentResult = await stripeService.processImmediatePayment(
      booking.total_amount,
      booking.id,
      booking.payment_method_id
    );

    console.log('Payment result:', paymentResult);

    // Log payment attempt
    await paymentService.logPaymentAttempt(
      booking.id, 
      'stripe', 
      booking.total_amount, 
      paymentResult.status === 'succeeded' ? 'success' : 'failed',
      paymentResult.status !== 'succeeded' ? `Payment status: ${paymentResult.status}` : undefined,
      1
    );

    if (paymentResult.status === 'succeeded') {
      // Update booking to CONFIRMED status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          payment_provider: 'stripe',
          charge_id: paymentResult.id,
          stripe_payment_intent_id: paymentResult.id,
          paid_amount: booking.total_amount,
          admin_reviewed_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Failed to update booking status after successful payment:', updateError);
        return { success: false, error: 'Failed to update booking status after payment' };
      }

      console.log(`✅ Payment successful for booking ${booking.id}`);
      return { success: true };
    } else {
      // Payment requires action or failed
      const errorMessage = `Payment not completed. Status: ${paymentResult.status}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate request data
 */
async function validateRequest(req: Request): Promise<{ data: any | null; error: string | null }> {
  try {
    const body = await req.json();
    const result = manageBookingRequestSchema.safeParse(body);

    if (!result.success) {
      return {
        data: null,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }

    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to parse request body'
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    console.log('Received manage booking request')

    // Validate request data
    const { data, error } = await validateRequest(req)
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    console.log(`Processing ${data.action} action for booking ${data.booking_id}`)

    // Fetch booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data.booking_id)
      .single()

    if (fetchError || !booking) {
      console.error('Failed to fetch booking:', fetchError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Booking not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate booking status
    if (booking.status !== 'PENDING_CONFIRMATION') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Booking is not in PENDING_CONFIRMATION status. Current status: ${booking.status}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get tour details for emails
    const tourDetails = await getTourDetails(supabase, booking.tour_type);

    if (data.action === 'approve') {
      // Process payment for approved request
      const paymentResult = await processApprovedPayment(supabase, booking);

      if (paymentResult.success) {
        // Log approval event
        try {
          await supabase
            .from('booking_request_events')
            .insert({
              booking_id: booking.id,
              event_type: 'approved',
              event_data: {
                admin_id: data.admin_id,
                payment_processed: true,
                total_amount: booking.total_amount
              },
              created_by: data.admin_id
            });
        } catch (eventError) {
          console.error('Failed to log approval event:', eventError);
        }

        // Send approval notification emails
        await sendStatusNotificationEmails(supabase, booking, tourDetails, 'approve');

        console.log(`Booking request ${booking.id} approved and payment processed successfully`)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Booking request approved and payment processed successfully',
            booking_id: booking.id,
            status: 'CONFIRMED'
          }),
          {
            headers: addSecurityHeaders(new Headers({
              ...corsHeaders,
              'Content-Type': 'application/json'
            }))
          }
        )
      } else {
        // Payment failed - keep booking in PENDING_CONFIRMATION status
        // Log payment failure event
        try {
          await supabase
            .from('booking_request_events')
            .insert({
              booking_id: booking.id,
              event_type: 'payment_failed',
              event_data: {
                admin_id: data.admin_id,
                payment_error: paymentResult.error,
                total_amount: booking.total_amount
              },
              created_by: data.admin_id
            });
        } catch (eventError) {
          console.error('Failed to log payment failure event:', eventError);
        }

        // Send payment failure notification emails
        await sendStatusNotificationEmails(supabase, booking, tourDetails, 'payment_failed', undefined, paymentResult.error);

        console.error(`Payment failed for booking request ${booking.id}: ${paymentResult.error}`)

        return new Response(
          JSON.stringify({
            success: false,
            error: `Payment processing failed: ${paymentResult.error}`,
            booking_id: booking.id,
            status: 'PENDING_CONFIRMATION'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

    } else if (data.action === 'reject') {
      // Update booking to REJECTED status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'REJECTED',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: data.admin_id,
          rejection_reason: data.rejection_reason || 'No specific reason provided'
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Failed to update booking status:', updateError)
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

      // Log rejection event
      try {
        await supabase
          .from('booking_request_events')
          .insert({
            booking_id: booking.id,
            event_type: 'rejected',
            event_data: {
              admin_id: data.admin_id,
              rejection_reason: data.rejection_reason || 'No specific reason provided'
            },
            created_by: data.admin_id
          });
      } catch (eventError) {
        console.error('Failed to log rejection event:', eventError);
      }

      // Send rejection notification emails
      await sendStatusNotificationEmails(supabase, booking, tourDetails, 'reject', data.rejection_reason);

      console.log(`Booking request ${booking.id} rejected successfully`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking request rejected successfully',
          booking_id: booking.id,
          status: 'REJECTED'
        }),
        {
          headers: addSecurityHeaders(new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json'
          }))
        }
      )
    }

    // Invalid action
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Manage booking request processing error:', error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-booking-request' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "booking_id": 123,
      "action": "approve",
      "admin_id": "admin_user_123"
    }'

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/manage-booking-request' \
    --header 'Authorization: Bearer [ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "booking_id": 123,
      "action": "reject",
      "admin_id": "admin_user_123",
      "rejection_reason": "Tour unavailable on requested date"
    }'

*/