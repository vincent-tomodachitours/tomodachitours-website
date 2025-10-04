/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { BookingRequestLogger, BookingRequestEventType, LogSeverity } from './booking-request-logger.ts';
import { AdminNotificationService, SystemErrorNotification } from './admin-notification-service.ts';
import { RetryService, RetryResult } from './retry-service.ts';

export interface ErrorContext {
  bookingId?: number;
  operation: string;
  customerEmail?: string;
  adminId?: string;
  correlationId?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecoveryOptions {
  enableRetry?: boolean;
  maxRetries?: number;
  notifyAdmins?: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fallbackAction?: () => Promise<any>;
}

export class BookingRequestErrorHandler {
  private logger: BookingRequestLogger;
  private adminNotificationService: AdminNotificationService;
  private supabase: any;

  constructor(
    supabase: any,
    adminNotificationService: AdminNotificationService
  ) {
    this.supabase = supabase;
    this.logger = new BookingRequestLogger(supabase);
    this.adminNotificationService = adminNotificationService;
  }

  /**
   * Handle and recover from errors with comprehensive logging and notifications
   */
  async handleError<T>(
    error: Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions = {}
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    const {
      enableRetry = false,
      maxRetries = 3,
      notifyAdmins = false,
      severity = 'MEDIUM',
      fallbackAction
    } = options;

    try {
      // Set correlation ID if provided
      if (context.correlationId) {
        this.logger.setCorrelationId(context.correlationId);
      }

      // Log the error
      await this.logError(error, context, severity);

      // Determine if error is recoverable
      const isRecoverable = this.isRecoverableError(error);

      // If retry is enabled and error is recoverable, attempt recovery
      if (enableRetry && isRecoverable) {
        console.log(`Attempting error recovery for ${context.operation}`);
        
        if (fallbackAction) {
          const retryResult = await RetryService.executeWithRetry(
            fallbackAction,
            { maxRetries },
            `error-recovery-${context.operation}`
          );

          if (retryResult.success) {
            // Log successful recovery
            if (context.bookingId) {
              await this.logger.logEvent(
                context.bookingId,
                BookingRequestEventType.SYSTEM_ERROR,
                `Error recovery successful for ${context.operation}`,
                {
                  original_error: error.message,
                  recovery_attempts: retryResult.attempts,
                  recovery_duration: retryResult.totalDuration
                },
                LogSeverity.INFO
              );
            }

            return { success: true, result: retryResult.result };
          } else {
            // Recovery failed - escalate
            await this.escalateError(error, context, 'CRITICAL', retryResult.attempts);
          }
        }
      }

      // Send admin notifications if requested or if error is critical
      if (notifyAdmins || severity === 'CRITICAL') {
        await this.notifyAdmins(error, context, severity);
      }

      return { success: false, error };

    } catch (handlingError) {
      // Critical: error handler itself failed
      console.error('CRITICAL: Error handler failed:', handlingError);
      console.error('Original error:', error);
      console.error('Context:', context);

      // Last resort: try to send critical alert
      try {
        await this.adminNotificationService.sendCriticalAlert(
          'Error Handler Failure',
          `The error handling system itself failed while processing: ${error.message}`,
          context.bookingId,
          { 
            originalError: error instanceof Error ? error.message : 'Unknown error', 
            handlingError: handlingError instanceof Error ? handlingError.message : 'Unknown error', 
            context 
          }
        );
      } catch (alertError) {
        console.error('CATASTROPHIC: Cannot send critical alert:', alertError);
      }

      return { success: false, error };
    }
  }

