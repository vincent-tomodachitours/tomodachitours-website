/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import sgMail from "npm:@sendgrid/mail";
import { BookingRequestLogger, BookingRequestEventType, LogSeverity } from './booking-request-logger.ts';
import { RetryService } from './retry-service.ts';

export interface AdminNotificationConfig {
  adminEmails: string[];
  sendgridApiKey?: string;
  fromEmail: string;
  fromName: string;
  enableSlack?: boolean;
  slackWebhookUrl?: string;
}

export interface SystemErrorNotification {
  bookingId?: number;
  errorType: string;
  errorMessage: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  operation: string;
  timestamp: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export interface PaymentFailureNotification {
  bookingId: number;
  customerEmail: string;
  customerName: string;
  tourName: string;
  amount: number;
  paymentMethodId: string;
  errorMessage: string;
  retryCount: number;
  timestamp: string;
}

export class AdminNotificationService {
  private config: AdminNotificationConfig;
  private logger: BookingRequestLogger;
  private supabase: any;

  constructor(supabase: any, config: AdminNotificationConfig) {
    this.supabase = supabase;
    this.config = config;
    this.logger = new BookingRequestLogger(supabase);

    // Initialize SendGrid if API key is provided
    if (config.sendgridApiKey) {
      sgMail.setApiKey(config.sendgridApiKey);
    }
  }

  /**
   * Send system error notification to admins
   */
  async notifySystemError(notification: SystemErrorNotification): Promise<void> {
    try {
      console.log(`Sending system error notification: ${notification.errorType}`);

      // Log the notification attempt
      if (notification.bookingId) {
        await this.logger.logEvent(
          notification.bookingId,
          BookingRequestEventType.ADMIN_NOTIFICATION,
          `Sending system error notification: ${notification.errorType}`,
          {
            error_type: notification.errorType,
            severity: notification.severity,
            operation: notification.operation
          },
          LogSeverity.INFO
        );
      }

      // Send email notification with retry
      const emailResult = await RetryService.retryEmailSending(
        () => this.sendSystemErrorEmail(notification),
        'system-error',
        notification.bookingId || 0
      );

      if (!emailResult.success) {
        console.error('Failed to send system error email after retries:', emailResult.error);
        
        // Log email failure
        if (notification.bookingId) {
          await this.logger.logEmailFailed(
            notification.bookingId,
            'system_error_notification',
            this.config.adminEmails.join(', '),
            emailResult.error?.message || 'Unknown error',
            emailResult.attempts - 1
          );
        }

        // Store in email_failures table for manual follow-up
        await this.storeFailedNotification('system_error', notification, emailResult.error?.message);
      } else {
        // Log successful email
        if (notification.bookingId) {
          await this.logger.logEmailSent(
            notification.bookingId,
            'system_error_notification',
            this.config.adminEmails.join(', ')
          );
        }
      }

      // Send Slack notification if configured
      if (this.config.enableSlack && this.config.slackWebhookUrl) {
        try {
          await this.sendSlackNotification(notification);
        } catch (slackError) {
          console.error('Failed to send Slack notification:', slackError);
        }
      }

    } catch (error) {
      console.error('Critical error in admin notification service:', error);
      
      // Fallback: log to console for immediate visibility
      console.error('CRITICAL SYSTEM ERROR - MANUAL INTERVENTION REQUIRED:', {
        bookingId: notification.bookingId,
        errorType: notification.errorType,
        errorMessage: notification.errorMessage,
        severity: notification.severity,
        operation: notification.operation,
        timestamp: notification.timestamp
      });
    }
  }

  /**
   * Send payment failure notification to admins
   */
  async notifyPaymentFailure(notification: PaymentFailureNotification): Promise<void> {
    try {
      console.log(`Sending payment failure notification for booking ${notification.bookingId}`);

      // Log the notification attempt
      await this.logger.logEvent(
        notification.bookingId,
        BookingRequestEventType.ADMIN_NOTIFICATION,
        `Sending payment failure notification`,
        {
          customer_email: notification.customerEmail,
          amount: notification.amount,
          retry_count: notification.retryCount,
          error_details: notification.errorMessage
        },
        LogSeverity.WARNING
      );

      // Send email notification with retry
      const emailResult = await RetryService.retryEmailSending(
        () => this.sendPaymentFailureEmail(notification),
        'payment-failure',
        notification.bookingId
      );

      if (!emailResult.success) {
        console.error('Failed to send payment failure email after retries:', emailResult.error);
        
        // Log email failure
        await this.logger.logEmailFailed(
          notification.bookingId,
          'payment_failure_notification',
          this.config.adminEmails.join(', '),
          emailResult.error?.message || 'Unknown error',
          emailResult.attempts - 1
        );

        // Store in email_failures table for manual follow-up
        await this.storeFailedNotification('payment_failure', notification, emailResult.error?.message);
      } else {
        // Log successful email
        await this.logger.logEmailSent(
          notification.bookingId,
          'payment_failure_notification',
          this.config.adminEmails.join(', ')
        );
      }

    } catch (error) {
      console.error('Error in payment failure notification:', error);
      
      // Fallback: log to console
      console.error('PAYMENT FAILURE - MANUAL INTERVENTION REQUIRED:', {
        bookingId: notification.bookingId,
        customerEmail: notification.customerEmail,
        amount: notification.amount,
        errorMessage: notification.errorMessage
      });
    }
  }

