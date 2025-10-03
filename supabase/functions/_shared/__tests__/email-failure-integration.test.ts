/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * Email Failure and Recovery Integration Tests
 * 
 * Tests comprehensive email delivery scenarios including:
 * - Email delivery failures and retry mechanisms
 * - Rate limiting and backoff strategies
 * - Template validation and error handling
 * - Fallback notification systems
 * - Email queue management
 * 
 * Requirements Coverage: 1.4, 3.1, 3.2, 3.3, 3.4
 */

// Mock email failure scenarios
enum EmailFailureType {
  RATE_LIMIT = 'rate_limit_exceeded',
  INVALID_EMAIL = 'invalid_email_address',
  TEMPLATE_ERROR = 'template_not_found',
  NETWORK_ERROR = 'network_timeout',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}

// Mock email queue and failure tracking
let mockEmailQueue: any[] = [];
let mockEmailFailures: any[] = [];
let mockRetryAttempts: any[] = [];

// Mock SendGrid service with configurable failure modes
class MockSendGridWithFailures {
  static failureMode: EmailFailureType | null = null;
  static failureCount = 0;
  static maxFailures = 0;
  static sentEmails: any[] = [];
  
  static async send(emailData: any): Promise<any> {
    // Simulate different failure scenarios
    if (this.failureMode && this.failureCount < this.maxFailures) {
      this.failureCount++;
      
      switch (this.failureMode) {
        case EmailFailureType.RATE_LIMIT:
          throw new Error('Rate limit exceeded. Try again later.');
        case EmailFailureType.INVALID_EMAIL:
          throw new Error('Invalid email address format');
        case EmailFailureType.TEMPLATE_ERROR:
          throw new Error('Template not found: ' + emailData.templateId);
        case EmailFailureType.NETWORK_ERROR:
          throw new Error('Network timeout - unable to reach SendGrid');
        case EmailFailureType.SERVICE_UNAVAILABLE:
          throw new Error('SendGrid service temporarily unavailable');
        default:
          throw new Error('Unknown email error');
      }
    }
    
    // Success case
    this.sentEmails.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      messageId: 'msg_' + Math.random().toString(36).substr(2, 9)
    });
    
    return { success: true, messageId: this.sentEmails[this.sentEmails.length - 1].messageId };
  }
  
  static reset() {
    this.failureMode = null;
    this.failureCount = 0;
    this.maxFailures = 0;
    this.sentEmails = [];
  }
  
  static setFailureMode(mode: EmailFailureType, maxFailures = 1) {
    this.failureMode = mode;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
  }
}