  /**
   * Handle payment processing errors with specific recovery logic
   */
  async handlePaymentError(
    error: Error,
    bookingId: number,
    paymentMethodId: string,
    amount: number,
    customerEmail: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; shouldRetry: boolean; error?: Error }> {
    try {
      // Log payment failure
      await this.logger.logPaymentFailed(
        bookingId,
        amount,
        error.message,
        this.extractErrorCode(error),
        retryCount
      );

      // Determine if payment error is retryable
      const shouldRetry = this.isRetryablePaymentError(error) && retryCount < 2;

      // If not retryable or max retries reached, notify admins
      if (!shouldRetry) {
        await this.adminNotificationService.notifyPaymentFailure({
          bookingId,
          customerEmail,
          customerName: 'Customer', // Would need to fetch from booking
          tourName: 'Uji Tour', // Would need to fetch from booking
          amount,
          paymentMethodId,
          errorMessage: error.message,
          retryCount,
          timestamp: new Date().toISOString()
        });

        // Log that we've given up on retries
        await this.logger.logEvent(
          bookingId,
          BookingRequestEventType.PAYMENT_ABANDONED,
          `Payment abandoned after ${retryCount} retries: ${error.message}`,
          {
            amount,
            payment_method_id: paymentMethodId,
            final_error: error.message,
            total_retries: retryCount
          },
          LogSeverity.ERROR
        );
      }

      return { success: false, shouldRetry, error };

    } catch (handlingError) {
      console.error('Error handling payment error:', handlingError);
      return { success: false, shouldRetry: false, error };
    }
  }

