/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock SendGrid client
const mockSgMail = {
  setApiKey: (key: string) => {},
  send: async (msg: any) => {
    if (msg.to === 'fail@example.com') {
      throw new Error('Invalid email address');
    }
    if (msg.template_id === 'invalid_template') {
      throw new Error('Template not found');
    }
    if (msg.personalizations?.[0]?.to?.[0]?.email === 'ratelimit@example.com') {
      const error = new Error('Rate limit exceeded');
      (error as any).response = {
        body: {
          errors: [{ message: 'Maximum credits exceeded' }]
        }
      };
      throw error;
    }
    return { success: true };
  }
};

// Mock booking data
const mockBooking = {
  id: 123,
  tour_type: 'uji-tour',
  booking_date: '2025-02-15',
  booking_time: '10:00',
  adults: 2,
  children: 1,
  infants: 0,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '+1234567890',
  total_amount: 15000,
  special_requests: 'Vegetarian meal',
  status: 'PENDING_CONFIRMATION'
};

const mockTourDetails = {
  name: 'Uji Tea and Culture Tour',
  meetingPoint: {
    location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
    google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
    additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
  }
};

// SendGrid template IDs
const SENDGRID_TEMPLATES = {
  REQUEST_CONFIRMATION: 'd-ab9af3697fa443a6a248b787da1c4533',
  ADMIN_NOTIFICATION: 'd-e3a27de126df45908ad6036088fb9c15',
  REQUEST_APPROVED: 'd-80e109cadad44eeab06c1b2396b504b2',
  REQUEST_REJECTED: 'd-236d283e8a5a4271995de8ec5064c49b',
  PAYMENT_FAILED: 'd-0cafd30a53044f2fb64d676a9964d982'
};

const SENDGRID_FROM = {
  email: 'contact@tomodachitours.com',
  name: 'Tomodachi Tours'
};

// Helper function to escape special characters for Handlebars
function escapeHandlebars(str: string): string {
  if (!str) return str;
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Email sending functions
async function sendBookingRequestConfirmation(booking: any, tourDetails: any, sgMail: any) {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmountFormatted = booking.total_amount.toLocaleString();

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
}

async function sendAdminNotification(booking: any, tourDetails: any, sgMail: any, adminEmails: string[]) {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmountFormatted = booking.total_amount.toLocaleString();
  const now = new Date();

  const adminNotificationData = {
    bookingId: booking.id.toString(),
    tourName: escapeHandlebars(tourDetails.name),
    customerName: escapeHandlebars(booking.customer_name),
    customerEmail: escapeHandlebars(booking.customer_email),
    customerPhone: booking.customer_phone || '',
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

  const personalizations = adminEmails.map(email => ({
    to: [{ email: email }],
    dynamic_template_data: adminNotificationData
  }));

  await sgMail.send({
    from: SENDGRID_FROM,
    template_id: SENDGRID_TEMPLATES.ADMIN_NOTIFICATION,
    personalizations: personalizations
  });
}

async function sendStatusNotification(booking: any, tourDetails: any, sgMail: any, action: string, rejectionReason?: string, paymentError?: string) {
  const bookingDate = new Date(booking.booking_date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalAmountFormatted = booking.total_amount.toLocaleString();

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

  if (action === 'approve') {
    templateId = SENDGRID_TEMPLATES.REQUEST_APPROVED;
  } else if (action === 'reject') {
    templateId = SENDGRID_TEMPLATES.REQUEST_REJECTED;
    templateData.rejectionReason = escapeHandlebars(rejectionReason || 'No specific reason provided');
  } else if (action === 'payment_failed') {
    templateId = SENDGRID_TEMPLATES.PAYMENT_FAILED;
    templateData.paymentError = escapeHandlebars(paymentError || 'Payment processing failed');
  } else {
    throw new Error('Invalid action type');
  }

  await sgMail.send({
    to: booking.customer_email,
    from: SENDGRID_FROM,
    template_id: templateId,
    personalizations: [{
      to: [{ email: booking.customer_email }],
      dynamic_template_data: templateData
    }]
  });
}

Deno.test("Email Notification - should send booking request confirmation", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  await sendBookingRequestConfirmation(mockBooking, mockTourDetails, mockSgMailWithCapture);
  
  // Verify email structure
  assertExists(capturedEmail);
  assertEquals(capturedEmail.to, 'john@example.com');
  assertEquals(capturedEmail.from, SENDGRID_FROM);
  assertEquals(capturedEmail.template_id, SENDGRID_TEMPLATES.REQUEST_CONFIRMATION);
  
  // Verify template data
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.bookingId, '123');
  assertEquals(templateData.tourName, 'Uji Tea and Culture Tour');
  assertEquals(templateData.customerName, 'John Doe');
  assertEquals(templateData.adults, 2);
  assertEquals(templateData.children, 1);
  assertEquals(templateData.totalAmount, '¥15,000');
  assertExists(templateData.tourDate);
  assertExists(templateData.meetingPoint);
});

Deno.test("Email Notification - should send admin notification", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const adminEmails = ['admin1@example.com', 'admin2@example.com'];
  
  await sendAdminNotification(mockBooking, mockTourDetails, mockSgMailWithCapture, adminEmails);
  
  // Verify email structure
  assertExists(capturedEmail);
  assertEquals(capturedEmail.from, SENDGRID_FROM);
  assertEquals(capturedEmail.template_id, SENDGRID_TEMPLATES.ADMIN_NOTIFICATION);
  assertEquals(capturedEmail.personalizations.length, 2);
  
  // Verify personalizations
  assertEquals(capturedEmail.personalizations[0].to[0].email, 'admin1@example.com');
  assertEquals(capturedEmail.personalizations[1].to[0].email, 'admin2@example.com');
  
  // Verify template data
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.bookingId, '123');
  assertEquals(templateData.customerEmail, 'john@example.com');
  assertEquals(templateData.customerPhone, '+1234567890');
  assertExists(templateData.requestedDate);
  assertExists(templateData.requestedTime);
});