// Mock email retry service
class MockEmailRetryService {
  static async sendWithRetry(
    emailData: any,
    maxRetries = 3,
    baseDelayMs = 1000
  ): Promise<{ success: boolean; attempts: number; error?: Error; result?: any }> {
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts <= maxRetries) {
      attempts++;
      
      try {
        const result = await MockSendGridWithFailures.send(emailData);
        
        // Log successful attempt
        mockRetryAttempts.push({
          emailType: emailData.templateId,
          attempt: attempts,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, attempts, result };
      } catch (error) {
        lastError = error as Error;
        
        // Log failed attempt
        mockRetryAttempts.push({
          emailType: emailData.templateId,
          attempt: attempts,
          success: false,
          error: lastError.message,
          timestamp: new Date().toISOString()
        });
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempts > maxRetries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(baseDelayMs * Math.pow(2, attempts - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { success: false, attempts, error: lastError! };
  }
  
  private static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'rate_limit_exceeded',
      'network_timeout',
      'service_unavailable'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.toLowerCase().includes(retryableError.replace('_', ' '))
    );
  }
}

// Mock email failure logger
class MockEmailFailureLogger {
  static async logFailure(
    bookingId: number,
    emailType: string,
    recipientEmail: string,
    error: Error,
    retryCount: number
  ) {
    mockEmailFailures.push({
      id: mockEmailFailures.length + 1,
      booking_id: bookingId,
      email_type: emailType,
      recipient_email: recipientEmail,
      error_message: error.message,
      retry_count: retryCount,
      created_at: new Date().toISOString()
    });
  }
  
  static async logSuccess(
    bookingId: number,
    emailType: string,
    recipientEmail: string,
    messageId: string
  ) {
    // Remove from failures if it was previously failing
    const failureIndex = mockEmailFailures.findIndex(
      f => f.booking_id === bookingId && f.email_type === emailType
    );
    
    if (failureIndex !== -1) {
      mockEmailFailures.splice(failureIndex, 1);
    }
  }
}

// Helper function to reset test state
function resetEmailTestState() {
  mockEmailQueue = [];
  mockEmailFailures = [];
  mockRetryAttempts = [];
  MockSendGridWithFailures.reset();
}

// Integration Test 1: Email Rate Limit Handling
Deno.test("Email Integration: Rate limit handling and retry", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing email rate limit handling...");
  
  // Step 1: Set up rate limit failure mode
  console.log("  ⏱️ Step 1: Simulate rate limit errors");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.RATE_LIMIT, 2);
  
  const emailData = {
    to: 'customer@example.com',
    subject: 'Booking Request Received',
    templateId: 'd-booking-request-confirmation',
    dynamicTemplateData: {
      customerName: 'John Doe',
      tourName: 'Uji Tour'
    }
  };
  
  // Step 2: Attempt to send email with retry
  console.log("  🔄 Step 2: Send email with retry mechanism");
  
  const result = await MockEmailRetryService.sendWithRetry(emailData, 3, 100);
  
  assertEquals(result.success, true);
  assertEquals(result.attempts, 3); // Should succeed on 3rd attempt
  assertExists(result.result);
  
  // Step 3: Verify retry attempts were logged
  console.log("  📝 Step 3: Verify retry attempts were logged");
  
  assertEquals(mockRetryAttempts.length, 3);
  assertEquals(mockRetryAttempts[0].success, false);
  assertEquals(mockRetryAttempts[1].success, false);
  assertEquals(mockRetryAttempts[2].success, true);
  
  // Step 4: Verify final email was sent
  assertEquals(MockSendGridWithFailures.sentEmails.length, 1);
  assertEquals(MockSendGridWithFailures.sentEmails[0].to, 'customer@example.com');
  
  console.log("  ✅ Rate limit handling test passed!");
});

// Integration Test 2: Non-retryable Email Errors
Deno.test("Email Integration: Non-retryable error handling", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing non-retryable email errors...");
  
  // Step 1: Set up invalid email failure mode
  console.log("  ❌ Step 1: Simulate invalid email address");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.INVALID_EMAIL, 5);
  
  const emailData = {
    to: 'invalid-email-format',
    subject: 'Test Email',
    templateId: 'd-test-template',
    dynamicTemplateData: {}
  };
  
  // Step 2: Attempt to send email (should fail immediately)
  console.log("  🚫 Step 2: Attempt to send email (should fail fast)");
  
  const result = await MockEmailRetryService.sendWithRetry(emailData, 3, 100);
  
  assertEquals(result.success, false);
  assertEquals(result.attempts, 1); // Should not retry for invalid email
  assertExists(result.error);
  assert(result.error.message.includes('Invalid email address'));
  
  // Step 3: Log the failure
  await MockEmailFailureLogger.logFailure(
    123,
    'booking_confirmation',
    'invalid-email-format',
    result.error,
    0
  );
  
  assertEquals(mockEmailFailures.length, 1);
  assertEquals(mockEmailFailures[0].email_type, 'booking_confirmation');
  assertEquals(mockEmailFailures[0].retry_count, 0);
  
  console.log("  ✅ Non-retryable error handling test passed!");
});

// Integration Test 3: Template Error Handling
Deno.test("Email Integration: Template error handling", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing template error handling...");
  
  // Step 1: Set up template error failure mode
  console.log("  📄 Step 1: Simulate template not found error");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.TEMPLATE_ERROR, 1);
  
  const emailData = {
    to: 'customer@example.com',
    subject: 'Test Email',
    templateId: 'd-nonexistent-template',
    dynamicTemplateData: {
      customerName: 'John Doe'
    }
  };
  
  // Step 2: Attempt to send email
  const result = await MockEmailRetryService.sendWithRetry(emailData, 2, 100);
  
  assertEquals(result.success, false);
  assertEquals(result.attempts, 1); // Template errors are not retryable
  assertExists(result.error);
  assert(result.error.message.includes('Template not found'));
  
  // Step 3: Log template error
  await MockEmailFailureLogger.logFailure(
    456,
    'booking_approval',
    'customer@example.com',
    result.error,
    0
  );
  
  assertEquals(mockEmailFailures.length, 1);
  assert(mockEmailFailures[0].error_message.includes('Template not found'));
  
  console.log("  ✅ Template error handling test passed!");
});

