import React, { useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';

// Load Stripe only if we have the publishable key
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
    : Promise.resolve(null);

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

const StripePaymentForm = ({ totalPrice, originalPrice, appliedDiscount, onCreateBookingAndPayment, onError, onProcessing, isProcessing }) => {
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

        onProcessing('Processing payment with Stripe...');

        const cardElement = elements.getElement(CardElement);

        try {
            // Create payment method
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Call the booking and payment handler with Stripe payment data
            await onCreateBookingAndPayment({
                payment_method_id: paymentMethod.id,
                provider: 'stripe'
            });

        } catch (error) {
            console.error('Stripe payment error:', error);
            onError(error.message);
        }
    }, [stripe, elements, isProcessing, onCreateBookingAndPayment, onError, onProcessing]);

    // Expose submit function to window for external button
    useEffect(() => {
        window.submitPaymentForm = handleSubmit;
        return () => {
            delete window.submitPaymentForm;
        };
    }, [handleSubmit]);

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
                <div className="p-3 border border-gray-300 rounded-md bg-white">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
            </div>
        </div>
    );
};

// Wrapper component with Elements provider
const StripePaymentWrapper = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <StripePaymentForm {...props} />
        </Elements>
    );
};

export default StripePaymentWrapper; 