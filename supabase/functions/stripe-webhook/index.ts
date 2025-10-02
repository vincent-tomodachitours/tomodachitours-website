// @ts-ignore - ESM imports work in Deno runtime
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
// @ts-ignore - ESM imports work in Deno runtime  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";
import sgMail from "npm:@sendgrid/mail";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2024-11-20'
});

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();



const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
          template_id: SENDGRID_TEMPLATES.BOOKING_CONFIRMATION,
          personalizations: [{
            to: [{ email: booking.customer_email }],
            dynamic_template_data: {
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
            template_id: SENDGRID_TEMPLATES.BOOKING_NOTIFICATION,
            personalizations: personalizations
          });
          console.log(`✅ Successfully sent notifications to all company emails`);
        } catch (emailError) {
          console.error(`❌ Failed to send company notifications:`, emailError);
          if (emailError.response) {
            console.error(`Response body:`, emailError.response.body);
          }
        }

        emailSent = true;
        console.log('Booking confirmation emails sent successfully via SendGrid');
      } catch (sendgridError) {
        console.error('SendGrid failed:', sendgridError);

        // Check if it's a credits exceeded error
        if (sendgridError.response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
          console.error('SendGrid credits exceeded - need to upgrade plan or add credits');
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

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }



    try {
        // Get the raw body and signature
        const body = await req.text();
        const signature = req.headers.get('Stripe-Signature');

        if (!signature) {
            console.error('No Stripe signature provided');
            return new Response(
                JSON.stringify({ error: 'No signature provided' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Check for test mode (bypass signature verification)
        const isTestMode = req.headers.get('X-Test-Mode') === 'true';

        let event: Stripe.Event;

        if (isTestMode) {
            console.log('🧪 Test mode: Bypassing signature verification');
            try {
                event = JSON.parse(body);
            } catch (err) {
                console.error('Invalid JSON in test mode:', err.message);
                return new Response(
                    JSON.stringify({ error: 'Invalid JSON' }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                );
            }
        } else {
            // Verify webhook signature using Stripe SDK
            try {
                event = await stripe.webhooks.constructEventAsync(
                    body,
                    signature,
                    Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
                    undefined,
                    cryptoProvider
                );
            } catch (err) {
                console.error('Stripe webhook signature verification failed:', err.message);
                return new Response(
                    JSON.stringify({ error: 'Invalid signature' }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                );
            }
        }
        console.log(`Received Stripe webhook: ${event.type}`);

        // Process different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'checkout.session.expired':
                await handleCheckoutExpired(event.data.object);
                break;
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'payment_intent.requires_action':
                await handlePaymentRequiresAction(event.data.object);
                break;
            case 'charge.dispute.created':
                await handleDisputeCreated(event.data.object);
                break;
            case 'refund.created':
                await handleRefundCreated(event.data.object);
                break;
            default:
                console.log(`Unhandled Stripe webhook event type: ${event.type}`);
        }

        return new Response(
            JSON.stringify({ success: true, processed: event.type }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Stripe webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: 'Processing failed', details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});



/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment succeeded for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Update booking status if it's not already confirmed
        // First get the current booking to preserve paid_amount
        const { data: currentBooking } = await supabase
            .from('bookings')
            .select('paid_amount')
            .eq('id', parseInt(bookingId))
            .single();

        const updateData: any = {
            status: 'CONFIRMED',
            stripe_payment_intent_id: paymentIntent.id,
            payment_provider: 'stripe'
        };

        // Preserve paid_amount if it exists, otherwise set from payment intent
        if (currentBooking?.paid_amount) {
            // Keep existing paid_amount
            console.log(`Preserving existing paid_amount: ${currentBooking.paid_amount}`);
        } else {
            // Set paid_amount from payment intent amount (convert from cents to yen)
            updateData.paid_amount = paymentIntent.amount;
            console.log(`Setting paid_amount from payment intent: ${paymentIntent.amount}`);
        }

        const { error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', parseInt(bookingId))
            .eq('status', 'PENDING_PAYMENT'); // Only update if still pending

        if (error) {
            console.error('Error updating booking after successful payment:', error);
        } else {
            console.log(`Booking ${bookingId} confirmed via Stripe webhook`);
            
            // Fetch complete booking details for email sending
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', parseInt(bookingId))
                .single();

            if (fetchError || !booking) {
                console.error('Failed to fetch booking details for email:', fetchError);
            } else {
                console.log(`Fetched booking details for email - paid_amount: ${booking.paid_amount}, status: ${booking.status}`);
                
                // Send confirmation emails
                await sendBookingEmails(supabase, booking);
                
                // Trigger Bokun sync (async, don't block webhook processing)
                triggerBokunSync(booking.id).catch(error => {
                    console.error('Failed to trigger Bokun sync:', error);
                    // Log error but don't fail the webhook process
                });
            }
        }
    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment failed for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Log the payment attempt as failed
        const { error } = await supabase
            .from('payment_attempts')
            .insert({
                booking_id: parseInt(bookingId),
                provider_attempted: 'stripe',
                amount: paymentIntent.amount,
                status: 'failed',
                error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
                attempt_order: 1
            });

        if (error) {
            console.error('Error logging failed payment attempt:', error);
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

/**
 * Handle payment requiring action (3D Secure, etc.)
 */
async function handlePaymentRequiresAction(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment requires action for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Could send notification to customer or log for follow-up
        // For now, just log it
    } catch (error) {
        console.error('Error handling payment requires action:', error);
    }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: any) {
    try {
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in checkout session metadata');
            return;
        }

        console.log(`Checkout completed for booking ${bookingId}, session: ${session.id}`);

        // Update booking status to confirmed
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'CONFIRMED',
                stripe_session_id: session.id,
                payment_provider: 'stripe'
            })
            .eq('id', parseInt(bookingId))
            .eq('status', 'PENDING_PAYMENT');

        if (error) {
            console.error('Error updating booking after checkout completion:', error);
        } else {
            console.log(`Booking ${bookingId} confirmed via checkout session`);
        }
    } catch (error) {
        console.error('Error handling checkout completed:', error);
    }
}

/**
 * Handle checkout session expired
 */
async function handleCheckoutExpired(session: any) {
    try {
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in checkout session metadata');
            return;
        }

        console.log(`Checkout expired for booking ${bookingId}, session: ${session.id}`);

        // Log the expired session
        const { error } = await supabase
            .from('payment_attempts')
            .insert({
                booking_id: parseInt(bookingId),
                provider_attempted: 'stripe',
                amount: session.amount_total,
                status: 'expired',
                error_message: 'Checkout session expired',
                attempt_order: 1
            });

        if (error) {
            console.error('Error logging expired checkout session:', error);
        }
    } catch (error) {
        console.error('Error handling checkout expired:', error);
    }
}

/**
 * Handle dispute created
 */
async function handleDisputeCreated(dispute: any) {
    try {
        const chargeId = dispute.charge;
        console.log(`Dispute created for charge ${chargeId}, dispute: ${dispute.id}`);

        // Find booking by charge ID
        const { data: booking, error: findError } = await supabase
            .from('bookings')
            .select('id')
            .eq('charge_id', chargeId)
            .single();

        if (findError || !booking) {
            console.error('Could not find booking for disputed charge:', chargeId);
            return;
        }

        // Log the dispute
        const { error } = await supabase
            .from('disputes')
            .insert({
                booking_id: booking.id,
                stripe_dispute_id: dispute.id,
                charge_id: chargeId,
                amount: dispute.amount,
                reason: dispute.reason,
                status: dispute.status,
                created_at: new Date(dispute.created * 1000).toISOString()
            });

        if (error) {
            console.error('Error logging dispute:', error);
        } else {
            console.log(`Dispute logged for booking ${booking.id}`);
        }
    } catch (error) {
        console.error('Error handling dispute created:', error);
    }
}

/**
 * Handle refund created
 */
async function handleRefundCreated(refund: any) {
    try {
        const chargeId = refund.charge;
        console.log(`Refund created for charge ${chargeId}, refund: ${refund.id}`);

        // Find booking by charge ID or payment intent ID
        const { data: booking, error: findError } = await supabase
            .from('bookings')
            .select('id')
            .or(`charge_id.eq.${chargeId},stripe_payment_intent_id.eq.${refund.payment_intent}`)
            .single();

        if (findError || !booking) {
            console.error('Could not find booking for refunded charge:', chargeId);
            return;
        }

        // Update booking status to refunded
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'CANCELLED', // Using CANCELLED to match your constraint
                refund_amount: refund.amount,
                refund_date: new Date(refund.created * 1000).toISOString()
            })
            .eq('id', booking.id);

        if (error) {
            console.error('Error updating booking after refund:', error);
        } else {
            console.log(`Booking ${booking.id} marked as refunded`);
        }
    } catch (error) {
        console.error('Error handling refund created:', error);
    }
} 