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
import { BookingRequestLogger, BookingRequestEventType } from '../_shared/booking-request-logger.ts'
import { AdminNotificationService } from '../_shared/admin-notification-service.ts'
import { BookingRequestErrorHandler } from '../_shared/error-handler.ts'
import { RetryService } from '../_shared/retry-service.ts'

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
const SENDGRID_TEMPLATES = {
  REQUEST_APPROVED: 'd-80e109cadad44eeab06c1b2396b504b2', // Customer approval notification (reuse existing booking confirmation)
  REQUEST_REJECTED: 'd-236d283e8a5a4271995de8ec5064c49b', // Customer rejection notification
  PAYMENT_FAILED: 'd-0cafd30a53044f2fb64d676a9964d982', // Customer payment failure notification
  ADMIN_PAYMENT_FAILED: 'd-752cc6754d7148c99dbec67c462db656' // Admin payment failure notification
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
        let templateId: string = '';
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
          templateId: templateId,
          personalizations: [{
            to: [{ email: booking.customer_email }],
            dynamicTemplateData: templateData
          }]
        } as any);

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
            dynamicTemplateData: adminNotificationData
          }));

          try {
            await sgMail.send({
              from: SENDGRID_FROM,
              templateId: SENDGRID_TEMPLATES.ADMIN_PAYMENT_FAILED,
              personalizations: personalizations
            } as any);
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
        if (sendgridError instanceof Error && 'response' in sendgridError) {
          const response = (sendgridError as any).response;
          if (response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
            console.error('SendGrid credits exceeded - need to upgrade plan or add credits');
          }
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
 * Process payment for approved booking request with enhanced error handling
 */
async function processApprovedPaymentWithErrorHandling(
  supabase: any, 
  booking: any,
  logger: BookingRequestLogger,
  errorHandler: BookingRequestErrorHandler,
  correlationId: string
): Promise<{ success: boolean; error?: string; shouldRetry?: boolean }> {
  try {
    console.log(`[${correlationId}] Processing payment for approved booking request ${booking.id}`);

    if (!booking.payment_method_id) {
      const error = new Error('No payment method stored for this booking request');
      await logger.logPaymentFailed(
        booking.id,
        booking.total_amount,
        error.message,
        'MISSING_PAYMENT_METHOD'
      );
      return { success: false, error: error.message, shouldRetry: false };
    }

    // Initialize payment services
    const paymentService = new PaymentProviderService(supabase);
    const stripeService = new StripeService();

    // Log payment processing start
    await logger.logPaymentProcessing(
      booking.id,
      booking.total_amount,
      booking.payment_method_id
    );

    // Process payment with retry logic
    const paymentResult = await RetryService.retryPaymentProcessing(
      async () => {
        const result = await stripeService.processImmediatePayment(
          booking.total_amount,
          booking.id,
          booking.payment_method_id
        );

        if (result.status !== 'succeeded' && result.status !== 'requires_action') {
          throw new Error(`Payment not completed. Status: ${result.status}`);
        }

        return result;
      },
      booking.id
    );

    // Log payment attempt
    await paymentService.logPaymentAttempt(
      booking.id, 
      'stripe', 
      booking.total_amount, 
      paymentResult.success ? 'success' : 'failed',
      paymentResult.success ? undefined : paymentResult.error?.message,
      paymentResult.attempts
    );

    if (paymentResult.success && paymentResult.result) {
      const result = paymentResult.result;
      
      // Update booking to CONFIRMED status with retry
      const updateResult = await RetryService.retryDatabaseOperation(
        async () => {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'CONFIRMED',
              payment_provider: 'stripe',
              charge_id: result.id,
              stripe_payment_intent_id: result.id,
              paid_amount: booking.total_amount,
              admin_reviewed_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          return true;
        },
        'update-booking-status'
      );

      if (!updateResult.success) {
        await errorHandler.handleDatabaseError(
          updateResult.error || new Error('Unknown database error'),
          'update_booking_status_after_payment',
          {
            bookingId: booking.id,
            operation: 'update_booking_status_after_payment',
            correlationId,
            metadata: {
              payment_intent_id: result.id,
              amount: booking.total_amount
            }
          }
        );

        return { success: false, error: 'Failed to update booking status after payment' };
      }

      // Log successful payment
      await logger.logPaymentSuccess(
        booking.id,
        booking.total_amount,
        result.id,
        paymentResult.attempts - 1
      );

      console.log(`[${correlationId}] ✅ Payment successful for booking ${booking.id}`);
      return { success: true };
    } else {
      // Payment failed after retries
      const error = paymentResult.error || new Error('Unknown payment error');
      
      await logger.logPaymentFailed(
        booking.id,
        booking.total_amount,
        error.message,
        'PAYMENT_PROCESSING_FAILED',
        paymentResult.attempts - 1
      );

      // Handle payment error with admin notification
      const errorResult = await errorHandler.handlePaymentError(
        error,
        booking.id,
        booking.payment_method_id,
        booking.total_amount,
        booking.customer_email,
        paymentResult.attempts - 1
      );

      return { 
        success: false, 
        error: error.message,
        shouldRetry: errorResult.shouldRetry
      };
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[${correlationId}] Payment processing error:`, err);
    
    await logger.logPaymentFailed(
      booking.id,
      booking.total_amount,
      err.message,
      'PAYMENT_EXCEPTION'
    );

    // Handle the error with potential retry logic
    const errorResult = await errorHandler.handlePaymentError(
      err,
      booking.id,
      booking.payment_method_id,
      booking.total_amount,
      booking.customer_email
    );

    return { 
      success: false, 
      error: err.message,
      shouldRetry: errorResult.shouldRetry
    };
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
  // Initialize services
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )
  
  const logger = new BookingRequestLogger(supabase)
  const adminNotificationService = new AdminNotificationService(supabase, {
    adminEmails: [
      'spirivincent03@gmail.com',
      'contact@tomodachitours.com',
      'yutaka.m@tomodachitours.com'
    ],
    sendgridApiKey: SENDGRID_API_KEY,
    fromEmail: SENDGRID_FROM.email,
    fromName: SENDGRID_FROM.name
  })
  const errorHandler = new BookingRequestErrorHandler(supabase, adminNotificationService)

  // Generate correlation ID for request tracking
  const correlationId = `manage-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  logger.setCorrelationId(correlationId)

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    console.log(`[${correlationId}] Received manage booking request`)

    // Validate request data
    const { data, error } = await validateRequest(req)
    if (error) {
      console.error('Validation error:', error)
      
      await logger.logEvent(
        0, // No booking ID yet
        BookingRequestEventType.VALIDATION_ERROR,
        `Request validation failed: ${error}`,
        { validation_error: error, correlation_id: correlationId }
      )
      
      return new Response(
        JSON.stringify({ success: false, error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!data) {
      await logger.logEvent(
        0,
        BookingRequestEventType.VALIDATION_ERROR,
        'Invalid request data - no data provided',
        { correlation_id: correlationId }
      )
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[${correlationId}] Processing ${data.action} action for booking ${data.booking_id}`)

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
      // Process payment for approved request with enhanced error handling
      const paymentResult = await processApprovedPaymentWithErrorHandling(
        supabase, 
        booking, 
        logger, 
        errorHandler, 
        correlationId
      );

      if (paymentResult.success) {
        // Log approval event
        await logger.logRequestApproved(
          booking.id,
          data.admin_id,
          booking.total_amount
        );

        // Send approval notification emails with error handling
        const emailResult = await RetryService.retryEmailSending(
          async () => {
            await sendStatusNotificationEmails(supabase, booking, tourDetails, 'approve');
            return true;
          },
          'approval-notification',
          booking.id
        );

        if (emailResult.success) {
          await logger.logEmailSent(
            booking.id,
            'booking_request_approved',
            booking.customer_email
          );
        } else {
          await errorHandler.handleEmailError(
            emailResult.error || new Error('Unknown email error'),
            booking.id,
            'booking_request_approved',
            booking.customer_email,
            emailResult.attempts - 1
          );
        }

        console.log(`[${correlationId}] Booking request ${booking.id} approved and payment processed successfully`)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Booking request approved and payment processed successfully',
            booking_id: booking.id,
            status: 'CONFIRMED',
            correlation_id: correlationId
          }),
          {
            headers: addSecurityHeaders(new Headers({
              ...corsHeaders,
              'Content-Type': 'application/json'
            }))
          }
        )
      } else {
        // Payment failed - send failure notification emails
        const emailResult = await RetryService.retryEmailSending(
          async () => {
            await sendStatusNotificationEmails(supabase, booking, tourDetails, 'payment_failed', undefined, paymentResult.error);
            return true;
          },
          'payment-failure-notification',
          booking.id
        );

        if (emailResult.success) {
          await logger.logEmailSent(
            booking.id,
            'payment_failure_notification',
            booking.customer_email
          );
        } else {
          await errorHandler.handleEmailError(
            emailResult.error || new Error('Unknown email error'),
            booking.id,
            'payment_failure_notification',
            booking.customer_email,
            emailResult.attempts - 1
          );
        }

        console.error(`[${correlationId}] Payment failed for booking request ${booking.id}: ${paymentResult.error}`)

        return new Response(
          JSON.stringify({
            success: false,
            error: `Payment processing failed: ${paymentResult.error}`,
            booking_id: booking.id,
            status: 'PENDING_CONFIRMATION',
            should_retry: paymentResult.shouldRetry,
            correlation_id: correlationId
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

    } else if (data.action === 'reject') {
      // Update booking to REJECTED status with retry
      const updateResult = await RetryService.retryDatabaseOperation(
        async () => {
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
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          return true;
        },
        'reject-booking-request'
      );

      if (!updateResult.success) {
        await errorHandler.handleDatabaseError(
          updateResult.error || new Error('Unknown database error'),
          'reject_booking_request',
          {
            bookingId: booking.id,
            operation: 'reject_booking_request',
            adminId: data.admin_id,
            correlationId,
            metadata: {
              rejection_reason: data.rejection_reason
            }
          }
        );

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to update booking status',
            correlation_id: correlationId
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Log rejection event
      await logger.logRequestRejected(
        booking.id,
        data.admin_id,
        data.rejection_reason || 'No specific reason provided'
      );

      // Send rejection notification emails with error handling
      const emailResult = await RetryService.retryEmailSending(
        async () => {
          await sendStatusNotificationEmails(supabase, booking, tourDetails, 'reject', data.rejection_reason);
          return true;
        },
        'rejection-notification',
        booking.id
      );

      if (emailResult.success) {
        await logger.logEmailSent(
          booking.id,
          'booking_request_rejected',
          booking.customer_email
        );
      } else {
        await errorHandler.handleEmailError(
          emailResult.error || new Error('Unknown email error'),
          booking.id,
          'booking_request_rejected',
          booking.customer_email,
          emailResult.attempts - 1
        );
      }

      console.log(`[${correlationId}] Booking request ${booking.id} rejected successfully`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking request rejected successfully',
          booking_id: booking.id,
          status: 'REJECTED',
          correlation_id: correlationId
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
    console.error(`[${correlationId}] Manage booking request processing error:`, error)
    
    // Handle critical system error
    await errorHandler.handleError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operation: 'manage_booking_request_handler',
        correlationId,
        metadata: {
          request_method: req.method,
          user_agent: req.headers.get('user-agent'),
          origin: req.headers.get('origin')
        }
      },
      { 
        severity: 'CRITICAL', 
        notifyAdmins: true,
        enableRetry: false // Don't retry the entire handler
      }
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: correlationId
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