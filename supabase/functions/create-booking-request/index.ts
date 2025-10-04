/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest, bookingRequestSchema, addSecurityHeaders, sanitizeOutput } from '../validation-middleware/index.ts'
import sgMail from "npm:@sendgrid/mail"
import { BookingRequestLogger, BookingRequestEventType } from '../_shared/booking-request-logger.ts'
import { AdminNotificationService } from '../_shared/admin-notification-service.ts'
import { BookingRequestErrorHandler } from '../_shared/error-handler.ts'
import { RetryService } from '../_shared/retry-service.ts'

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
const SENDGRID_TEMPLATES = {
  REQUEST_CONFIRMATION: 'd-ab9af3697fa443a6a248b787da1c4533', // Customer confirmation template
  ADMIN_NOTIFICATION: 'd-e3a27de126df45908ad6036088fb9c15' // Admin notification template
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
 * Send booking request confirmation emails with enhanced error handling
 */
async function sendRequestEmailsWithErrorHandling(
  supabase: any, 
  booking: any, 
  tourDetails: any, 
  logger: BookingRequestLogger,
  errorHandler: BookingRequestErrorHandler,
  correlationId: string
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

    if (SENDGRID_API_KEY) {
      // Send customer confirmation email with retry
      const customerEmailResult = await RetryService.retryEmailSending(
        async () => {
          await sgMail.send({
            to: booking.customer_email,
            from: SENDGRID_FROM,
            templateId: SENDGRID_TEMPLATES.REQUEST_CONFIRMATION,
            personalizations: [{
              to: [{ email: booking.customer_email }],
              dynamicTemplateData: {
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
          return true;
        },
        'customer-confirmation',
        booking.id
      );

      if (customerEmailResult.success) {
        await logger.logEmailSent(
          booking.id,
          'booking_request_confirmation',
          booking.customer_email,
          SENDGRID_TEMPLATES.REQUEST_CONFIRMATION
        );
      } else {
        await errorHandler.handleEmailError(
          customerEmailResult.error || new Error('Unknown email error'),
          booking.id,
          'booking_request_confirmation',
          booking.customer_email,
          customerEmailResult.attempts - 1
        );
      }

      // Send admin notification emails with retry
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

      const adminEmailResult = await RetryService.retryEmailSending(
        async () => {
          const personalizations = adminEmails.map(email => ({
            to: [{ email: email }],
            dynamicTemplateData: adminNotificationData
          }));

          await sgMail.send({
            from: SENDGRID_FROM,
            templateId: SENDGRID_TEMPLATES.ADMIN_NOTIFICATION,
            personalizations: personalizations
          } as any);
          return true;
        },
        'admin-notification',
        booking.id
      );

      if (adminEmailResult.success) {
        await logger.logEmailSent(
          booking.id,
          'admin_booking_request_notification',
          adminEmails.join(', '),
          SENDGRID_TEMPLATES.ADMIN_NOTIFICATION
        );
        console.log(`[${correlationId}] ✅ Successfully sent admin notifications for booking request ${booking.id}`);
      } else {
        await errorHandler.handleEmailError(
          adminEmailResult.error || new Error('Unknown email error'),
          booking.id,
          'admin_booking_request_notification',
          adminEmails.join(', '),
          adminEmailResult.attempts - 1
        );
      }

      console.log(`[${correlationId}] Booking request emails processed`);
    } else {
      // SendGrid not configured - log as system error
      await logger.logSystemError(
        booking.id,
        'email_service_configuration',
        'SendGrid API key not configured',
        'SENDGRID_NOT_CONFIGURED'
      );

      // Store failed email attempt in database for follow-up
      await supabase
        .from('email_failures')
        .insert({
          booking_id: booking.id,
          customer_email: booking.customer_email,
          email_type: 'booking_request_confirmation',
          failure_reason: 'SendGrid API key not configured',
          booking_details: {
            tourName: tourDetails.name,
            tourDate: formattedDate,
            tourTime: booking.booking_time,
            adults: booking.adults,
            children: booking.children || 0,
            totalAmount: `¥${totalAmountFormatted}`,
            status: 'PENDING_PAYMENT',
            meetingPoint: tourDetails.meetingPoint
          },
          created_at: new Date().toISOString()
        });

      console.log(`[${correlationId}] EMAIL SERVICE UNAVAILABLE - MANUAL FOLLOW-UP REQUIRED`);
    }

  } catch (error) {
    await errorHandler.handleError(
      error instanceof Error ? error : new Error(String(error)),
      {
        bookingId: booking.id,
        operation: 'send_booking_request_emails',
        customerEmail: booking.customer_email,
        correlationId,
        metadata: {
          tour_name: tourDetails.name,
          total_amount: booking.total_amount
        }
      },
      { severity: 'HIGH', notifyAdmins: true }
    );
  }
}

/**
 * Validate that the tour type is eligible for booking requests
 */
function isUjiTour(tourType: string): boolean {
  const ujiTourTypes = [
    'uji-tour', 
    'uji-walking-tour',
    'uji_tour',
    'uji_walking_tour'
  ];
  return ujiTourTypes.includes(tourType.toLowerCase());
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
  const correlationId = `booking-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  logger.setCorrelationId(correlationId)

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    console.log(`[${correlationId}] Received booking request`)

    // Validate request data
    const { data, error } = await validateRequest(req, bookingRequestSchema)
    if (error) {
      console.error('Validation error:', error)
      
      // Log validation error if we have booking context
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

    // Validate that this is a Uji tour (booking requests are only for Uji tours)
    if (!isUjiTour(data.tour_type)) {
      await logger.logEvent(
        0,
        BookingRequestEventType.VALIDATION_ERROR,
        `Invalid tour type for booking request: ${data.tour_type}`,
        { tour_type: data.tour_type, correlation_id: correlationId }
      )
      
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

    console.log(`[${correlationId}] Creating booking request...`)

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
      request_submitted_at: new Date().toISOString()
    };

    // Create booking with error handling and retry
    const bookingResult = await RetryService.retryDatabaseOperation(
      async () => {
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single()

        if (bookingError) {
          throw new Error(`Database error: ${bookingError.message}`)
        }

        return booking
      },
      'create-booking-request'
    )

    if (!bookingResult.success || !bookingResult.result) {
      const dbError = bookingResult.error || new Error('Unknown database error')
      
      await errorHandler.handleDatabaseError(
        dbError,
        'create_booking_request',
        {
          operation: 'create_booking_request',
          customerEmail: data.customer_email,
          correlationId,
          metadata: {
            tour_type: data.tour_type,
            total_amount: data.total_amount
          }
        }
      )

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

    const booking = bookingResult.result
    console.log(`[${correlationId}] Booking request created with ID: ${booking.id}`)

    // Log the booking request submission
    await logger.logRequestSubmitted(
      booking.id,
      data.customer_email,
      data.tour_type,
      data.total_amount,
      data.payment_method_id
    )

    // Get tour details for emails with error handling
    let tourDetails
    try {
      tourDetails = await getTourDetails(supabase, data.tour_type)
    } catch (tourError) {
      await errorHandler.handleError(
        tourError instanceof Error ? tourError : new Error(String(tourError)),
        {
          bookingId: booking.id,
          operation: 'get_tour_details',
          customerEmail: data.customer_email,
          correlationId,
          metadata: { tour_type: data.tour_type }
        },
        { severity: 'MEDIUM', notifyAdmins: false }
      )
      
      // Use fallback tour details
      tourDetails = {
        name: data.tour_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        meetingPoint: {
          location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
          google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
          additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
        }
      }
    }

    // Send confirmation emails with enhanced error handling
    await sendRequestEmailsWithErrorHandling(supabase, booking, tourDetails, logger, errorHandler, correlationId)

    console.log(`[${correlationId}] Booking request process completed successfully`)

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
    console.error(`[${correlationId}] Booking request processing error:`, error)
    
    // Handle critical system error
    await errorHandler.handleError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operation: 'create_booking_request_handler',
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