Deno.test("Email Notification - should send approval notification", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  await sendStatusNotification(mockBooking, mockTourDetails, mockSgMailWithCapture, 'approve');
  
  // Verify email structure
  assertExists(capturedEmail);
  assertEquals(capturedEmail.to, 'john@example.com');
  assertEquals(capturedEmail.template_id, SENDGRID_TEMPLATES.REQUEST_APPROVED);
  
  // Verify template data
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.bookingId, '123');
  assertEquals(templateData.tourName, 'Uji Tea and Culture Tour');
});

Deno.test("Email Notification - should send rejection notification", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const rejectionReason = 'Tour unavailable on requested date';
  
  await sendStatusNotification(mockBooking, mockTourDetails, mockSgMailWithCapture, 'reject', rejectionReason);
  
  // Verify email structure
  assertExists(capturedEmail);
  assertEquals(capturedEmail.template_id, SENDGRID_TEMPLATES.REQUEST_REJECTED);
  
  // Verify template data includes rejection reason
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.rejectionReason, rejectionReason);
});

Deno.test("Email Notification - should send payment failure notification", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const paymentError = 'Card declined by issuer';
  
  await sendStatusNotification(mockBooking, mockTourDetails, mockSgMailWithCapture, 'payment_failed', undefined, paymentError);
  
  // Verify email structure
  assertExists(capturedEmail);
  assertEquals(capturedEmail.template_id, SENDGRID_TEMPLATES.PAYMENT_FAILED);
  
  // Verify template data includes payment error
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.paymentError, paymentError);
});

Deno.test("Email Notification - should handle invalid action type", async () => {
  try {
    await sendStatusNotification(mockBooking, mockTourDetails, mockSgMail, 'invalid_action');
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Invalid action type');
  }
});

Deno.test("Email Notification - should escape special characters in template data", async () => {
  const bookingWithSpecialChars = {
    ...mockBooking,
    customer_name: 'John & Jane <Doe>',
    special_requests: 'Vegetarian meal "no meat" & gluten-free'
  };

  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  await sendBookingRequestConfirmation(bookingWithSpecialChars, mockTourDetails, mockSgMailWithCapture);
  
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.customerName, 'John &amp; Jane &lt;Doe&gt;');
  assertEquals(templateData.specialRequests, 'Vegetarian meal &quot;no meat&quot; &amp; gluten-free');
});

