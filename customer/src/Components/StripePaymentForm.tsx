import { useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import bookingFlowManager from '../services/bookingFlowManager';
import gtmService from '../services/gtmService';
import { StripePaymentFormProps } from '../types';

// Load Stripe with environment variable
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
    : Promise.resolve(null);

// Hash customer data for enhanced conversions
const hashCustomerData = async (data: string): Promise<string | null> => {
    if (!data) return null;

    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data.toLowerCase().trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.warn('Failed to hash customer data:', error);
        return null;
    }
};

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#424770',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#9e2146',
            iconColor: '#fa755a'
        }
    },
    hidePostalCode: true
};

const StripePaymentForm = ({ totalPrice, originalPrice: _originalPrice, appliedDiscount: _appliedDiscount, onCreateBookingAndPayment, onError, onProcessing, isProcessing, isRequestTour = false }: StripePaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = useCallback(async () => {
        if (!stripe || !elements) {
            onError("Stripe is not ready. Please refresh the page.");
            return;
        }

        if (isProcessing) {
            return; // Prevent double submission
        }

        if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
            onError("Stripe is not configured. Please contact support.");
            return;
        }

        // Track add_payment_info event before processing payment
        try {
            const currentBookingState = bookingFlowManager.getCurrentBookingState();
            if (currentBookingState && !bookingFlowManager.isConversionTracked('add_payment_info')) {
                const paymentData = {
                    provider: 'stripe',
                    amount: totalPrice,
                    currency: 'JPY',
                    paymentMethod: 'card'
                };

                const trackingResult = bookingFlowManager.trackAddPaymentInfo(paymentData);

                if (trackingResult.success && trackingResult.data) {
                    // Also fire GTM conversion tracking
                    const customerData = currentBookingState.customerData ? {
                        email_hash: await hashCustomerData(currentBookingState.customerData.email),
                        phone_hash: currentBookingState.customerData.phone ?
                            await hashCustomerData(currentBookingState.customerData.phone) : null
                    } : undefined;

                    gtmService.trackAddPaymentInfoConversion(trackingResult.data, customerData);
                    console.log('✅ Add payment info conversion tracked via GTM');
                } else if (trackingResult.reason !== 'already_tracked') {
                    console.warn('Failed to track add payment info:', trackingResult.reason);
                }
            }
        } catch (error) {
            console.warn('Failed to track add payment info conversion:', error);
        }

        onProcessing(isRequestTour ? 'Creating secure payment method...' : 'Processing payment with Stripe...');

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            throw new Error('Card element not found');
        }

        try {
            // Create payment method
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                throw new Error(error.message);
            }

            if (!paymentMethod || !paymentMethod.id) {
                throw new Error('Failed to create payment method');
            }

            // Call the booking and payment handler with Stripe payment data
            await onCreateBookingAndPayment({
                payment_method_id: paymentMethod.id,
                provider: 'stripe'
            });

        } catch (error) {
            console.error('Stripe payment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            onError(errorMessage);
        }
    }, [stripe, elements, isProcessing, onCreateBookingAndPayment, onError, onProcessing, totalPrice]);

    // Handle 3D Secure authentication
    const handle3DSecure = useCallback(async (clientSecret: string) => {
        console.log('3D Secure handler called with client secret:', clientSecret.substring(0, 20) + '...');
        
        if (!stripe) {
            console.error('Stripe not loaded for 3D Secure authentication');
            throw new Error('Payment system not ready. Please wait a moment and try again.');
        }

        if (!elements) {
            console.error('Stripe elements not loaded for 3D Secure authentication');
            throw new Error('Payment form not ready. Please refresh the page and try again.');
        }

        try {
            console.log('Calling stripe.confirmCardPayment...');
            const result = await stripe.confirmCardPayment(clientSecret);
            console.log('Stripe confirmCardPayment result:', {
                error: result.error ? {
                    code: result.error.code,
                    message: result.error.message,
                    type: result.error.type
                } : null,
                paymentIntent: result.paymentIntent ? {
                    id: result.paymentIntent.id,
                    status: result.paymentIntent.status
                } : null
            });
            return result;
        } catch (error) {
            console.error('Error during stripe.confirmCardPayment:', error);
            // Re-throw with more context
            throw new Error(`Payment confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [stripe, elements]);

    // Expose functions to window for external access
    useEffect(() => {
        console.log('Exposing Stripe functions to window');
        window.submitPaymentForm = handleSubmit;
        window.handleStripe3DSecure = handle3DSecure;
        
        // Add a flag to indicate functions are ready
        window.stripeHandlersReady = true;
        
        return () => {
            console.log('Cleaning up Stripe window functions');
            delete window.submitPaymentForm;
            delete window.handleStripe3DSecure;
            delete window.stripeHandlersReady;
        };
    }, [handleSubmit, handle3DSecure]);

    // Also expose immediately when stripe and elements are ready
    useEffect(() => {
        if (stripe && elements) {
            console.log('Stripe and elements ready, ensuring handlers are exposed');
            window.submitPaymentForm = handleSubmit;
            window.handleStripe3DSecure = handle3DSecure;
            window.stripeHandlersReady = true;
        }
    }, [stripe, elements, handleSubmit, handle3DSecure]);

    if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
        return (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-700">
                    Stripe is not configured. Payment processing is temporarily unavailable.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Details
                </label>
                {isRequestTour && (
                    <div className="mb-2 text-xs text-gray-600">
                        Your card will be securely stored but not charged until your booking is approved.
                    </div>
                )}
                <div className="p-3 border border-gray-300 rounded-md bg-white">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
            </div>
        </div>
    );
};

// Wrapper component with Elements provider
const StripePaymentWrapper = (props: StripePaymentFormProps) => {
    return (
        <Elements stripe={stripePromise}>
            <StripePaymentForm {...props} />
        </Elements>
    );
};

export default StripePaymentWrapper; 