  /**
   * Send critical alert for immediate attention
   */
  async sendCriticalAlert(
    title: string,
    message: string,
    bookingId?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const notification: SystemErrorNotification = {
      bookingId,
      errorType: 'CRITICAL_ALERT',
      errorMessage: message,
      severity: 'CRITICAL',
      operation: title,
      timestamp: new Date().toISOString(),
      metadata
    };

    await this.notifySystemError(notification);
  }

  /**
   * Send system error email
   */
  private async sendSystemErrorEmail(notification: SystemErrorNotification): Promise<void> {
    if (!this.config.sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const subject = `🚨 System Error Alert - ${notification.severity} - ${notification.errorType}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${this.getSeverityColor(notification.severity)}; color: white; padding: 20px; text-align: center;">
          <h1>🚨 System Error Alert</h1>
          <p style="font-size: 18px; margin: 0;">Severity: ${notification.severity}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Error Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Error Type:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.errorType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Operation:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.operation}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Timestamp:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.timestamp}</td>
            </tr>
            ${notification.bookingId ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking ID:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.bookingId}</td>
            </tr>
            ` : ''}
          </table>
          
          <h3>Error Message</h3>
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
            <code style="color: #dc3545;">${notification.errorMessage}</code>
          </div>
          
          ${notification.metadata ? `
          <h3>Additional Information</h3>
          <pre style="background-color: #fff; padding: 15px; border: 1px solid #ddd; overflow-x: auto;">
${JSON.stringify(notification.metadata, null, 2)}
          </pre>
          ` : ''}
          
          ${notification.stackTrace ? `
          <h3>Stack Trace</h3>
          <pre style="background-color: #fff; padding: 15px; border: 1px solid #ddd; overflow-x: auto; font-size: 12px;">
${notification.stackTrace}
          </pre>
          ` : ''}
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #e9ecef;">
          <p style="margin: 0; color: #6c757d;">
            This is an automated alert from the Tomodachi Tours booking system.
            ${notification.severity === 'CRITICAL' ? 'Immediate action may be required.' : 'Please review when convenient.'}
          </p>
        </div>
      </div>
    `;

    const personalizations = this.config.adminEmails.map(email => ({
      to: [{ email }],
      subject
    }));

    await sgMail.send({
      personalizations,
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName
      },
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    });
  }

  /**
   * Send payment failure email
   */
  private async sendPaymentFailureEmail(notification: PaymentFailureNotification): Promise<void> {
    if (!this.config.sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const subject = `💳 Payment Failure Alert - Booking ${notification.bookingId}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
          <h1>💳 Payment Failure Alert</h1>
          <p style="font-size: 18px; margin: 0;">Booking Request Payment Failed</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Booking Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking ID:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Customer:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Tour:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.tourName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">¥${notification.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Payment Method ID:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.paymentMethodId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Retry Count:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.retryCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Timestamp:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${notification.timestamp}</td>
            </tr>
          </table>
          
          <h3>Error Details</h3>
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
            <code style="color: #dc3545;">${notification.errorMessage}</code>
          </div>
          
          <h3>Required Actions</h3>
          <ul style="background-color: #fff; padding: 15px; border-left: 4px solid #ffc107;">
            <li>Review the payment failure reason</li>
            <li>Contact the customer if needed</li>
            <li>Retry payment processing if appropriate</li>
            <li>Consider manual payment collection</li>
            <li>Update booking status accordingly</li>
          </ul>
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #e9ecef;">
          <p style="margin: 0; color: #6c757d;">
            This is an automated alert from the Tomodachi Tours booking system.
            Please review and take appropriate action.
          </p>
        </div>
      </div>
    `;

    const personalizations = this.config.adminEmails.map(email => ({
      to: [{ email }],
      subject
    }));

    await sgMail.send({
      personalizations,
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName
      },
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(notification: SystemErrorNotification): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = notification.severity === 'CRITICAL' ? 'danger' : 
                  notification.severity === 'HIGH' ? 'warning' : 'good';

    const payload = {
      text: `🚨 System Error Alert - ${notification.severity}`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Error Type',
            value: notification.errorType,
            short: true
          },
          {
            title: 'Operation',
            value: notification.operation,
            short: true
          },
          {
            title: 'Booking ID',
            value: notification.bookingId?.toString() || 'N/A',
            short: true
          },
          {
            title: 'Timestamp',
            value: notification.timestamp,
            short: true
          },
          {
            title: 'Error Message',
            value: notification.errorMessage,
            short: false
          }
        ]
      }]
    };

    const response = await fetch(this.config.slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * Store failed notification for manual follow-up
   */
  private async storeFailedNotification(
    notificationType: string,
    notification: SystemErrorNotification | PaymentFailureNotification,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('email_failures')
        .insert({
          booking_id: notification.bookingId || null,
          customer_email: 'customerEmail' in notification ? notification.customerEmail : null,
          email_type: `admin_notification_${notificationType}`,
          failure_reason: errorMessage || 'Unknown error',
          booking_details: {
            notification_type: notificationType,
            notification_data: notification,
            admin_emails: this.config.adminEmails
          },
          created_at: new Date().toISOString()
        });
      
      console.log('Failed admin notification logged for manual follow-up');
    } catch (logError) {
      console.error('Failed to log admin notification failure:', logError);
    }
  }

  /**
   * Get severity color for email styling
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  }
}