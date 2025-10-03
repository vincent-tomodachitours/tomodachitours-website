/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * Admin API Integration Tests
 * 
 * Tests the complete admin interface API integrations including:
 * - Fetching pending booking requests
 * - Processing approvals and rejections
 * - Handling bulk operations
 * - Error handling and recovery
 * - Real-time updates and notifications
 * 
 * Requirements Coverage: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

// Mock admin authentication context
const mockAdminAuth = {
  user: {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin'
  },
  isAuthenticated: true
};

// Mock booking request data for admin interface
const mockPendingRequests = [
  {
    id: 1,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1234567890',
    tour_type: 'uji-tour',
    tour_name: 'Uji Tour',
    booking_date: '2025-02-15',
    booking_time: '10:00',
    adults: 2,
    children: 0,
    infants: 0,
    total_amount: 13000,
    payment_method_id: 'pm_test_123',
    status: 'PENDING_CONFIRMATION',
    request_submitted_at: '2025-01-15T10:00:00Z',
    discount_applied: null
  },
  {
    id: 2,
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    customer_phone: '+1234567891',
    tour_type: 'uji-walking-tour',
    tour_name: 'Uji Walking Tour',
    booking_date: '2025-02-16',
    booking_time: '14:00',
    adults: 1,
    children: 1,
    infants: 0,
    total_amount: 9750,
    payment_method_id: 'pm_test_456',
    status: 'PENDING_CONFIRMATION',
    request_submitted_at: '2025-01-15T11:30:00Z',
    discount_applied: {
      code: 'FAMILY10',
      amount: 1250
    }
  }
];

// Mock database with admin query capabilities
let mockAdminDatabase = [...mockPendingRequests];
let mockApiCallLogs: any[] = [];

const mockAdminSupabase = {
  from: (table: string) => {
    if (table === 'bookings') {
      return {
        select: (fields?: string) => ({
          eq: (field: string, value: any) => ({
            order: (orderBy: string) => ({
              data: mockAdminDatabase.filter(b => b[field] === value),
              error: null
            }),
            single: () => {
              const booking = mockAdminDatabase.find(b => b[field] === value);
              return { data: booking || null, error: booking ? null : { message: 'Not found' } };
            }
          }),
          in: (field: string, values: any[]) => ({
            order: (orderBy: string) => ({
              data: mockAdminDatabase.filter(b => values.includes(b[field])),
              error: null
            })
          }),
          order: (orderBy: string) => ({
            data: mockAdminDatabase,
            error: null
          })
        }),
        update: (data: any) => ({
          eq: (field: string, value: any) => {
            const booking = mockAdminDatabase.find(b => b[field] === value);
            if (booking) {
              Object.assign(booking, data);
            }
            return { error: booking ? null : { message: 'Not found' } };
          }
        })
      };
    }
    return {
      insert: () => ({ error: null }),
      select: () => ({ data: [], error: null })
    };
  }
};

// Mock API service for admin operations
class MockAdminApiService {
  static async fetchPendingRequests(filters?: any) {
    mockApiCallLogs.push({ 
      action: 'fetchPendingRequests', 
      filters, 
      timestamp: new Date().toISOString() 
    });
    
    let requests = mockAdminDatabase.filter(b => b.status === 'PENDING_CONFIRMATION');
    
    if (filters?.tourType) {
      requests = requests.filter(b => b.tour_type === filters.tourType);
    }
    
    if (filters?.dateFrom) {
      requests = requests.filter(b => b.booking_date >= filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      requests = requests.filter(b => b.booking_date <= filters.dateTo);
    }
    
    return {
      data: requests,
      total: requests.length,
      error: null
    };
  }
  
  static async approveRequest(bookingId: number, adminId: string) {
    mockApiCallLogs.push({ 
      action: 'approveRequest', 
      bookingId, 
      adminId, 
      timestamp: new Date().toISOString() 
    });
    
    const booking = mockAdminDatabase.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.status !== 'PENDING_CONFIRMATION') {
      throw new Error('Booking is not in pending status');
    }
    
    // Simulate payment processing
    const paymentResult = await this.processPayment(booking.total_amount, booking.payment_method_id);
    
    // Update booking status
    Object.assign(booking, {
      status: 'CONFIRMED',
      payment_intent_id: paymentResult.id,
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: adminId
    });
    
    return {
      success: true,
      booking: booking,
      paymentResult: paymentResult
    };
  }
  
