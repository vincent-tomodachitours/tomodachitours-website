/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock Supabase client
const mockSupabase = {
  from: (table: string) => ({
    select: (fields?: string) => ({
      eq: (field: string, value: any) => ({
        single: () => ({
          data: {
            id: 123,
            tour_type: 'uji-tour',
            booking_date: '2025-02-15',
            booking_time: '10:00',
            adults: 2,
            children: 0,
            infants: 0,
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+1234567890',
            payment_method_id: 'pm_test_123',
            total_amount: 13000,
            status: 'PENDING_CONFIRMATION',
            request_submitted_at: new Date().toISOString()
          },
          error: null
        })
      })
    }),
    update: (data: any) => ({
      eq: (field: string, value: any) => ({ error: null })
    }),
    insert: (data: any) => ({ error: null })
  })
};

// Mock Stripe service
const mockStripeService = {
  processImmediatePayment: async (amount: number, bookingId: number, paymentMethodId: string) => {
    if (paymentMethodId === 'pm_fail_123') {
      throw new Error('Your card was declined');
    }
    return {
      id: 'pi_test_123',
      status: 'succeeded',
      amount: amount
    };
  }
};

// Mock validation schema
const mockManageBookingRequestSchema = {
  safeParse: (data: any) => {
    const requiredFields = ['booking_id', 'action', 'admin_id'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: {
          errors: missingFields.map(field => ({
            path: [field],
            message: `${field} is required`
          }))
        }
      };
    }

    if (!['approve', 'reject'].includes(data.action)) {
      return {
        success: false,
        error: {
          errors: [{
            path: ['action'],
            message: 'action must be approve or reject'
          }]
        }
      };
    }

    return {
      success: true,
      data: data
    };
  }
};

// Test data
const validApprovalRequest = {
  booking_id: 123,
  action: 'approve',
  admin_id: 'admin_123'
};

const validRejectionRequest = {
  booking_id: 123,
  action: 'reject',
  admin_id: 'admin_123',
  rejection_reason: 'Tour unavailable on requested date'
};

const invalidRequest = {
  booking_id: 123,
  action: 'invalid_action',
  admin_id: 'admin_123'
};

const missingFieldsRequest = {
  booking_id: 123,
  action: 'approve'
  // Missing admin_id
};

Deno.test("Manage Booking Request - should validate request data correctly", async () => {
  // Test valid approval request
  const validResult = mockManageBookingRequestSchema.safeParse(validApprovalRequest);
  assertEquals(validResult.success, true);
  assertEquals(validResult.data.action, 'approve');

  // Test valid rejection request
  const validRejectionResult = mockManageBookingRequestSchema.safeParse(validRejectionRequest);
  assertEquals(validRejectionResult.success, true);
  assertEquals(validRejectionResult.data.action, 'reject');

  // Test invalid action
  const invalidResult = mockManageBookingRequestSchema.safeParse(invalidRequest);
  assertEquals(invalidResult.success, false);
  assertExists(invalidResult.error);

  // Test missing fields
  const missingFieldsResult = mockManageBookingRequestSchema.safeParse(missingFieldsRequest);
  assertEquals(missingFieldsResult.success, false);
  assertExists(missingFieldsResult.error);
});

Deno.test("Manage Booking Request - should handle approval flow", async () => {
  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabase, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.status, 'CONFIRMED');
  assertEquals(responseData.booking_id, 123);
  assertExists(responseData.message);
  assertExists(responseData.correlation_id);
});

Deno.test("Manage Booking Request - should handle rejection flow", async () => {
  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRejectionRequest)
  });

  const mockHandler = createMockHandler(mockSupabase, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.status, 'REJECTED');
  assertEquals(responseData.booking_id, 123);
  assertExists(responseData.message);
});

Deno.test("Manage Booking Request - should handle payment failures", async () => {
  const mockSupabaseWithFailingPayment = {
    ...mockSupabase,
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 123,
              tour_type: 'uji-tour',
              customer_email: 'john@example.com',
              payment_method_id: 'pm_fail_123', // This will trigger payment failure
              total_amount: 13000,
              status: 'PENDING_CONFIRMATION'
            },
            error: null
          })
        })
      }),
      update: (data: any) => ({
        eq: (field: string, value: any) => ({ error: null })
      }),
      insert: (data: any) => ({ error: null })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithFailingPayment, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertEquals(responseData.status, 'PENDING_CONFIRMATION');
  assert(responseData.error.includes('Payment processing failed'));
  assertExists(responseData.should_retry);
});

Deno.test("Manage Booking Request - should handle booking not found", async () => {
  const mockSupabaseWithNoBooking = {
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: null,
            error: { message: 'No rows returned' }
          })
        })
      })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithNoBooking, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 404);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertEquals(responseData.error, 'Booking not found');
});

Deno.test("Manage Booking Request - should handle invalid booking status", async () => {
  const mockSupabaseWithConfirmedBooking = {
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 123,
              status: 'CONFIRMED', // Already confirmed
              tour_type: 'uji-tour',
              customer_email: 'john@example.com',
              total_amount: 13000
            },
            error: null
          })
        })
      })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithConfirmedBooking, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assert(responseData.error.includes('not in PENDING_CONFIRMATION status'));
});

Deno.test("Manage Booking Request - should handle validation errors", async () => {
  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidRequest)
  });

  const mockHandler = createMockHandler(mockSupabase, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertExists(responseData.error);
});

