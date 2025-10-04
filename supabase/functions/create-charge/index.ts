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
// import { withRateLimit } from '../rate-limit-middleware/wrapper.ts' // Temporarily disabled for debugging
import sgMail from "npm:@sendgrid/mail"
import { PaymentProviderService } from '../_shared/payment-provider-service.ts'
import { StripeService } from '../_shared/stripe-service.ts'

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

    // Get proper tour name and meeting point from database
    const { name: tourName, meetingPoint } = await getTourName(supabase, booking.tour_type);

    // Ensure we have a valid paid amount - use paid_amount if available, otherwise calculate from tour pricing
    let paidAmount = booking.paid_amount;

    if (!paidAmount || paidAmount <= 0) {
      console.error(`ERROR: Invalid paid_amount for booking ${booking.id}: ${paidAmount}`);
      console.error('Full booking data:', JSON.stringify(booking, null, 2));

      // Calculate fallback amount from tour pricing (6500 yen per adult/child)
      const fallbackAmount = 6500 * (booking.adults + (booking.children || 0));
      const discountedAmount = booking.discount_amount ? fallbackAmount - booking.discount_amount : fallbackAmount;

      console.error(`Using fallback calculation: ${fallbackAmount} - ${booking.discount_amount || 0} = ${discountedAmount}`);
      paidAmount = Math.max(discountedAmount, 0); // Ensure it's not negative

      // Log this critical issue for investigation
      console.error(`CRITICAL: Booking ${booking.id} has invalid paid_amount. Using fallback: ${paidAmount} yen`);
    }

    const totalAmountFormatted = paidAmount.toLocaleString();

    // Try SendGrid first, then fallback to simple email if it fails
    let emailSent = false;

    if (SENDGRID_API_KEY) {
      try {
        // Send customer confirmation email using the same format as refund emails
        await sgMail.send({
          to: booking.customer_email,
          from: SENDGRID_FROM,
          templateId: SENDGRID_TEMPLATES.BOOKING_CONFIRMATION,
          personalizations: [{
            to: [{ email: booking.customer_email }],
            dynamicTemplateData: {
              bookingId: booking.id.toString(),
              tourName: escapeHandlebars(tourName),
              tourDate: escapeHandlebars(formattedDate),
              tourTime: escapeHandlebars(booking.booking_time),
              adults: booking.adults,
              children: booking.children || 0,
              infants: booking.infants || 0,
              totalAmount: `¥${totalAmountFormatted}`,
              meetingPoint: {
                location: escapeHandlebars(meetingPoint.location),
                google_maps_url: meetingPoint.google_maps_url,
                additional_info: escapeHandlebars(meetingPoint.additional_info || '')
              }
            }
          }]
        });

        // Send company notification emails to all three addresses
        const now = new Date();
        const companyEmails = [
          'spirivincent03@gmail.com',
          'contact@tomodachitours.com',
          'yutaka.m@tomodachitours.com'
        ];

        const notificationData = {
          bookingId: booking.id.toString(),
          productBookingRef: '',
          extBookingRef: '',
          productId: booking.tour_type,
          tourName: escapeHandlebars(tourName),
          customerName: escapeHandlebars(booking.customer_name),
          customerEmail: escapeHandlebars(booking.customer_email),
          customerPhone: escapeHandlebars(booking.customer_phone || ''),
          tourDate: escapeHandlebars(formattedDate),
          tourTime: escapeHandlebars(booking.booking_time),
          adults: booking.adults,
          adultPlural: booking.adults > 1,
          children: booking.children || 0,
          infants: booking.infants || 0,
          createdDate: escapeHandlebars(now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' })),
          createdTime: escapeHandlebars(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
          meetingPoint: {
            location: escapeHandlebars(meetingPoint.location),
            google_maps_url: meetingPoint.google_maps_url, // URLs don't need escaping
            additional_info: escapeHandlebars(meetingPoint.additional_info || '')
          }
        };

        // Send company notification emails using the same format as refund emails
        const personalizations = companyEmails.map(email => ({
          to: [{ email: email }],
          dynamic_template_data: {
            ...notificationData,
            totalAmount: `¥${totalAmountFormatted}`
          }
        }));

        try {
          console.log(`Attempting to send notifications to company emails`);
          await sgMail.send({
            from: SENDGRID_FROM,
            templateId: SENDGRID_TEMPLATES.BOOKING_NOTIFICATION,
            personalizations: personalizations
          });
          console.log(`✅ Successfully sent notifications to all company emails`);
        } catch (emailError) {
          console.error(`❌ Failed to send company notifications:`, emailError);
          if (emailError instanceof Error && 'response' in emailError) {
            console.error(`Response body:`, (emailError as any).response?.body);
          }
        }

        emailSent = true;
        console.log('Booking confirmation emails sent successfully via SendGrid');
      } catch (sendgridError) {
        console.error('SendGrid failed:', sendgridError);

        // Check if it's a credits exceeded error
        if (sendgridError instanceof Error && 'response' in sendgridError) {
          const response = (sendgridError as any).response;
          if (response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
            console.error('SendGrid credits exceeded - need to upgrade plan or add credits');
          }
        }

        // Continue to fallback method
      }
    }

    // If SendGrid failed or isn't configured, log the booking details for manual follow-up
    if (!emailSent) {
      console.log('EMAIL SERVICE UNAVAILABLE - MANUAL FOLLOW-UP REQUIRED');
      console.log('Booking Details for Manual Email:');
      console.log(`- Booking ID: ${booking.id}`);
      console.log(`- Customer: ${booking.customer_name} (${booking.customer_email})`);
      console.log(`- Tour: ${tourName}`);
      console.log(`- Date: ${formattedDate} at ${booking.booking_time}`);
      console.log(`- Participants: ${booking.adults} adults, ${booking.children || 0} children`);
      console.log(`- Amount: ¥${totalAmountFormatted}`);
      console.log('- Meeting Point:', meetingPoint.location);

      // Store failed email attempt in database for follow-up
      try {
        await supabase
          .from('email_failures')
          .insert({
            booking_id: booking.id,
            customer_email: booking.customer_email,
            email_type: 'booking_confirmation',
            failure_reason: 'SendGrid credits exceeded',
            booking_details: {
              tourName,
              tourDate: formattedDate,
              tourTime: booking.booking_time,
              adults: booking.adults,
              children: booking.children || 0,
              totalAmount: `¥${totalAmountFormatted}`,
              meetingPoint
            },
            created_at: new Date().toISOString()
          });
        console.log('Email failure logged for manual follow-up');
      } catch (logError) {
        console.error('Failed to log email failure:', logError);
      }
    }

  } catch (error) {
    console.error('Failed to send booking emails:', error);
    // Don't throw error as payment was successful
  }
}

