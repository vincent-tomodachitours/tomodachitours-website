/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

export interface PaymentAttempt {
    booking_id: number;
    provider_attempted: string;
    amount: number;
    status: 'success' | 'failed' | 'error';
    error_message?: string;
    attempt_order: number;
}

export class PaymentProviderService {
    private supabase: any;

    constructor(supabase: any) {
        this.supabase = supabase;
    }

    /**
     * Get primary payment provider - simplified to always return stripe when configured
     */
    getPrimaryProvider(): string {
        const primaryOverride = Deno.env.get('PAYMENT_PROVIDER_PRIMARY');
        return primaryOverride || 'stripe'; // Default to Stripe
    }

    /**
     * Log a payment attempt for monitoring and debugging
     */
    async logPaymentAttempt(
        bookingId: number,
        provider: string,
        amount: number,
        status: 'success' | 'failed' | 'error',
        errorMessage?: string,
        attemptOrder: number = 1
    ): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('payment_attempts')
                .insert({
                    booking_id: bookingId,
                    provider_attempted: provider,
                    amount,
                    status,
                    error_message: errorMessage,
                    attempt_order: attemptOrder
                });

            if (error) {
                console.error('Failed to log payment attempt:', error);
            } else {
                console.log(`Logged ${status} payment attempt for booking ${bookingId} with ${provider}`);
            }
        } catch (error) {
            console.error('Error logging payment attempt:', error);
            // Don't throw - logging failures shouldn't break payment flow
        }
    }
} 