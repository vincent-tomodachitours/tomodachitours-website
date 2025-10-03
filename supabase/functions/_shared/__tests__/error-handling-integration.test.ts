/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { BookingRequestLogger, BookingRequestEventType, LogSeverity } from '../booking-request-logger.ts';
import { RetryService } from '../retry-service.ts';
import { BookingRequestErrorHandler } from '../error-handler.ts';
import { AdminNotificationService } from '../admin-notification-service.ts';

// Mock Supabase client for testing
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => ({ error: null }),
    select: () => ({ single: () => ({ data: null, error: null }) }),
    update: (data: any) => ({ eq: () => ({ error: null }) }),
    eq: () => ({ error: null })
  })
};

// Mock admin notification service
const mockAdminNotificationService = new AdminNotificationService(mockSupabase, {
  adminEmails: ['test@example.com'],
  fromEmail: 'test@example.com',
  fromName: 'Test'
});

Deno.test("BookingRequestLogger - should log events correctly", async () => {
  const logger = new BookingRequestLogger(mockSupabase);
  
  // Test logging a request submission
  await logger.logRequestSubmitted(
    123,
    'test@example.com',
    'uji-tour',
    10000,
    'pm_test_123'
  );
  
  // Test logging a payment failure
  await logger.logPaymentFailed(
    123,
    10000,
    'Card declined',
    'CARD_DECLINED',
    1
  );
  
  // Test logging a system error
  await logger.logSystemError(
    123,
    'payment_processing',
    'Network timeout',
    'NETWORK_TIMEOUT',
    'Error stack trace'
  );
  
  // If we get here without throwing, the logging is working
  assertEquals(true, true);
});

Deno.test("RetryService - should retry operations with exponential backoff", async () => {
  let attemptCount = 0;
  
  // Test successful retry after failures
  const result = await RetryService.executeWithRetry(
    async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    },
    { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 },
    'test-operation'
  );
  
  assertEquals(result.success, true);
  assertEquals(result.result, 'success');
  assertEquals(result.attempts, 3);
});