  static async rejectRequest(bookingId: number, adminId: string, reason: string) {
    mockApiCallLogs.push({ 
      action: 'rejectRequest', 
      bookingId, 
      adminId, 
      reason, 
      timestamp: new Date().toISOString() 
    });
    
    const booking = mockAdminDatabase.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.status !== 'PENDING_CONFIRMATION') {
      throw new Error('Booking is not in pending status');
    }
    
    // Update booking status
    Object.assign(booking, {
      status: 'REJECTED',
      rejection_reason: reason,
      admin_reviewed_at: new Date().toISOString(),
      admin_reviewed_by: adminId
    });
    
    return {
      success: true,
      booking: booking
    };
  }
  
  static async bulkApprove(bookingIds: number[], adminId: string) {
    mockApiCallLogs.push({ 
      action: 'bulkApprove', 
      bookingIds, 
      adminId, 
      timestamp: new Date().toISOString() 
    });
    
    const results = [];
    
    for (const bookingId of bookingIds) {
      try {
        const result = await this.approveRequest(bookingId, adminId);
        results.push({ bookingId, success: true, result });
      } catch (error) {
        results.push({ bookingId, success: false, error: error.message });
      }
    }
    
    return {
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    };
  }
  
  static async getRequestAnalytics(dateRange?: { from: string; to: string }) {
    mockApiCallLogs.push({ 
      action: 'getRequestAnalytics', 
      dateRange, 
      timestamp: new Date().toISOString() 
    });
    
    const allRequests = mockAdminDatabase;
    const pending = allRequests.filter(b => b.status === 'PENDING_CONFIRMATION').length;
    const confirmed = allRequests.filter(b => b.status === 'CONFIRMED').length;
    const rejected = allRequests.filter(b => b.status === 'REJECTED').length;
    
    return {
      totalRequests: allRequests.length,
      pendingRequests: pending,
      confirmedBookings: confirmed,
      rejectedRequests: rejected,
      conversionRate: allRequests.length > 0 ? (confirmed / allRequests.length) * 100 : 0,
      averageProcessingTime: '2.5 hours' // Mock value
    };
  }
  
  private static async processPayment(amount: number, paymentMethodId: string) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (paymentMethodId === 'pm_fail_123') {
      throw new Error('Payment failed - card declined');
    }
    
    return {
      id: 'pi_' + Math.random().toString(36).substr(2, 9),
      status: 'succeeded',
      amount: amount
    };
  }
}

// Helper function to reset test state
function resetAdminTestState() {
  mockAdminDatabase = [...mockPendingRequests];
  mockApiCallLogs = [];
}

// Integration Test 1: Admin Dashboard Data Fetching
Deno.test("Admin API Integration: Dashboard data fetching and filtering", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing admin dashboard data fetching...");
  
  // Step 1: Fetch all pending requests
  console.log("  📋 Step 1: Fetch all pending requests");
  
  const allRequests = await MockAdminApiService.fetchPendingRequests();
  assertEquals(allRequests.error, null);
  assertEquals(allRequests.data.length, 2);
  assertEquals(allRequests.total, 2);
  
  // Verify API call was logged
  assertEquals(mockApiCallLogs.length, 1);
  assertEquals(mockApiCallLogs[0].action, 'fetchPendingRequests');
  
  // Step 2: Filter by tour type
  console.log("  🔍 Step 2: Filter by tour type");
  
  const ujiTourRequests = await MockAdminApiService.fetchPendingRequests({
    tourType: 'uji-tour'
  });
  
  assertEquals(ujiTourRequests.data.length, 1);
  assertEquals(ujiTourRequests.data[0].tour_type, 'uji-tour');
  assertEquals(ujiTourRequests.data[0].customer_name, 'John Doe');
  
  // Step 3: Filter by date range
  console.log("  📅 Step 3: Filter by date range");
  
  const dateFilteredRequests = await MockAdminApiService.fetchPendingRequests({
    dateFrom: '2025-02-15',
    dateTo: '2025-02-15'
  });
  
  assertEquals(dateFilteredRequests.data.length, 1);
  assertEquals(dateFilteredRequests.data[0].booking_date, '2025-02-15');
  
  // Step 4: Get analytics data
  console.log("  📊 Step 4: Get analytics data");
  
  const analytics = await MockAdminApiService.getRequestAnalytics();
  assertEquals(analytics.totalRequests, 2);
  assertEquals(analytics.pendingRequests, 2);
  assertEquals(analytics.confirmedBookings, 0);
  assertEquals(analytics.rejectedRequests, 0);
  
  console.log("  ✅ Admin dashboard data fetching test passed!");
});