Deno.test("Email Notification - should handle email sending failures", async () => {
  try {
    await sendBookingRequestConfirmation(
      { ...mockBooking, customer_email: 'fail@example.com' },
      mockTourDetails,
      mockSgMail
    );
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Invalid email address');
  }
});

Deno.test("Email Notification - should handle template not found errors", async () => {
  const mockSgMailWithInvalidTemplate = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      if (msg.template_id === SENDGRID_TEMPLATES.REQUEST_CONFIRMATION) {
        // Change template ID to invalid one
        msg.template_id = 'invalid_template';
      }
      return mockSgMail.send(msg);
    }
  };

  try {
    await sendBookingRequestConfirmation(mockBooking, mockTourDetails, mockSgMailWithInvalidTemplate);
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Template not found');
  }
});

Deno.test("Email Notification - should handle rate limit errors", async () => {
  try {
    await sendBookingRequestConfirmation(
      { ...mockBooking, customer_email: 'ratelimit@example.com' },
      mockTourDetails,
      mockSgMail
    );
    assert(false, 'Should have thrown an error');
  } catch (error) {
    assertEquals(error.message, 'Rate limit exceeded');
    assertExists((error as any).response);
  }
});

Deno.test("Email Notification - should format dates correctly", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const bookingWithSpecificDate = {
    ...mockBooking,
    booking_date: '2025-12-25' // Christmas
  };

  await sendBookingRequestConfirmation(bookingWithSpecificDate, mockTourDetails, mockSgMailWithCapture);
  
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assert(templateData.tourDate.includes('December'));
  assert(templateData.tourDate.includes('25'));
  assert(templateData.tourDate.includes('2025'));
});

Deno.test("Email Notification - should format amounts correctly", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const bookingWithLargeAmount = {
    ...mockBooking,
    total_amount: 123456
  };

  await sendBookingRequestConfirmation(bookingWithLargeAmount, mockTourDetails, mockSgMailWithCapture);
  
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.totalAmount, '¥123,456');
});

Deno.test("Email Notification - should handle missing optional fields", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const bookingWithMissingFields = {
    ...mockBooking,
    children: undefined,
    infants: undefined,
    customer_phone: undefined,
    special_requests: undefined
  };

  await sendBookingRequestConfirmation(bookingWithMissingFields, mockTourDetails, mockSgMailWithCapture);
  
  const templateData = capturedEmail.personalizations[0].dynamic_template_data;
  assertEquals(templateData.children, 0);
  assertEquals(templateData.infants, 0);
  assertEquals(templateData.specialRequests, '');
});

Deno.test("Email Notification - should handle multiple admin emails", async () => {
  let capturedEmail: any = null;
  
  const mockSgMailWithCapture = {
    setApiKey: (key: string) => {},
    send: async (msg: any) => {
      capturedEmail = msg;
      return { success: true };
    }
  };

  const adminEmails = [
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com'
  ];
  
  await sendAdminNotification(mockBooking, mockTourDetails, mockSgMailWithCapture, adminEmails);
  
  assertEquals(capturedEmail.personalizations.length, 3);
  assertEquals(capturedEmail.personalizations[0].to[0].email, 'admin1@example.com');
  assertEquals(capturedEmail.personalizations[1].to[0].email, 'admin2@example.com');
  assertEquals(capturedEmail.personalizations[2].to[0].email, 'admin3@example.com');
  
  // All personalizations should have the same template data
  const templateData1 = capturedEmail.personalizations[0].dynamic_template_data;
  const templateData2 = capturedEmail.personalizations[1].dynamic_template_data;
  assertEquals(templateData1.bookingId, templateData2.bookingId);
  assertEquals(templateData1.customerEmail, templateData2.customerEmail);
});

console.log("Email notification tests completed successfully!");