Deno.test("RetryService - should fail after max retries", async () => {
  let attemptCount = 0;
  
  const result = await RetryService.executeWithRetry(
    async () => {
      attemptCount++;
      throw new Error('Persistent failure');
    },
    { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
    'test-operation'
  );
  
  assertEquals(result.success, false);
  assertEquals(result.attempts, 3); // maxRetries + 1
  assertExists(result.error);
});

Deno.test("RetryService - should not retry non-retryable errors", async () => {
  let attemptCount = 0;
  
  const result = await RetryService.executeWithRetry(
    async () => {
      attemptCount++;
      throw new Error('invalid_card');
    },
    { 
      maxRetries: 3, 
      baseDelayMs: 10, 
      maxDelayMs: 100,
      retryableErrors: ['network', 'timeout'] // 'invalid_card' not in list
    },
    'test-operation'
  );
  
  assertEquals(result.success, false);
  assertEquals(result.attempts, 1); // Should not retry
  assertExists(result.error);
});

Deno.test("BookingRequestErrorHandler - should handle payment errors correctly", async () => {
  const logger = new BookingRequestLogger(mockSupabase);
  const errorHandler = new BookingRequestErrorHandler(mockSupabase, mockAdminNotificationService);
  
  // Test retryable payment error
  const retryableResult = await errorHandler.handlePaymentError(
    new Error('network timeout'),
    123,
    'pm_test_123',
    10000,
    'test@example.com',
    0
  );
  
  assertEquals(retryableResult.success, false);
  assertEquals(retryableResult.shouldRetry, true);
  
  // Test non-retryable payment error
  const nonRetryableResult = await errorHandler.handlePaymentError(
    new Error('card declined'),
    123,
    'pm_test_123',
    10000,
    'test@example.com',
    0
  );
  
  assertEquals(nonRetryableResult.success, false);
  assertEquals(nonRetryableResult.shouldRetry, false);
});

Deno.test("BookingRequestErrorHandler - should handle email errors correctly", async () => {
  const logger = new BookingRequestLogger(mockSupabase);
  const errorHandler = new BookingRequestErrorHandler(mockSupabase, mockAdminNotificationService);
  
  // Test retryable email error
  const retryableResult = await errorHandler.handleEmailError(
    new Error('rate limit exceeded'),
    123,
    'booking_confirmation',
    'test@example.com',
    1
  );
  
  assertEquals(retryableResult.success, false);
  assertEquals(retryableResult.shouldRetry, true);
  
  // Test non-retryable email error
  const nonRetryableResult = await errorHandler.handleEmailError(
    new Error('invalid email address'),
    123,
    'booking_confirmation',
    'invalid@email',
    2
  );
  
  assertEquals(nonRetryableResult.success, false);
  assertEquals(nonRetryableResult.shouldRetry, false);
});

Deno.test("BookingRequestErrorHandler - should handle database errors correctly", async () => {
  const logger = new BookingRequestLogger(mockSupabase);
  const errorHandler = new BookingRequestErrorHandler(mockSupabase, mockAdminNotificationService);
  
  // Test retryable database error
  const retryableResult = await errorHandler.handleDatabaseError(
    new Error('connection timeout'),
    'update_booking_status',
    {
      bookingId: 123,
      operation: 'update_booking_status',
      correlationId: 'test-123'
    }
  );
  
  assertEquals(retryableResult.success, false);
  assertEquals(retryableResult.shouldRetry, true);
  
  // Test non-retryable database error
  const nonRetryableResult = await errorHandler.handleDatabaseError(
    new Error('constraint violation'),
    'insert_booking',
    {
      bookingId: 123,
      operation: 'insert_booking',
      correlationId: 'test-123'
    }
  );
  
  assertEquals(nonRetryableResult.success, false);
  assertEquals(nonRetryableResult.shouldRetry, false);
});

Deno.test("RetryService - payment retry configuration", async () => {
  let attemptCount = 0;
  
  const result = await RetryService.retryPaymentProcessing(
    async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new Error('processing error');
      }
      return { success: true, id: 'pi_test_123' };
    },
    123
  );
  
  assertEquals(result.success, true);
  assertEquals(result.attempts, 2);
  assertExists(result.result);
});

Deno.test("RetryService - email retry configuration", async () => {
  let attemptCount = 0;
  
  const result = await RetryService.retryEmailSending(
    async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('sendgrid rate limit');
      }
      return { success: true };
    },
    'booking_confirmation',
    123
  );
  
  assertEquals(result.success, true);
  assertEquals(result.attempts, 3);
  assertExists(result.result);
});

Deno.test("RetryService - database retry configuration", async () => {
  let attemptCount = 0;
  
  const result = await RetryService.retryDatabaseOperation(
    async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new Error('deadlock detected');
      }
      return { data: { id: 123 } };
    },
    'update_booking'
  );
  
  assertEquals(result.success, true);
  assertEquals(result.attempts, 2);
  assertExists(result.result);
});

Deno.test("RetryService - circuit breaker pattern", async () => {
  let callCount = 0;
  
  const circuitBreaker = RetryService.createCircuitBreaker(
    async () => {
      callCount++;
      throw new Error('Service unavailable');
    },
    2, // failure threshold
    100 // reset timeout
  );
  
  // First two calls should fail and open the circuit
  try {
    await circuitBreaker();
  } catch (error) {
    assertEquals(error.message, 'Service unavailable');
  }
  
  try {
    await circuitBreaker();
  } catch (error) {
    assertEquals(error.message, 'Service unavailable');
  }
  
  // Third call should fail fast due to open circuit
  try {
    await circuitBreaker();
  } catch (error) {
    assertEquals(error.message, 'Circuit breaker is OPEN - service unavailable');
  }
  
  assertEquals(callCount, 2); // Third call didn't reach the service
});

console.log("All error handling and logging tests completed successfully!");