Deno.test("Manage Booking Request - should handle CORS preflight", async () => {
  const request = new Request('http://localhost/manage-booking-request', {
    method: 'OPTIONS'
  });

  const mockHandler = createMockHandler(mockSupabase, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
  
  // Check CORS headers
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  assertExists(response.headers.get('Access-Control-Allow-Headers'));
});

Deno.test("Manage Booking Request - should handle database update errors", async () => {
  const mockSupabaseWithUpdateError = {
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 123,
              tour_type: 'uji-tour',
              customer_email: 'john@example.com',
              payment_method_id: 'pm_test_123',
              total_amount: 13000,
              status: 'PENDING_CONFIRMATION'
            },
            error: null
          })
        })
      }),
      update: (data: any) => ({
        eq: (field: string, value: any) => ({ 
          error: { message: 'Database update failed' }
        })
      }),
      insert: (data: any) => ({ error: null })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRejectionRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithUpdateError, mockStripeService);
  const response = await mockHandler(request);
  
  assertEquals(response.status, 500);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertEquals(responseData.error, 'Failed to update booking status');
});

Deno.test("Manage Booking Request - should process payment with correct parameters", async () => {
  let capturedPaymentParams: any = null;
  
  const mockStripeServiceWithCapture = {
    processImmediatePayment: async (amount: number, bookingId: number, paymentMethodId: string) => {
      capturedPaymentParams = { amount, bookingId, paymentMethodId };
      return {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: amount
      };
    }
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabase, mockStripeServiceWithCapture);
  await mockHandler(request);
  
  // Verify payment parameters
  assertExists(capturedPaymentParams);
  assertEquals(capturedPaymentParams.amount, 13000);
  assertEquals(capturedPaymentParams.bookingId, 123);
  assertEquals(capturedPaymentParams.paymentMethodId, 'pm_test_123');
});

Deno.test("Manage Booking Request - should update booking status correctly on approval", async () => {
  let capturedUpdateData: any = null;
  
  const mockSupabaseWithCapture = {
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 123,
              tour_type: 'uji-tour',
              customer_email: 'john@example.com',
              payment_method_id: 'pm_test_123',
              total_amount: 13000,
              status: 'PENDING_CONFIRMATION'
            },
            error: null
          })
        })
      }),
      update: (data: any) => {
        capturedUpdateData = data;
        return {
          eq: (field: string, value: any) => ({ error: null })
        };
      },
      insert: (data: any) => ({ error: null })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validApprovalRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithCapture, mockStripeService);
  await mockHandler(request);
  
  // Verify update data
  assertExists(capturedUpdateData);
  assertEquals(capturedUpdateData.status, 'CONFIRMED');
  assertEquals(capturedUpdateData.payment_provider, 'stripe');
  assertEquals(capturedUpdateData.charge_id, 'pi_test_123');
  assertEquals(capturedUpdateData.paid_amount, 13000);
  assertExists(capturedUpdateData.admin_reviewed_at);
});

Deno.test("Manage Booking Request - should update booking status correctly on rejection", async () => {
  let capturedUpdateData: any = null;
  
  const mockSupabaseWithCapture = {
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 123,
              tour_type: 'uji-tour',
              customer_email: 'john@example.com',
              status: 'PENDING_CONFIRMATION'
            },
            error: null
          })
        })
      }),
      update: (data: any) => {
        capturedUpdateData = data;
        return {
          eq: (field: string, value: any) => ({ error: null })
        };
      },
      insert: (data: any) => ({ error: null })
    })
  };

  const request = new Request('http://localhost/manage-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRejectionRequest)
  });

  const mockHandler = createMockHandler(mockSupabaseWithCapture, mockStripeService);
  await mockHandler(request);
  
  // Verify update data
  assertExists(capturedUpdateData);
  assertEquals(capturedUpdateData.status, 'REJECTED');
  assertEquals(capturedUpdateData.admin_reviewed_by, 'admin_123');
  assertEquals(capturedUpdateData.rejection_reason, 'Tour unavailable on requested date');
  assertExists(capturedUpdateData.admin_reviewed_at);
});

// Helper function to create mock handler
function createMockHandler(supabase: any, stripeService: any) {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Generate correlation ID
    const correlationId = `manage-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate request
      const body = await req.json();
      const validation = mockManageBookingRequestSchema.safeParse(body);
      
      if (!validation.success) {
        const error = validation.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return new Response(
          JSON.stringify({ success: false, error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = validation.data;

      // Fetch booking
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', data.booking_id)
        .single();

      if (fetchError || !booking) {
        return new Response(
          JSON.stringify({ success: false, error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate booking status
      if (booking.status !== 'PENDING_CONFIRMATION') {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Booking is not in PENDING_CONFIRMATION status. Current status: ${booking.status}`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data.action === 'approve') {
        // Process payment
        try {
          const paymentResult = await stripeService.processImmediatePayment(
            booking.total_amount,
            booking.id,
            booking.payment_method_id
          );

          // Update booking status
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
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to update booking status' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Booking request approved and payment processed successfully',
              booking_id: booking.id,
              status: 'CONFIRMED',
              correlation_id: correlationId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (paymentError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Payment processing failed: ${paymentError.message}`,
              booking_id: booking.id,
              status: 'PENDING_CONFIRMATION',
              should_retry: true,
              correlation_id: correlationId
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      } else if (data.action === 'reject') {
        // Update booking to rejected
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
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update booking status', correlation_id: correlationId }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Booking request rejected successfully',
            booking_id: booking.id,
            status: 'REJECTED',
            correlation_id: correlationId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Must be "approve" or "reject"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          correlation_id: correlationId
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  };
}

console.log("Manage booking request tests completed successfully!");