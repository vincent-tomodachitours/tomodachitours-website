import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';
import { supabase } from '../lib/supabase';
import { usePaymentProvider } from '../hooks/usePaymentProvider';
import StripePaymentForm from './StripePaymentForm';
import PayjpPaymentForm from './PayjpPaymentForm';

const CardForm = forwardRef(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, setPaymentProcessing }, ref) => {
    const { primaryProvider, loading: providerLoading, error: providerError } = usePaymentProvider();
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateBookingAndPayment = async (paymentData) => {
        try {
            setPaymentStatus('Creating booking...');
            setPaymentProcessing(true);
            setIsProcessing(true);

            const bookingData = {
                tour_type: sheetId.toUpperCase().replace(' ', '_'),
                booking_date: formRef.current.date,
                booking_time: formRef.current.time,
                customer_name: formRef.current.name,
                customer_phone: formRef.current.phone,
                customer_email: formRef.current.email,
                adults: parseInt(formRef.current.adults),
                children: parseInt(formRef.current.children) || 0,
                infants: parseInt(formRef.current.infants) || 0,
                status: 'PENDING_PAYMENT',
                discount_code: appliedDiscount?.code || null
            };

            // Insert booking into Supabase
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();

            if (error) {
                console.error('Error creating booking:', error);
                setPaymentProcessing(false);
                setIsProcessing(false);
                setPaymentStatus('');
                alert(`Failed to create booking. ${error.message || error}`);
                return;
            }

            setPaymentStatus('Processing payment...');

            // Now process the payment
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-charge`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    ...paymentData,
                    amount: totalPrice,
                    discountCode: appliedDiscount?.code || null,
                    originalAmount: originalPrice || totalPrice,
                    bookingId: data.id
                }),
            });

            const paymentResult = await response.json();

            if (paymentResult.success) {
                handlePaymentSuccess(paymentResult);
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }

        } catch (error) {
            setPaymentProcessing(false);
            setIsProcessing(false);
            setPaymentStatus('');
            console.error("Error creating booking:", error);
            alert("Something went wrong creating the booking.");
        }
    };

    const handleCreateBooking = async () => {
        // This will be called by the external button - trigger payment form submission
        if (window.submitPaymentForm) {
            window.submitPaymentForm();
        }
    };

    const handlePaymentSuccess = (data) => {
        // Keep loading states active, but update the status message
        // Don't turn off loading until we're about to redirect

        // Check if backup payment was used and show appropriate message
        if (data.backup_used) {
            console.log(`Payment processed successfully using backup provider: ${data.provider_used}`);
            setPaymentStatus(`Payment successful! Redirecting to confirmation page...`);
            // Small delay to show the status message, then redirect
            setTimeout(() => {
                setIsProcessing(false);
                setPaymentProcessing(false);
                window.location.href = "/thankyou";
            }, 2000);
        } else {
            setPaymentStatus(`Payment successful! Redirecting to confirmation page...`);
            setTimeout(() => {
                setIsProcessing(false);
                setPaymentProcessing(false);
                window.location.href = "/thankyou";
            }, 1000);
        }
    };

    const handlePaymentError = (errorMessage) => {
        setIsProcessing(false);
        setPaymentProcessing(false);
        setPaymentStatus('');
        setPaymentFailed(true);
        console.error('Payment error:', errorMessage);
    };

    const handlePaymentProcessing = (message) => {
        setIsProcessing(true);
        setPaymentProcessing(true);
        setPaymentStatus(message);

        // Set protection flags early if this is PayJP
        if (primaryProvider === 'payjp') {
            sessionStorage.setItem('checkout_should_stay_open', 'true');
            console.log('🛡️ Early PayJP protection flags set in CardForm');
        }
    };

    useImperativeHandle(ref, () => ({
        handleCreateBooking
    }));

    // Show loading state while determining payment provider
    if (providerLoading) {
        return (
            <div className='w-full h-36 flex items-center justify-center'>
                <div className='text-gray-500 flex items-center gap-2'>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    Loading payment system...
                </div>
            </div>
        );
    }

    // Show error state if we can't determine payment provider
    if (providerError) {
        return (
            <div className='w-full h-36 flex items-center justify-center'>
                <div className='text-red-500'>
                    Failed to load payment system. Please refresh the page.
                </div>
            </div>
        );
    }

    return (
        <div className='w-full flex flex-col gap-4'>
            {paymentStatus && (
                <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                    <div className='text-sm text-blue-700 flex items-center gap-2'>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                        {paymentStatus}
                    </div>
                </div>
            )}

            {/* Always show payment form */}
            <div className='text-sm text-gray-600 mb-2'>
                Payment powered by {primaryProvider === 'stripe' ? 'Stripe' : 'PayJP'}
            </div>

            {primaryProvider === 'stripe' ? (
                <StripePaymentForm
                    totalPrice={totalPrice}
                    originalPrice={originalPrice}
                    appliedDiscount={appliedDiscount}
                    onCreateBookingAndPayment={handleCreateBookingAndPayment}
                    onError={handlePaymentError}
                    onProcessing={handlePaymentProcessing}
                    isProcessing={isProcessing}
                />
            ) : (
                <PayjpPaymentForm
                    totalPrice={totalPrice}
                    originalPrice={originalPrice}
                    appliedDiscount={appliedDiscount}
                    onCreateBookingAndPayment={handleCreateBookingAndPayment}
                    onError={handlePaymentError}
                    onProcessing={handlePaymentProcessing}
                    isProcessing={isProcessing}
                />
            )}

            {paymentFailed && (
                <PaymentFailed onClick={() => setPaymentFailed(false)} />
            )}
        </div>
    );
});

export default React.memo(CardForm);