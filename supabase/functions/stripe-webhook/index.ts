import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface StripeWebhookEvent {
    id: string;
    object: string;
    type: string;
    created: number;
    data: {
        object: any;
    };
    livemode: boolean;
    pending_webhooks: number;
    request: {
        id: string;
        idempotency_key: string;
    };
}

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Get the raw body and signature
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            console.error('No Stripe signature provided');
            return new Response(
                JSON.stringify({ error: 'No signature provided' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Verify webhook signature
        if (!(await verifyStripeSignature(body, signature))) {
            console.error('Invalid Stripe webhook signature');
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const event: StripeWebhookEvent = JSON.parse(body);
        console.log(`Received Stripe webhook: ${event.type}`);

        // Process different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'payment_intent.requires_action':
                await handlePaymentRequiresAction(event.data.object);
                break;
            default:
                console.log(`Unhandled Stripe webhook event type: ${event.type}`);
        }

        return new Response(
            JSON.stringify({ success: true, processed: event.type }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Stripe webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: 'Processing failed', details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return false;
    }

    try {
        // Parse signature header
        const elements = signature.split(',');
        const signatureElements: { [key: string]: string } = {};

        for (const element of elements) {
            const [key, value] = element.split('=');
            signatureElements[key] = value;
        }

        const timestamp = signatureElements.t;
        const v1 = signatureElements.v1;

        if (!timestamp || !v1) {
            console.error('Missing timestamp or signature in Stripe signature header');
            return false;
        }

        // Create the signed payload
        const signedPayload = `${timestamp}.${payload}`;

        // Compute expected signature using HMAC SHA256
        const encoder = new TextEncoder();
        const key = encoder.encode(webhookSecret);
        const data = encoder.encode(signedPayload);

        return crypto.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        ).then(cryptoKey =>
            crypto.subtle.sign("HMAC", cryptoKey, data)
        ).then(signatureBuffer => {
            const computedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            return computedSignature === v1;
        }).catch(error => {
            console.error('Stripe signature verification error:', error);
            return false;
        });
    } catch (error) {
        console.error('Stripe signature verification error:', error);
        return false;
    }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment succeeded for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Update booking status if it's not already confirmed
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'CONFIRMED',
                stripe_payment_intent_id: paymentIntent.id,
                payment_provider: 'stripe'
            })
            .eq('id', parseInt(bookingId))
            .eq('status', 'PENDING_PAYMENT'); // Only update if still pending

        if (error) {
            console.error('Error updating booking after successful payment:', error);
        } else {
            console.log(`Booking ${bookingId} confirmed via Stripe webhook`);
        }
    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment failed for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Log the payment attempt as failed
        const { error } = await supabase
            .from('payment_attempts')
            .insert({
                booking_id: parseInt(bookingId),
                provider_attempted: 'stripe',
                amount: paymentIntent.amount,
                status: 'failed',
                error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
                attempt_order: 1
            });

        if (error) {
            console.error('Error logging failed payment attempt:', error);
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

/**
 * Handle payment requiring action (3D Secure, etc.)
 */
async function handlePaymentRequiresAction(paymentIntent: any) {
    try {
        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
            console.error('No booking_id in payment_intent metadata');
            return;
        }

        console.log(`Payment requires action for booking ${bookingId}, payment_intent: ${paymentIntent.id}`);

        // Could send notification to customer or log for follow-up
        // For now, just log it
    } catch (error) {
        console.error('Error handling payment requires action:', error);
    }
} 