/**
 * Trigger Bokun sync via separate Edge Function (async, non-blocking)
 */
async function triggerBokunSync(bookingId: number) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      console.log('Supabase configuration not available for Bokun sync')
      return
    }

    // Call the sync-bokun-booking Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-bokun-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ bookingId })
    })

    if (!response.ok) {
      console.error('Failed to trigger Bokun sync:', await response.text())
    } else {
      console.log(`Bokun sync triggered for booking ${bookingId}`)
    }

  } catch (error) {
    console.error('Error triggering Bokun sync:', error)
    // Don't throw - this is a background operation
  }
}

/**
 * Process payment with Stripe
 */
async function processStripePayment(data: any): Promise<any> {
  if (!data.payment_method_id) {
    throw new Error('Stripe payment requires payment_method_id');
  }

  const stripeService = new StripeService();

  try {
    // Process immediate payment with the payment method ID from frontend
    const paymentResult = await stripeService.processImmediatePayment(
      data.amount,
      data.bookingId,
      data.payment_method_id,
      data.discountCode,
      data.originalAmount
    );

    console.log('Stripe payment result:', paymentResult);

    // Accept both 'succeeded' and 'requires_action' status
    // 'requires_action' will be handled by frontend (3D Secure, etc.)
    if (paymentResult.status === 'succeeded' || paymentResult.status === 'requires_action') {
      return paymentResult;
    } else {
      throw new Error(`Stripe payment failed with status: ${paymentResult.status}`);
    }
  } catch (error) {
    console.error('Stripe payment processing error:', error);
    throw error;
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

    // Initialize services
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const paymentService = new PaymentProviderService(supabase)
    const primaryProvider = paymentService.getPrimaryProvider()

    let paymentResult: any = null

    // Process payment with configured provider
    try {
      console.log(`Processing payment with provider: ${primaryProvider}`)

      if (primaryProvider === 'stripe') {
        paymentResult = await processStripePayment(data)
      } else {
        throw new Error('Only Stripe payment provider is supported')
      }

      await paymentService.logPaymentAttempt(data.bookingId, primaryProvider, data.amount, 'success', undefined, 1)
      console.log(`Payment successful with ${primaryProvider}`)
    } catch (paymentError) {
      console.error(`Payment failed with ${primaryProvider}:`, paymentError)
      await paymentService.logPaymentAttempt(data.bookingId, primaryProvider, data.amount, 'failed', paymentError instanceof Error ? paymentError.message : 'Unknown error', 1)
      throw paymentError
    }

    // Handle different payment statuses
    if (paymentResult.status === 'requires_action') {
      // For requires_action, don't update booking status yet - keep it as PENDING_PAYMENT
      // Just store the payment intent ID for later confirmation
      const updateData: any = {
        payment_provider: primaryProvider,
        stripe_payment_intent_id: paymentResult.id,
        paid_amount: data.amount
      }

      console.log(`Payment requires action for booking ${data.bookingId}, storing payment intent: ${paymentResult.id}`);

      const { error: bookingError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', data.bookingId)

      if (bookingError) {
        console.error('Failed to update booking with payment intent:', bookingError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to store payment intent'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Return response with client_secret for 3D Secure
      return new Response(
        JSON.stringify({
          success: true,
          requires_action: true,
          payment_intent: {
            id: paymentResult.id,
            client_secret: paymentResult.client_secret,
            status: paymentResult.status
          },
          provider_used: primaryProvider
        }),
        {
          headers: addSecurityHeaders(new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json'
          }))
        }
      )
    }

    // For succeeded payments, update booking to CONFIRMED
    const updateData: any = {
      status: 'CONFIRMED',
      payment_provider: primaryProvider,
      backup_payment_used: false,
      paid_amount: data.amount // Store the actual amount paid (after discounts)
    }

    if (primaryProvider === 'stripe') {
      updateData.charge_id = paymentResult.id // Store Stripe payment intent ID in charge_id for compatibility
      updateData.stripe_payment_intent_id = paymentResult.id // Also store in specific Stripe field for future use
    }

    console.log(`Updating booking ${data.bookingId} with paid_amount: ${data.amount}`);

    const { error: bookingError } = await supabase
      .from('bookings')
      .update(updateData)
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
      console.log(`Fetched booking for email - paid_amount: ${booking.paid_amount}, status: ${booking.status}`);
      // Send confirmation emails
      await sendBookingEmails(supabase, booking)

      // Trigger Bokun sync (async, don't block payment completion)
      triggerBokunSync(booking.id).catch(error => {
        console.error('Failed to trigger Bokun sync:', error)
        // Log error but don't fail the payment process
      })
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
          id: paymentResult.id,
          amount: paymentResult.amount,
          status: paymentResult.status
        },
        backup_used: false,
        provider_used: primaryProvider
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