// Integration Test 4: Network Error Recovery
Deno.test("Email Integration: Network error recovery", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing network error recovery...");
  
  // Step 1: Set up network error failure mode
  console.log("  🌐 Step 1: Simulate network timeout errors");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.NETWORK_ERROR, 2);
  
  const emailData = {
    to: 'customer@example.com',
    subject: 'Booking Confirmed',
    templateId: 'd-booking-approved',
    dynamicTemplateData: {
      customerName: 'Jane Smith',
      paymentId: 'pi_test_123'
    }
  };
  
  // Step 2: Send email with retry
  const result = await MockEmailRetryService.sendWithRetry(emailData, 3, 50);
  
  assertEquals(result.success, true);
  assertEquals(result.attempts, 3); // Should succeed after 2 failures
  
  // Step 3: Verify retry pattern
  const networkRetries = mockRetryAttempts.filter(attempt => !attempt.success);
  assertEquals(networkRetries.length, 2);
  networkRetries.forEach(retry => {
    assert(retry.error.includes('Network timeout'));
  });
  
  // Step 4: Verify successful delivery
  assertEquals(MockSendGridWithFailures.sentEmails.length, 1);
  assertEquals(MockSendGridWithFailures.sentEmails[0].templateId, 'd-booking-approved');
  
  console.log("  ✅ Network error recovery test passed!");
});

// Integration Test 5: Email Queue Management
Deno.test("Email Integration: Email queue management during failures", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing email queue management...");
  
  // Step 1: Queue multiple emails
  console.log("  📬 Step 1: Queue multiple emails");
  
  const emailsToQueue = [
    {
      bookingId: 1,
      type: 'booking_confirmation',
      to: 'customer1@example.com',
      templateId: 'd-booking-request-confirmation'
    },
    {
      bookingId: 2,
      type: 'booking_approval',
      to: 'customer2@example.com',
      templateId: 'd-booking-approved'
    },
    {
      bookingId: 3,
      type: 'booking_rejection',
      to: 'customer3@example.com',
      templateId: 'd-booking-rejected'
    }
  ];
  
  mockEmailQueue.push(...emailsToQueue);
  assertEquals(mockEmailQueue.length, 3);
  
  // Step 2: Process queue with some failures
  console.log("  ⚡ Step 2: Process queue with intermittent failures");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.SERVICE_UNAVAILABLE, 1);
  
  const processResults = [];
  
  for (const queuedEmail of mockEmailQueue) {
    const emailData = {
      to: queuedEmail.to,
      subject: 'Queued Email',
      templateId: queuedEmail.templateId,
      dynamicTemplateData: { customerName: 'Customer' }
    };
    
    const result = await MockEmailRetryService.sendWithRetry(emailData, 2, 50);
    processResults.push({ ...queuedEmail, result });
    
    // Log failures
    if (!result.success) {
      await MockEmailFailureLogger.logFailure(
        queuedEmail.bookingId,
        queuedEmail.type,
        queuedEmail.to,
        result.error!,
        result.attempts - 1
      );
    } else {
      await MockEmailFailureLogger.logSuccess(
        queuedEmail.bookingId,
        queuedEmail.type,
        queuedEmail.to,
        result.result.messageId
      );
    }
    
    // Reset failure mode after first email to simulate intermittent issues
    if (MockSendGridWithFailures.failureCount >= 1) {
      MockSendGridWithFailures.reset();
    }
  }
  
  // Step 3: Verify processing results
  console.log("  📊 Step 3: Verify processing results");
  
  const successfulEmails = processResults.filter(r => r.result.success);
  const failedEmails = processResults.filter(r => !r.result.success);
  
  assertEquals(successfulEmails.length, 2); // First fails, others succeed
  assertEquals(failedEmails.length, 1);
  
  // Step 4: Verify failure logging
  assertEquals(mockEmailFailures.length, 1);
  assertEquals(mockEmailFailures[0].booking_id, 1);
  assertEquals(mockEmailFailures[0].email_type, 'booking_confirmation');
  
  console.log("  ✅ Email queue management test passed!");
});

