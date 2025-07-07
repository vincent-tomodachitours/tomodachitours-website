/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

export interface PaymentProviders {
    primary: string;
    backup: string | null;
}

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
     * Get active payment providers configuration
     */
    async getActiveProviders(): Promise<PaymentProviders> {
        // Check environment override first
        const primaryOverride = Deno.env.get('PAYMENT_PROVIDER_PRIMARY');
        const enableStripeBackup = Deno.env.get('ENABLE_STRIPE_BACKUP') === 'true';

        if (primaryOverride) {
            return {
                primary: primaryOverride,
                backup: enableStripeBackup && primaryOverride === 'payjp' ? 'stripe' :
                    enableStripeBackup && primaryOverride === 'stripe' ? 'payjp' : null
            };
        }

        // Get from database
        const { data, error } = await this.supabase
            .from('payment_providers')
            .select('*')
            .eq('is_enabled', true)
            .order('is_primary', { ascending: false });

        if (error) {
            console.error('Error fetching payment providers:', error);
            // Fallback to default
            return { primary: 'payjp', backup: enableStripeBackup ? 'stripe' : null };
        }

        const primary = data?.find(p => p.is_primary)?.provider_name || 'payjp';
        const backup = data?.find(p => !p.is_primary)?.provider_name || null;

        return {
            primary,
            backup: enableStripeBackup ? backup : null
        };
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

    /**
     * Check if automatic fallback is enabled
     */
    isAutoFallbackEnabled(): boolean {
        return Deno.env.get('AUTO_FALLBACK_ENABLED') === 'true';
    }

    /**
     * Switch primary provider (for admin use)
     */
    async switchPrimaryProvider(newPrimary: 'payjp' | 'stripe'): Promise<boolean> {
        try {
            // Start transaction to ensure atomicity
            const { error: resetError } = await this.supabase
                .from('payment_providers')
                .update({ is_primary: false })
                .neq('id', -1); // Update all rows

            if (resetError) {
                console.error('Failed to reset primary providers:', resetError);
                return false;
            }

            const { error: setPrimaryError } = await this.supabase
                .from('payment_providers')
                .update({ is_primary: true })
                .eq('provider_name', newPrimary);

            if (setPrimaryError) {
                console.error('Failed to set new primary provider:', setPrimaryError);
                return false;
            }

            console.log(`Primary payment provider switched to: ${newPrimary}`);
            return true;
        } catch (error) {
            console.error('Error switching primary provider:', error);
            return false;
        }
    }
} 