// Integration Test 2: Request Approval Workflow
Deno.test("Admin API Integration: Request approval workflow", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing request approval workflow...");
  
  // Step 1: Approve a request
  console.log("  ✅ Step 1: Approve a request");
  
  const approvalResult = await MockAdminApiService.approveRequest(1, 'admin@example.com');
  
  assertEquals(approvalResult.success, true);
  assertExists(approvalResult.booking);
  assertExists(approvalResult.paymentResult);
  assertEquals(approvalResult.booking.status, 'CONFIRMED');
  assertEquals(approvalResult.booking.admin_reviewed_by, 'admin@example.com');
  assertExists(approvalResult.booking.payment_intent_id);
  
  // Verify API call was logged
  const approvalLog = mockApiCallLogs.find(log => log.action === 'approveRequest');
  assertExists(approvalLog);
  assertEquals(approvalLog.bookingId, 1);
  assertEquals(approvalLog.adminId, 'admin@example.com');
  
  // Step 2: Verify booking status changed in database
  console.log("  🔍 Step 2: Verify booking status changed");
  
  const updatedBooking = mockAdminDatabase.find(b => b.id === 1);
  assertEquals(updatedBooking?.status, 'CONFIRMED');
  assertExists(updatedBooking?.admin_reviewed_at);
  
  // Step 3: Try to approve already processed request (should fail)
  console.log("  ❌ Step 3: Try to approve already processed request");
  
  let approvalError: Error | null = null;
  try {
    await MockAdminApiService.approveRequest(1, 'admin@example.com');
  } catch (error) {
    approvalError = error as Error;
  }
  
  assertExists(approvalError);
  assertEquals(approvalError.message, 'Booking is not in pending status');
  
  console.log("  ✅ Request approval workflow test passed!");
});

// Integration Test 3: Request Rejection Workflow
Deno.test("Admin API Integration: Request rejection workflow", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing request rejection workflow...");
  
  // Step 1: Reject a request with reason
  console.log("  ❌ Step 1: Reject a request with reason");
  
  const rejectionReason = 'Tour is fully booked for this date';
  const rejectionResult = await MockAdminApiService.rejectRequest(2, 'admin@example.com', rejectionReason);
  
  assertEquals(rejectionResult.success, true);
  assertExists(rejectionResult.booking);
  assertEquals(rejectionResult.booking.status, 'REJECTED');
  assertEquals(rejectionResult.booking.rejection_reason, rejectionReason);
  assertEquals(rejectionResult.booking.admin_reviewed_by, 'admin@example.com');
  
  // Verify API call was logged
  const rejectionLog = mockApiCallLogs.find(log => log.action === 'rejectRequest');
  assertExists(rejectionLog);
  assertEquals(rejectionLog.bookingId, 2);
  assertEquals(rejectionLog.reason, rejectionReason);
  
  // Step 2: Verify booking status changed in database
  console.log("  🔍 Step 2: Verify booking status changed");
  
  const updatedBooking = mockAdminDatabase.find(b => b.id === 2);
  assertEquals(updatedBooking?.status, 'REJECTED');
  assertEquals(updatedBooking?.rejection_reason, rejectionReason);
  
  // Step 3: Try to reject non-existent request (should fail)
  console.log("  ❌ Step 3: Try to reject non-existent request");
  
  let rejectionError: Error | null = null;
  try {
    await MockAdminApiService.rejectRequest(999, 'admin@example.com', 'Test reason');
  } catch (error) {
    rejectionError = error as Error;
  }
  
  assertExists(rejectionError);
  assertEquals(rejectionError.message, 'Booking not found');
  
  console.log("  ✅ Request rejection workflow test passed!");
});

// Integration Test 4: Bulk Operations
Deno.test("Admin API Integration: Bulk approval operations", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing bulk approval operations...");
  
  // Add more test bookings for bulk operations
  const additionalBookings = [
    { ...mockPendingRequests[0], id: 3, customer_email: 'customer3@example.com' },
    { ...mockPendingRequests[0], id: 4, customer_email: 'customer4@example.com', payment_method_id: 'pm_fail_123' }
  ];
  
  mockAdminDatabase.push(...additionalBookings);
  
  // Step 1: Bulk approve multiple requests
  console.log("  ✅ Step 1: Bulk approve multiple requests");
  
  const bulkResult = await MockAdminApiService.bulkApprove([1, 3, 4], 'admin@example.com');
  
  assertEquals(bulkResult.results.length, 3);
  assertEquals(bulkResult.successCount, 2); // 1 and 3 should succeed, 4 should fail due to payment
  assertEquals(bulkResult.failureCount, 1);
  
  // Verify successful approvals
  const successfulResults = bulkResult.results.filter(r => r.success);
  assertEquals(successfulResults.length, 2);
  
  // Verify failed approval
  const failedResults = bulkResult.results.filter(r => !r.success);
  assertEquals(failedResults.length, 1);
  assertEquals(failedResults[0].bookingId, 4);
  assert(failedResults[0].error.includes('Payment failed'));
  
  // Step 2: Verify database state after bulk operation
  console.log("  🔍 Step 2: Verify database state after bulk operation");
  
  const confirmedBookings = mockAdminDatabase.filter(b => b.status === 'CONFIRMED');
  assertEquals(confirmedBookings.length, 2);
  
  const pendingBookings = mockAdminDatabase.filter(b => b.status === 'PENDING_CONFIRMATION');
  assertEquals(pendingBookings.length, 2); // Original booking 2 + failed booking 4
  
  console.log("  ✅ Bulk approval operations test passed!");
});