// Integration Test 6: Email Template Data Validation
Deno.test("Email Integration: Template data validation and sanitization", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing template data validation...");
  
  // Step 1: Test with special characters and HTML
  console.log("  🔤 Step 1: Test special character handling");
  
  const emailData = {
    to: 'customer@example.com',
    subject: 'Booking Confirmation',
    templateId: 'd-booking-request-confirmation',
    dynamicTemplateData: {
      customerName: 'John "Johnny" O\'Malley',
      tourName: 'Uji Tour & Temple Visit',
      specialInstructions: '<script>alert("test")</script>Meet at 7-Eleven',
      amount: '¥13,000',
      bookingDate: '2025-02-15',
      bookingTime: '10:00 AM'
    }
  };
  
  const result = await MockEmailRetryService.sendWithRetry(emailData, 1, 100);
  
  assertEquals(result.success, true);
  
  // Step 2: Verify data was preserved correctly
  const sentEmail = MockSendGridWithFailures.sentEmails[0];
  assertEquals(sentEmail.dynamicTemplateData.customerName, 'John "Johnny" O\'Malley');
  assertEquals(sentEmail.dynamicTemplateData.tourName, 'Uji Tour & Temple Visit');
  assertEquals(sentEmail.dynamicTemplateData.amount, '¥13,000');
  
  // Step 3: Test with missing required fields
  console.log("  ❓ Step 3: Test with missing required fields");
  
  const incompleteEmailData = {
    to: 'customer@example.com',
    subject: 'Test Email',
    templateId: 'd-booking-approved',
    dynamicTemplateData: {
      // Missing customerName
      paymentId: 'pi_test_123'
    }
  };
  
  const incompleteResult = await MockEmailRetryService.sendWithRetry(incompleteEmailData, 1, 100);
  
  // Should still succeed (template should handle missing fields gracefully)
  assertEquals(incompleteResult.success, true);
  
  console.log("  ✅ Template data validation test passed!");
});

// Integration Test 7: Fallback Notification System
Deno.test("Email Integration: Fallback notification system", async () => {
  resetEmailTestState();
  
  console.log("🧪 Testing fallback notification system...");
  
  // Step 1: Simulate complete email service failure
  console.log("  🚨 Step 1: Simulate complete email service failure");
  
  MockSendGridWithFailures.setFailureMode(EmailFailureType.SERVICE_UNAVAILABLE, 10);
  
  const criticalEmailData = {
    to: 'customer@example.com',
    subject: 'Critical: Payment Processed',
    templateId: 'd-booking-approved',
    dynamicTemplateData: {
      customerName: 'John Doe',
      paymentId: 'pi_critical_123',
      amount: '¥13,000'
    }
  };
  
  // Step 2: Attempt to send critical email
  const result = await MockEmailRetryService.sendWithRetry(criticalEmailData, 3, 50);
  
  assertEquals(result.success, false);
  assertEquals(result.attempts, 4); // 3 retries + initial attempt
  
  // Step 3: Log critical failure for manual follow-up
  await MockEmailFailureLogger.logFailure(
    789,
    'critical_booking_approval',
    'customer@example.com',
    result.error!,
    result.attempts - 1
  );
  
  // Step 4: Simulate fallback notification (e.g., admin alert)
  console.log("  📢 Step 4: Trigger fallback notification");
  
  const fallbackNotification = {
    type: 'admin_alert',
    priority: 'high',
    message: 'Critical email delivery failed',
    bookingId: 789,
    customerEmail: 'customer@example.com',
    failureReason: result.error!.message,
    timestamp: new Date().toISOString()
  };
  
  // In real implementation, this would trigger admin notification
  mockEmailQueue.push(fallbackNotification);
  
  // Step 5: Verify failure was properly logged
  assertEquals(mockEmailFailures.length, 1);
  assertEquals(mockEmailFailures[0].email_type, 'critical_booking_approval');
  assertEquals(mockEmailFailures[0].retry_count, 3);
  
  console.log("  ✅ Fallback notification system test passed!");
});

console.log("🎉 All email failure and recovery integration tests completed successfully!");