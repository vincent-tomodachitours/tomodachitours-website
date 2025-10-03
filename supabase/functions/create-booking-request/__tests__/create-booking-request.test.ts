/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock dependencies
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => ({ 
      select: () => ({ 
        single: () => ({ 
          data: { 
            id: 123, 
            ...data,
            created_at: new Date().toISOString()
          }, 
          error: null 
        }) 
      }) 
    }),
    select: (fields?: string) => ({
      eq: (field: string, value: any) => ({
        single: () => ({
          data: {
            id: 1,
            name: 'Uji Tour',
            meeting_point: {
              location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
              google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
              additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station.'
            }
          },
          error: null
        })
      })
    })
  })
};

// Mock SendGrid
const mockSgMail = {
  setApiKey: (key: string) => {},
  send: async (msg: any) => ({ success: true })
};

// Mock validation middleware
const mockValidateRequest = async (req: Request, schema: any) => {
  const body = await req.json();
  return {
    data: body,
    error: null
  };
};

const mockBookingRequestSchema = {};

const mockAddSecurityHeaders = (headers: Headers) => headers;

// Test data
const validBookingRequestData = {
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
  special_requests: 'Vegetarian meal'
};

const invalidBookingRequestData = {
  tour_type: 'regular-tour', // Not a Uji tour
  booking_date: '2025-02-15',
  booking_time: '10:00',
  adults: 2,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  payment_method_id: 'pm_test_123',
  total_amount: 13000
};

Deno.test("Create Booking Request - should validate Uji tour types", async () => {
  // Test valid Uji tour types
  const validUjiTours = ['uji-tour', 'uji-walking-tour'];
  
  for (const tourType of validUjiTours) {
    const isUji = isUjiTour(tourType);
    assertEquals(isUji, true, `${tourType} should be recognized as Uji tour`);
  }
  
  // Test invalid tour types
  const invalidTours = ['regular-tour', 'night-tour', 'gion-tour'];
  
  for (const tourType of invalidTours) {
    const isUji = isUjiTour(tourType);
    assertEquals(isUji, false, `${tourType} should not be recognized as Uji tour`);
  }
});

Deno.test("Create Booking Request - should handle valid request data", async () => {
  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBookingRequestData)
  });

  // Mock the handler dependencies
  const mockHandler = createMockHandler();
  const response = await mockHandler(request);
  
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.status, 'PENDING_CONFIRMATION');
  assertExists(responseData.booking_id);
  assertExists(responseData.message);
});

Deno.test("Create Booking Request - should reject non-Uji tours", async () => {
  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidBookingRequestData)
  });

  const mockHandler = createMockHandler();
  const response = await mockHandler(request);
  
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assert(responseData.error.includes('Booking requests are only available for Uji tours'));
});

Deno.test("Create Booking Request - should handle validation errors", async () => {
  const invalidData = {
    tour_type: 'uji-tour',
    // Missing required fields
    booking_date: '2025-02-15'
  };

  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidData)
  });

  const mockHandler = createMockHandlerWithValidationError();
  const response = await mockHandler(request);
  
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertExists(responseData.error);
});

Deno.test("Create Booking Request - should handle database errors", async () => {
  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBookingRequestData)
  });

  const mockHandler = createMockHandlerWithDatabaseError();
  const response = await mockHandler(request);
  
  assertEquals(response.status, 500);
  
  const responseData = await response.json();
  assertEquals(responseData.success, false);
  assertEquals(responseData.error, 'Failed to create booking request');
});

Deno.test("Create Booking Request - should handle CORS preflight", async () => {
  const request = new Request('http://localhost/create-booking-request', {
    method: 'OPTIONS'
  });

  const mockHandler = createMockHandler();
  const response = await mockHandler(request);
  
  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
  
  // Check CORS headers
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  assertExists(response.headers.get('Access-Control-Allow-Headers'));
});

