/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export class RetryService {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      'network',
      'timeout',
      'rate_limit',
      'temporary',
      'service_unavailable',
      'internal_server_error'
    ]
  };

  /**
   * Execute an operation with exponential backoff retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...RetryService.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      try {
        console.log(`[${operationName}] Attempt ${attempt}/${finalConfig.maxRetries + 1}`);
        
        const result = await operation();
        
        const totalDuration = Date.now() - startTime;
        console.log(`[${operationName}] Success on attempt ${attempt} (${totalDuration}ms)`);
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[${operationName}] Attempt ${attempt} failed:`, lastError.message);

        // If this is the last attempt, don't retry
        if (attempt > finalConfig.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!RetryService.isRetryableError(lastError, finalConfig.retryableErrors)) {
          console.log(`[${operationName}] Non-retryable error, stopping retries`);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelayMs
        );

        console.log(`[${operationName}] Retrying in ${delay}ms...`);
        await RetryService.sleep(delay);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.error(`[${operationName}] All attempts failed (${totalDuration}ms)`);
    
    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts: finalConfig.maxRetries + 1,
      totalDuration
    };
  }

  /**
   * Check if an error is retryable based on error message or type
   */
  private static isRetryableError(error: Error, retryableErrors?: string[]): boolean {
    if (!retryableErrors || retryableErrors.length === 0) {
      return true; // Retry all errors if no specific list provided
    }

    const errorMessage = error.message.toLowerCase();
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry payment processing with specific configuration
   */
  static async retryPaymentProcessing<T>(
    paymentOperation: () => Promise<T>,
    bookingId: number
  ): Promise<RetryResult<T>> {
    const paymentRetryConfig: RetryConfig = {
      maxRetries: 2, // Only retry twice for payments
      baseDelayMs: 2000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        'network',
        'timeout',
        'rate_limit',
        'temporary',
        'service_unavailable',
        'processing_error',
        'card_declined' // Some card declines might be temporary
      ]
    };

    return RetryService.executeWithRetry(
      paymentOperation,
      paymentRetryConfig,
      `payment-processing-${bookingId}`
    );
  }

  /**
   * Retry email sending with specific configuration
   */
  static async retryEmailSending<T>(
    emailOperation: () => Promise<T>,
    emailType: string,
    bookingId: number
  ): Promise<RetryResult<T>> {
    const emailRetryConfig: RetryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 15000,
      backoffMultiplier: 2,
      retryableErrors: [
        'network',
        'timeout',
        'rate_limit',
        'temporary',
        'service_unavailable',
        'sendgrid',
        'smtp'
      ]
    };

    return RetryService.executeWithRetry(
      emailOperation,
      emailRetryConfig,
      `email-${emailType}-${bookingId}`
    );
  }

  /**
   * Retry database operations with specific configuration
   */
  static async retryDatabaseOperation<T>(
    dbOperation: () => Promise<T>,
    operationName: string
  ): Promise<RetryResult<T>> {
    const dbRetryConfig: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryableErrors: [
        'network',
        'timeout',
        'connection',
        'temporary',
        'deadlock',
        'lock_timeout'
      ]
    };

    return RetryService.executeWithRetry(
      dbOperation,
      dbRetryConfig,
      `database-${operationName}`
    );
  }

  /**
   * Create a circuit breaker pattern for external service calls
   */
  static createCircuitBreaker<T>(
    operation: () => Promise<T>,
    failureThreshold: number = 5,
    resetTimeoutMs: number = 60000
  ) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async (): Promise<T> => {
      const now = Date.now();

      // Check if we should reset from OPEN to HALF_OPEN
      if (state === 'OPEN' && now - lastFailureTime > resetTimeoutMs) {
        state = 'HALF_OPEN';
        console.log('Circuit breaker: OPEN -> HALF_OPEN');
      }

      // If circuit is OPEN, fail fast
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }

      try {
        const result = await operation();
        
        // Success - reset failure count and close circuit
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          console.log('Circuit breaker: HALF_OPEN -> CLOSED');
        }
        failureCount = 0;
        
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        // If we've exceeded the failure threshold, open the circuit
        if (failureCount >= failureThreshold) {
          const previousState = state;
          state = 'OPEN';
          console.log(`Circuit breaker: ${previousState} -> OPEN`);
        }

        throw error;
      }
    };
  }
}