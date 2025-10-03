/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

export enum BookingRequestEventType {
  // Request lifecycle events
  REQUEST_SUBMITTED = 'request.submitted',
  REQUEST_APPROVED = 'request.approved',
  REQUEST_REJECTED = 'request.rejected',
  REQUEST_TIMEOUT = 'request.timeout',
  REQUEST_EXPIRED = 'request.expired',

  // Payment events
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_RETRY = 'payment.retry',
  PAYMENT_ABANDONED = 'payment.abandoned',

  // Email events
  EMAIL_SENT = 'email.sent',
  EMAIL_FAILED = 'email.failed',
  EMAIL_RETRY = 'email.retry',

  // System events
  SYSTEM_ERROR = 'system.error',
  VALIDATION_ERROR = 'validation.error',
  DATABASE_ERROR = 'database.error',
  EXTERNAL_SERVICE_ERROR = 'external_service.error',

  // Admin events
  ADMIN_ACTION = 'admin.action',
  ADMIN_NOTIFICATION = 'admin.notification',
  ADMIN_ERROR = 'admin.error'
}

export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface BookingRequestLogEntry {
  id?: number;
  booking_id: number;
  event_type: BookingRequestEventType;
  severity: LogSeverity;
  message: string;
  metadata: {
    admin_id?: string;
    customer_email?: string;
    payment_method_id?: string;
    amount?: number;
    error_code?: string;
    error_details?: string;
    retry_count?: number;
    correlation_id?: string;
    user_agent?: string;
    ip_address?: string;
    [key: string]: any;
  };
  created_at?: string;
  created_by?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class BookingRequestLogger {
  private supabase: any;
  private correlationId?: string;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  /**
   * Log a booking request event with structured data
   */
  async logEvent(
    bookingId: number,
    eventType: BookingRequestEventType,
    message: string,
    metadata: BookingRequestLogEntry['metadata'] = {},
    severity: LogSeverity = LogSeverity.INFO,
    createdBy: string = 'system'
  ): Promise<void> {
    try {
      const logEntry: BookingRequestLogEntry = {
        booking_id: bookingId,
        event_type: eventType,
        severity,
        message,
        metadata: {
          ...metadata,
          correlation_id: this.correlationId,
          timestamp: new Date().toISOString()
        },
        created_by: createdBy
      };

      // Store in booking_request_events table
      const { error: eventError } = await this.supabase
        .from('booking_request_events')
        .insert({
          booking_id: bookingId,
          event_type: eventType,
          event_data: {
            severity,
            message,
            ...metadata,
            correlation_id: this.correlationId
          },
          created_by: createdBy
        });

      if (eventError) {
        console.error('Failed to log booking request event:', eventError);
        // Don't throw - logging failures shouldn't break main flow
      }

      // For critical events, also log to console for immediate visibility
      if (severity === LogSeverity.CRITICAL || severity === LogSeverity.ERROR) {
        console.error(`[${severity}] ${eventType}: ${message}`, {
          bookingId,
          metadata,
          correlationId: this.correlationId
        });
      } else {
        console.log(`[${severity}] ${eventType}: ${message}`, {
          bookingId,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        });
      }

    } catch (error) {
      console.error('Critical error in booking request logger:', error);
      // Fallback to console logging
      console.error(`[FALLBACK LOG] ${eventType}: ${message}`, {
        bookingId,
        metadata,
        error: error.message
      });
    }
  }

  /**
   * Log request submission
   */
  async logRequestSubmitted(
    bookingId: number,
    customerEmail: string,
    tourType: string,
    amount: number,
    paymentMethodId: string
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.REQUEST_SUBMITTED,
      `Booking request submitted for ${tourType}`,
      {
        customer_email: customerEmail,
        tour_type: tourType,
        amount,
        payment_method_id: paymentMethodId
      },
      LogSeverity.INFO,
      'customer'
    );
  }

  /**
   * Log admin approval
   */
  async logRequestApproved(
    bookingId: number,
    adminId: string,
    amount: number
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.REQUEST_APPROVED,
      `Booking request approved by admin`,
      {
        admin_id: adminId,
        amount
      },
      LogSeverity.INFO,
      adminId
    );
  }

  /**
   * Log admin rejection
   */
  async logRequestRejected(
    bookingId: number,
    adminId: string,
    rejectionReason: string
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.REQUEST_REJECTED,
      `Booking request rejected: ${rejectionReason}`,
      {
        admin_id: adminId,
        rejection_reason: rejectionReason
      },
      LogSeverity.INFO,
      adminId
    );
  }

  /**
   * Log payment processing start
   */
  async logPaymentProcessing(
    bookingId: number,
    amount: number,
    paymentMethodId: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.PAYMENT_PROCESSING,
      `Processing payment for booking request`,
      {
        amount,
        payment_method_id: paymentMethodId,
        retry_count: retryCount
      },
      LogSeverity.INFO
    );
  }

  /**
   * Log payment success
   */
  async logPaymentSuccess(
    bookingId: number,
    amount: number,
    chargeId: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.PAYMENT_SUCCESS,
      `Payment processed successfully`,
      {
        amount,
        charge_id: chargeId,
        retry_count: retryCount
      },
      LogSeverity.INFO
    );
  }

  /**
   * Log payment failure
   */
  async logPaymentFailed(
    bookingId: number,
    amount: number,
    errorMessage: string,
    errorCode?: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.PAYMENT_FAILED,
      `Payment failed: ${errorMessage}`,
      {
        amount,
        error_details: errorMessage,
        error_code: errorCode,
        retry_count: retryCount
      },
      LogSeverity.ERROR
    );
  }

  /**
   * Log email sent successfully
   */
  async logEmailSent(
    bookingId: number,
    emailType: string,
    recipientEmail: string,
    templateId?: string
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.EMAIL_SENT,
      `Email sent successfully: ${emailType}`,
      {
        email_type: emailType,
        recipient_email: recipientEmail,
        template_id: templateId
      },
      LogSeverity.INFO
    );
  }

  /**
   * Log email failure
   */
  async logEmailFailed(
    bookingId: number,
    emailType: string,
    recipientEmail: string,
    errorMessage: string,
    retryCount: number = 0
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.EMAIL_FAILED,
      `Email failed: ${emailType} - ${errorMessage}`,
      {
        email_type: emailType,
        recipient_email: recipientEmail,
        error_details: errorMessage,
        retry_count: retryCount
      },
      LogSeverity.ERROR
    );
  }

  /**
   * Log system error
   */
  async logSystemError(
    bookingId: number,
    operation: string,
    errorMessage: string,
    errorCode?: string,
    stackTrace?: string
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.SYSTEM_ERROR,
      `System error in ${operation}: ${errorMessage}`,
      {
        operation,
        error_details: errorMessage,
        error_code: errorCode,
        stack_trace: stackTrace
      },
      LogSeverity.CRITICAL
    );
  }

  /**
   * Log validation error
   */
  async logValidationError(
    bookingId: number,
    field: string,
    errorMessage: string,
    providedValue?: any
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.VALIDATION_ERROR,
      `Validation error for ${field}: ${errorMessage}`,
      {
        field,
        error_details: errorMessage,
        provided_value: providedValue
      },
      LogSeverity.WARNING
    );
  }

  /**
   * Log admin notification sent
   */
  async logAdminNotification(
    bookingId: number,
    notificationType: string,
    adminEmails: string[],
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(
      bookingId,
      BookingRequestEventType.ADMIN_NOTIFICATION,
      success 
        ? `Admin notification sent: ${notificationType}`
        : `Admin notification failed: ${notificationType} - ${errorMessage}`,
      {
        notification_type: notificationType,
        admin_emails: adminEmails,
        success,
        error_details: errorMessage
      },
      success ? LogSeverity.INFO : LogSeverity.ERROR
    );
  }

  /**
   * Get recent events for a booking
   */
  async getBookingEvents(bookingId: number, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('booking_request_events')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch booking events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching booking events:', error);
      return [];
    }
  }

  /**
   * Get events by type for analysis
   */
  async getEventsByType(
    eventType: BookingRequestEventType,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('booking_request_events')
        .select('*')
        .eq('event_type', eventType);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch events by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events by type:', error);
      return [];
    }
  }
}