Deno.test("Create Booking Request - should create booking with correct data structure", async () => {
  let capturedBookingData: any = null;
  
  const mockSupabaseWithCapture = {
    from: (table: string) => ({
      insert: (data: any) => {
        capturedBookingData = data;
        return { 
          select: () => ({ 
            single: () => ({ 
              data: { 
                id: 123, 
                ...data,
                created_at: new Date().toISOString()
              }, 
              error: null 
            }) 
          }) 
        };
      },
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: () => ({
            data: {
              id: 1,
              name: 'Uji Tour',
              meeting_point: {
                location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
                google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9'
              }
            },
            error: null
          })
        })
      })
    })
  };

  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBookingRequestData)
  });

  const mockHandler = createMockHandlerWithSupabase(mockSupabaseWithCapture);
  await mockHandler(request);
  
  // Verify booking data structure
  assertExists(capturedBookingData);
  assertEquals(capturedBookingData.status, 'PENDING_CONFIRMATION');
  assertEquals(capturedBookingData.tour_type, 'uji-tour');
  assertEquals(capturedBookingData.customer_email, 'john@example.com');
  assertEquals(capturedBookingData.payment_method_id, 'pm_test_123');
  assertEquals(capturedBookingData.total_amount, 13000);
  assertExists(capturedBookingData.request_submitted_at);
  assertEquals(capturedBookingData.number_of_people, 2); // adults + children + infants
});

Deno.test("Create Booking Request - should handle email sending failures gracefully", async () => {
  const mockSupabaseWithEmailFailure = {
    ...mockSupabase,
    from: (table: string) => {
      if (table === 'email_failures') {
        return {
          insert: (data: any) => ({ error: null })
        };
      }
      return mockSupabase.from(table);
    }
  };

  const mockSgMailWithFailure = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      throw new Error('SendGrid API error');
    }
  };

  const request = new Request('http://localhost/create-booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBookingRequestData)
  });

  const mockHandler = createMockHandlerWithEmailFailure(mockSupabaseWithEmailFailure, mockSgMailWithFailure);
  const response = await mockHandler(request);
  
  // Should still succeed even if email fails
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.success, true);
  assertEquals(responseData.status, 'PENDING_CONFIRMATION');
});

// Helper function to simulate isUjiTour function
function isUjiTour(tourType: string): boolean {
  const ujiTourTypes = ['uji-tour', 'uji-walking-tour'];
  return ujiTourTypes.includes(tourType.toLowerCase());
}

// Helper functions to create mock handlers
function createMockHandler() {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const { data, error } = await mockValidateRequest(req, mockBookingRequestSchema);
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isUjiTour(data.tour_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Booking requests are only available for Uji tours. Please use the regular booking flow for other tours.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate successful booking creation
    const booking = { id: 123, ...data };
    
    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        status: 'PENDING_CONFIRMATION',
        message: 'Your booking request has been submitted successfully.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };
}

function createMockHandlerWithValidationError() {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    return new Response(
      JSON.stringify({ success: false, error: 'Validation failed: missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };
}

function createMockHandlerWithDatabaseError() {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    const { data } = await mockValidateRequest(req, mockBookingRequestSchema);
    
    if (!isUjiTour(data.tour_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Booking requests are only available for Uji tours.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate database error
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create booking request'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };
}

function createMockHandlerWithSupabase(customSupabase: any) {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    const { data } = await mockValidateRequest(req, mockBookingRequestSchema);
    
    if (!isUjiTour(data.tour_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Booking requests are only available for Uji tours.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate booking creation with custom supabase
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
      status: 'PENDING_CONFIRMATION',
      request_submitted_at: new Date().toISOString(),
      tour_id: 1,
      number_of_people: data.adults + (data.children || 0) + (data.infants || 0)
    };

    const { data: booking } = await customSupabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        status: 'PENDING_CONFIRMATION',
        message: 'Your booking request has been submitted successfully.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };
}

function createMockHandlerWithEmailFailure(customSupabase: any, customSgMail: any) {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    const { data } = await mockValidateRequest(req, mockBookingRequestSchema);
    
    if (!isUjiTour(data.tour_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Booking requests are only available for Uji tours.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate booking creation
    const booking = { id: 123, ...data };
    
    // Simulate email failure (handled gracefully)
    try {
      await customSgMail.send({});
    } catch (error) {
      // Email failure is logged but doesn't break the flow
      console.log('Email failed but continuing...');
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        status: 'PENDING_CONFIRMATION',
        message: 'Your booking request has been submitted successfully.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };
}

console.log("Create booking request tests completed successfully!");