  /**
   * Handle email sending errors with retry logic
   */
  async handleEmailError(
    error: Error,
    bookingId: number,
    emailType: string,
    recipientEmail: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; shouldRetry: boolean }> {
    try {
      // Log email failure
      await this.logger.logEmailFailed(
        bookingId,
        emailType,
        recipientEmail,
        error.message,
        retryCount
      );

      // Determine if email error is retryable
      const shouldRetry = this.isRetryableEmailError(error) && retryCount < 3;

      // Store in email_failures table for manual follow-up
      await this.supabase
        .from('email_failures')
        .insert({
          booking_id: bookingId,
          customer_email: recipientEmail,
          email_type: emailType,
          failure_reason: error.message,
          booking_details: {
            retry_count: retryCount,
            error_details: error.message,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      // If max retries reached, notify admins
      if (!shouldRetry) {
        await this.adminNotificationService.notifySystemError({
          bookingId,
          errorType: 'EMAIL_DELIVERY_FAILURE',
          errorMessage: `Failed to send ${emailType} email to ${recipientEmail}: ${error.message}`,
          severity: 'MEDIUM',
          operation: 'email_delivery',
          timestamp: new Date().toISOString(),
          metadata: {
            email_type: emailType,
            recipient: recipientEmail,
            retry_count: retryCount
          }
        });
      }

      return { success: false, shouldRetry };

    } catch (handlingError) {
      console.error('Error handling email error:', handlingError);
      return { success: false, shouldRetry: false };
    }
  }

  /**
   * Handle database operation errors
   */
  async handleDatabaseError(
    error: Error,
    operation: string,
    context: ErrorContext
  ): Promise<{ success: boolean; shouldRetry: boolean }> {
    try {
      const shouldRetry = this.isRetryableDatabaseError(error);

      // Log database error
      if (context.bookingId) {
        await this.logger.logEvent(
          context.bookingId,
          BookingRequestEventType.DATABASE_ERROR,
          `Database error in ${operation}: ${error.message}`,
          {
            operation,
            error_details: error.message,
            error_code: this.extractErrorCode(error),
            ...context.metadata
          },
          LogSeverity.ERROR
        );
      }

      // Notify admins for critical database errors
      if (!shouldRetry || operation.includes('critical')) {
        await this.adminNotificationService.notifySystemError({
          bookingId: context.bookingId,
          errorType: 'DATABASE_ERROR',
          errorMessage: `Database operation failed: ${operation} - ${error.message}`,
          severity: 'HIGH',
          operation,
          timestamp: new Date().toISOString(),
          metadata: context.metadata
        });
      }

      return { success: false, shouldRetry };

    } catch (handlingError) {
      console.error('Error handling database error:', handlingError);
      return { success: false, shouldRetry: false };
    }
  }

  /**
   * Log error with appropriate severity and context
   */
  private async logError(
    error: Error,
    context: ErrorContext,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<void> {
    const logSeverity = this.mapSeverityToLogLevel(severity);

    if (context.bookingId) {
      await this.logger.logSystemError(
        context.bookingId,
        context.operation,
        error.message,
        this.extractErrorCode(error),
        error.stack
      );
    } else {
      console.error(`[${severity}] Error in ${context.operation}:`, error);
    }
  }

  /**
   * Escalate error to admins with critical priority
   */
  private async escalateError(
    error: Error,
    context: ErrorContext,
    severity: 'CRITICAL',
    retryAttempts?: number
  ): Promise<void> {
    await this.adminNotificationService.notifySystemError({
      bookingId: context.bookingId,
      errorType: 'ESCALATED_ERROR',
      errorMessage: `Error escalated after recovery attempts: ${error.message}`,
      severity,
      operation: context.operation,
      timestamp: new Date().toISOString(),
      metadata: {
        ...context.metadata,
        retry_attempts: retryAttempts,
        escalation_reason: 'Recovery failed'
      },
      stackTrace: error.stack
    });
  }

  /**
   * Send admin notifications for errors
   */
  private async notifyAdmins(
    error: Error,
    context: ErrorContext,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<void> {
    await this.adminNotificationService.notifySystemError({
      bookingId: context.bookingId,
      errorType: 'SYSTEM_ERROR',
      errorMessage: error.message,
      severity,
      operation: context.operation,
      timestamp: new Date().toISOString(),
      metadata: context.metadata,
      stackTrace: error.stack
    });
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /rate.?limit/i,
      /service.?unavailable/i,
      /connection/i,
      /deadlock/i
    ];

    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Determine if a payment error is retryable
   */
  private isRetryablePaymentError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /processing.?error/i,
      /service.?unavailable/i,
      /rate.?limit/i
    ];

    const nonRetryablePatterns = [
      /insufficient.?funds/i,
      /card.?declined/i,
      /invalid.?card/i,
      /expired.?card/i,
      /authentication.?required/i,
      /do.?not.?honor/i
    ];

    // Don't retry if it's a definitive decline
    if (nonRetryablePatterns.some(pattern => pattern.test(error.message))) {
      return false;
    }

    // Retry if it matches retryable patterns
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Determine if an email error is retryable
   */
  private isRetryableEmailError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /rate.?limit/i,
      /service.?unavailable/i,
      /sendgrid/i
    ];

    const nonRetryablePatterns = [
      /invalid.?email/i,
      /blocked/i,
      /bounced/i,
      /unsubscribed/i,
      /suppressed/i
    ];

    // Don't retry if it's a definitive failure
    if (nonRetryablePatterns.some(pattern => pattern.test(error.message))) {
      return false;
    }

    // Retry if it matches retryable patterns
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Determine if a database error is retryable
   */
  private isRetryableDatabaseError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /deadlock/i,
      /lock.?timeout/i,
      /temporary/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Extract error code from error message or object
   */
  private extractErrorCode(error: Error): string | undefined {
    // Try to extract error code from various error formats
    const codePatterns = [
      /code[:\s]+([A-Z0-9_]+)/i,
      /error[:\s]+([A-Z0-9_]+)/i,
      /\[([A-Z0-9_]+)\]/i
    ];

    for (const pattern of codePatterns) {
      const match = error.message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Check if error object has a code property
    if ('code' in error) {
      return (error as any).code;
    }

    return undefined;
  }

  /**
   * Map severity levels to log levels
   */
  private mapSeverityToLogLevel(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): LogSeverity {
    switch (severity) {
      case 'LOW': return LogSeverity.INFO;
      case 'MEDIUM': return LogSeverity.WARNING;
      case 'HIGH': return LogSeverity.ERROR;
      case 'CRITICAL': return LogSeverity.CRITICAL;
      default: return LogSeverity.WARNING;
    }
  }
}