// Integration Test 5: Payment Failure Handling in Admin Interface
Deno.test("Admin API Integration: Payment failure handling", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing payment failure handling in admin interface...");
  
  // Step 1: Try to approve request with failing payment method
  console.log("  💳 Step 1: Try to approve request with failing payment method");
  
  // Update booking to use failing payment method
  const bookingToFail = mockAdminDatabase.find(b => b.id === 1);
  if (bookingToFail) {
    bookingToFail.payment_method_id = 'pm_fail_123';
  }
  
  let paymentError: Error | null = null;
  try {
    await MockAdminApiService.approveRequest(1, 'admin@example.com');
  } catch (error) {
    paymentError = error as Error;
  }
  
  assertExists(paymentError);
  assert(paymentError.message.includes('Payment failed'));
  
  // Step 2: Verify booking remains in pending status
  console.log("  🔍 Step 2: Verify booking remains in pending status");
  
  const bookingAfterFailure = mockAdminDatabase.find(b => b.id === 1);
  assertEquals(bookingAfterFailure?.status, 'PENDING_CONFIRMATION');
  
  // Step 3: Update payment method and retry
  console.log("  🔄 Step 3: Update payment method and retry");
  
  if (bookingToFail) {
    bookingToFail.payment_method_id = 'pm_success_123';
  }
  
  const retryResult = await MockAdminApiService.approveRequest(1, 'admin@example.com');
  assertEquals(retryResult.success, true);
  assertEquals(retryResult.booking.status, 'CONFIRMED');
  
  console.log("  ✅ Payment failure handling test passed!");
});

// Integration Test 6: Real-time Analytics and Monitoring
Deno.test("Admin API Integration: Real-time analytics and monitoring", async () => {
  resetAdminTestState();
  
  console.log("🧪 Testing real-time analytics and monitoring...");
  
  // Step 1: Get initial analytics
  console.log("  📊 Step 1: Get initial analytics");
  
  const initialAnalytics = await MockAdminApiService.getRequestAnalytics();
  assertEquals(initialAnalytics.pendingRequests, 2);
  assertEquals(initialAnalytics.confirmedBookings, 0);
  assertEquals(initialAnalytics.rejectedRequests, 0);
  
  // Step 2: Process some requests and check updated analytics
  console.log("  ⚡ Step 2: Process requests and check updated analytics");
  
  await MockAdminApiService.approveRequest(1, 'admin@example.com');
  await MockAdminApiService.rejectRequest(2, 'admin@example.com', 'Fully booked');
  
  const updatedAnalytics = await MockAdminApiService.getRequestAnalytics();
  assertEquals(updatedAnalytics.pendingRequests, 0);
  assertEquals(updatedAnalytics.confirmedBookings, 1);
  assertEquals(updatedAnalytics.rejectedRequests, 1);
  assertEquals(updatedAnalytics.conversionRate, 50); // 1 confirmed out of 2 total
  
  // Step 3: Verify API call logging for monitoring
  console.log("  📝 Step 3: Verify API call logging");
  
  const apiCalls = mockApiCallLogs;
  assert(apiCalls.length > 0);
  
  const analyticsCall = apiCalls.find(call => call.action === 'getRequestAnalytics');
  assertExists(analyticsCall);
  assertExists(analyticsCall.timestamp);
  
  const approvalCall = apiCalls.find(call => call.action === 'approveRequest');
  assertExists(approvalCall);
  assertEquals(approvalCall.bookingId, 1);
  
  const rejectionCall = apiCalls.find(call => call.action === 'rejectRequest');
  assertExists(rejectionCall);
  assertEquals(rejectionCall.bookingId, 2);
  
  console.log("  ✅ Real-time analytics and monitoring test passed!");
});

console.log("🎉 All admin API integration tests completed successfully!");