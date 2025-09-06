import Stripe from 'https://esm.sh/stripe@14.11.0';

export interface StripePaymentResult {
    id: string;
    status: string;
    amount: number;
    client_secret?: string;
}

export class StripeService {
    private stripe: Stripe;

    constructor() {
        const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('Stripe secret key not configured');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
        });
    }

    /**
     * Create and confirm a payment intent for immediate payment
     */
    async createPayment(
        amount: number,
        bookingId: number,
        discountCode?: string,
        originalAmount?: number
    ): Promise<StripePaymentResult> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amount,
                currency: 'jpy',
                metadata: {
                    booking_id: bookingId.toString(),
                    discount_code: discountCode || '',
                    original_amount: (originalAmount || amount).toString()
                },
                confirmation_method: 'automatic',
                confirm: false, // We'll confirm with payment method
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                client_secret: paymentIntent.client_secret || undefined
            };
        } catch (error) {
            console.error('Stripe payment creation error:', error);
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
    }

    /**
     * Confirm a payment intent with card token (for server-side processing)
     */
    async confirmPayment(
        paymentIntentId: string,
        paymentMethodId?: string
    ): Promise<StripePaymentResult> {
        try {
            const confirmation = await this.stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
                return_url: `${Deno.env.get('FRONTEND_URL') || 'https://localhost:3000'}/thankyou`,
            });

            return {
                id: confirmation.id,
                status: confirmation.status,
                amount: confirmation.amount
            };
        } catch (error) {
            console.error('Stripe payment confirmation error:', error);
            throw new Error(`Stripe payment confirmation failed: ${error.message}`);
        }
    }

    /**
     * Create refund for a payment intent
     */
    async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount, // If not specified, refunds full amount
            });

            return refund;
        } catch (error) {
            console.error('Stripe refund error:', error);
            throw new Error(`Stripe refund failed: ${error.message}`);
        }
    }

    /**
     * Get payment intent details
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
            console.error('Stripe payment intent retrieval error:', error);
            throw new Error(`Failed to retrieve payment intent: ${error.message}`);
        }
    }

    /**
     * Create a payment method from card details (for server-side processing)
     */
    async createPaymentMethod(cardDetails: any): Promise<Stripe.PaymentMethod> {
        try {
            return await this.stripe.paymentMethods.create({
                type: 'card',
                card: cardDetails,
            });
        } catch (error) {
            console.error('Stripe payment method creation error:', error);
            throw new Error(`Failed to create payment method: ${error.message}`);
        }
    }

    /**
     * Create a payment intent for frontend confirmation
     * This allows for 3D Secure and other authentication flows
     */
    async createPaymentIntent(
        amount: number,
        bookingId: number,
        paymentMethodId: string,
        discountCode?: string,
        originalAmount?: number
    ): Promise<StripePaymentResult> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amount,
                currency: 'jpy',
                payment_method: paymentMethodId,
                confirmation_method: 'automatic',
                confirm: true,
                metadata: {
                    booking_id: bookingId.toString(),
                    discount_code: discountCode || '',
                    original_amount: (originalAmount || amount).toString()
                },
                return_url: `${Deno.env.get('FRONTEND_URL') || 'https://localhost:3000'}/thankyou`,
            });

            return {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                client_secret: paymentIntent.client_secret || undefined
            };
        } catch (error) {
            console.error('Stripe payment intent creation error:', error);
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
    }

    /**
     * Process immediate payment (create + confirm in one step)
     * This is for direct server-side processing without client interaction
     */
    async processImmediatePayment(
        amount: number,
        bookingId: number,
        paymentMethodId: string,
        discountCode?: string,
        originalAmount?: number
    ): Promise<StripePaymentResult> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amount,
                currency: 'jpy',
                payment_method: paymentMethodId,
                confirmation_method: 'automatic',
                confirm: true,
                metadata: {
                    booking_id: bookingId.toString(),
                    discount_code: discountCode || '',
                    original_amount: (originalAmount || amount).toString()
                },
                return_url: `${Deno.env.get('FRONTEND_URL') || 'https://localhost:3000'}/thankyou`,
            });

            if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
            }

            return {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount
            };
        } catch (error) {
            console.error('Stripe immediate payment error:', error);
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
    }
} 