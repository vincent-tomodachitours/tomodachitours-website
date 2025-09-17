import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';
import { supabase } from '../lib/supabase';
// import { usePaymentProvider } from '../hooks/usePaymentProvider'; // Removed unused import
import StripePaymentForm from './StripePaymentForm';
import { trackPurchase } from '../services/analytics';
import attributionService from '../services/attributionService';
import remarketingManager from '../services/remarketingManager';
import bookingFlowManager from '../services/bookingFlowManager';
import gtmService from '../services/gtmService';
import { CardFormProps } from '../types';
// COMMENTED OUT: PayJP import - uncomment to restore PayJP functionality
// import PayjpPaymentForm from './PayjpPaymentForm';

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

const CardForm = forwardRef<any, CardFormProps>(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, tourDate: _tourDate, tourTime: _tourTime, adult: _adult, child: _child, infant: _infant, formData: _formData, paymentProcessing: _paymentProcessing, setPaymentProcessing, setIs3DSInProgress: _setIs3DSInProgress }, ref) => {
    // eslint-disable-next-line no-unused-vars
    // const { primaryProvider } = usePaymentProvider(); // Removed unused variable
    const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
    const [paymentStatus, setPaymentStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const handleCreateBookingAndPayment = async (paymentData: any): Promise<void> => {
        try {
            setPaymentStatus('Creating booking...');
            setPaymentProcessing(true);
            setIsProcessing(true);

            // Convert sheetId to proper tour_type enum value
            const convertToTourType = (sheetId: string): string => {
                const typeMap: Record<string, string> = {
                    'night-tour': 'NIGHT_TOUR',
                    'morning-tour': 'MORNING_TOUR',
                    'uji-tour': 'UJI_TOUR',
                    'uji-walking-tour': 'UJI_WALKING_TOUR',
                    'gion-tour': 'GION_TOUR'
                };
                return typeMap[sheetId] || sheetId.toUpperCase().replace('-', '_');
            };

            const bookingData = {
                tour_type: convertToTourType(sheetId),
                booking_date: formRef.current.date,
                booking_time: formRef.current.time,
                customer_name: formRef.current.name,
                customer_phone: formRef.current.phone,
                customer_email: formRef.current.email,
                adults: parseInt(formRef.current.adults),
                children: parseInt(formRef.current.children) || 0,
                infants: parseInt(formRef.current.infants) || 0,
                status: 'PENDING_PAYMENT',
                discount_code: appliedDiscount?.code || null,
                discount_amount: appliedDiscount ? (appliedDiscount.originalAmount - appliedDiscount.finalAmount) : null,
                paid_amount: totalPrice // Set the paid amount (final price after discount) during booking creation
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

    const handlePaymentSuccess = async (data: any): Promise<void> => {
        // Track purchase conversion using bookingFlowManager and GTM
        try {
            const transactionId = data.transaction_id || data.charge_id || `booking_${Date.now()}`;

            // Get current booking state
            const currentBookingState = bookingFlowManager.getCurrentBookingState();

            // Track purchase through bookingFlowManager
            if (currentBookingState && !bookingFlowManager.isConversionTracked('purchase')) {
                const transactionData = {
                    transactionId: transactionId,
                    finalAmount: totalPrice,
                    paymentProvider: data.provider_used || 'stripe',
                    transaction_id: transactionId, // Ensure transaction_id is included
                    value: totalPrice,
                    currency: 'JPY',
                    tour_id: sheetId,
                    tour_name: tourName
                };

                const trackingResult = bookingFlowManager.trackPurchase(transactionData);

                if (trackingResult.success) {
                    // Hash customer data for enhanced conversions
                    const hashedCustomerData = formRef.current?.email ? {
                        email_hash: await hashCustomerData(formRef.current.email),
                        phone_hash: formRef.current?.phone ?
                            await hashCustomerData(formRef.current.phone) : null
                    } : null;

                    // Fire GTM purchase conversion
                    if (trackingResult.data) {
                        gtmService.trackPurchaseConversion(trackingResult.data, hashedCustomerData || undefined);
                        console.log('✅ Purchase conversion tracked via GTM and bookingFlowManager');
                    }
                } else {
                    console.warn('Failed to track purchase via bookingFlowManager:', trackingResult.reason);
                }
            } else if (!currentBookingState) {
                // Fallback: Track purchase directly via GTM if no booking state
                console.warn('No booking state found, tracking purchase directly via GTM');
                const directTransactionData = {
                    transaction_id: transactionId,
                    value: totalPrice,
                    currency: 'JPY',
                    tour_id: sheetId,
                    tour_name: tourName,
                    items: [{
                        item_id: sheetId,
                        item_name: tourName,
                        item_category: 'tour',
                        price: totalPrice,
                        quantity: 1
                    }]
                };

                const hashedCustomerData = formRef.current?.email ? {
                    email_hash: await hashCustomerData(formRef.current.email),
                    phone_hash: formRef.current?.phone ?
                        await hashCustomerData(formRef.current.phone) : null
                } : null;

                gtmService.trackPurchaseConversion(directTransactionData, hashedCustomerData || undefined);
                console.log('✅ Purchase conversion tracked directly via GTM (fallback)');
            }

            // Prepare comprehensive transaction data for legacy analytics and session storage
            const legacyTransactionData = {
                transactionId: transactionId,
                tourId: sheetId,
                tourName: tourName,
                value: totalPrice,
                price: totalPrice,
                originalPrice: originalPrice || totalPrice,
                quantity: (formRef.current?.adults || 0) + (formRef.current?.children || 0),
                adults: formRef.current?.adults || 0,
                children: formRef.current?.children || 0,
                infants: formRef.current?.infants || 0,
                currency: 'JPY',
                // Enhanced conversion data
                paymentProvider: data.provider_used || 'stripe',
                backupUsed: data.backup_used || false,
                discountApplied: appliedDiscount ? true : false,
                discountAmount: appliedDiscount ? (appliedDiscount.originalAmount - appliedDiscount.finalAmount) : 0,
                discountCode: appliedDiscount?.code || null,
                // Customer data for enhanced conversions
                customerEmail: formRef.current?.email,
                customerName: formRef.current?.name,
                customerPhone: formRef.current?.phone,
                // Booking details
                bookingDate: formRef.current?.date,
                bookingTime: formRef.current?.time,
                // Attribution data
                attribution: attributionService.getAttributionForAnalytics()
            };

            // Keep legacy analytics tracking for backward compatibility
            trackPurchase(legacyTransactionData);

            // Store comprehensive transaction data for thank you page
            try {
                sessionStorage.setItem('booking_transaction_id', legacyTransactionData.transactionId);
                sessionStorage.setItem('booking_tour_name', legacyTransactionData.tourName);
                sessionStorage.setItem('booking_tour_id', legacyTransactionData.tourId);
                sessionStorage.setItem('booking_value', legacyTransactionData.value.toString());
                sessionStorage.setItem('booking_price', legacyTransactionData.price.toString());
                sessionStorage.setItem('booking_quantity', legacyTransactionData.quantity.toString());
                sessionStorage.setItem('booking_adults', legacyTransactionData.adults.toString());
                sessionStorage.setItem('booking_children', legacyTransactionData.children.toString());
                sessionStorage.setItem('booking_infants', legacyTransactionData.infants.toString());
                sessionStorage.setItem('booking_original_price', legacyTransactionData.originalPrice.toString());
                sessionStorage.setItem('booking_discount_applied', legacyTransactionData.discountApplied.toString());
                sessionStorage.setItem('booking_discount_amount', legacyTransactionData.discountAmount.toString());
                sessionStorage.setItem('booking_discount_code', legacyTransactionData.discountCode || '');
                sessionStorage.setItem('booking_payment_provider', legacyTransactionData.paymentProvider);
                sessionStorage.setItem('booking_date', legacyTransactionData.bookingDate || '');
                sessionStorage.setItem('booking_time', legacyTransactionData.bookingTime || '');
                sessionStorage.setItem('booking_customer_email', legacyTransactionData.customerEmail || '');
                sessionStorage.setItem('booking_customer_phone', legacyTransactionData.customerPhone || '');
                sessionStorage.setItem('booking_customer_name', legacyTransactionData.customerName || '');
            } catch (error) {
                console.warn('Failed to store transaction data for thank you page:', error);
            }

            // Process purchase completion for remarketing audience exclusion
            try {
                remarketingManager.processPurchaseCompletion(legacyTransactionData);
            } catch (error) {
                console.warn('Remarketing purchase processing failed:', error);
            }

            console.log('🎯 Enhanced purchase conversion tracked via GTM and legacy systems:', legacyTransactionData);
        } catch (error) {
            console.error('Failed to track purchase conversion:', error);
        }

        // Keep loading states active, but update the status message
        // Don't turn off loading until we're about to redirect

        // Signal that payment is complete to stop any retry mechanisms
        try {
            sessionStorage.setItem('payment_completed', 'true');
            sessionStorage.setItem('payment_completion_time', Date.now().toString());
        } catch (error) {
            console.warn('Failed to set payment completion flag:', error);
        }

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

    const handlePaymentError = (errorMessage: string): void => {
        setIsProcessing(false);
        setPaymentProcessing(false);
        setPaymentStatus('');
        setPaymentFailed(true);
        console.error('Payment error:', errorMessage);
    };

    const handlePaymentProcessing = (message: string): void => {
        setIsProcessing(true);
        setPaymentProcessing(true);
        setPaymentStatus(message);

        // COMMENTED OUT: PayJP protection flags - uncomment if you restore PayJP
        /*
        // Set protection flags early if this is PayJP
        if (primaryProvider === 'payjp') {
            sessionStorage.setItem('checkout_should_stay_open', 'true');
            console.log('🛡️ Early PayJP protection flags set in CardForm');
        }
        */
    };

    useImperativeHandle(ref, () => ({
        handleCreateBooking
    }));

    // COMMENTED OUT: Provider loading states since we're hard coding Stripe
    /*
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
    */

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

            {/* HARD CODED: Always show Stripe */}
            <div className='text-sm text-gray-600 mb-2'>
                Payment powered by Stripe
            </div>

            {/* HARD CODED: Always show Stripe payment form */}
            <StripePaymentForm
                totalPrice={totalPrice}
                originalPrice={originalPrice}
                appliedDiscount={appliedDiscount}
                onCreateBookingAndPayment={handleCreateBookingAndPayment}
                onError={handlePaymentError}
                onProcessing={handlePaymentProcessing}
                isProcessing={isProcessing}
            />

            {paymentFailed && (
                <PaymentFailed onClick={() => setPaymentFailed(false)} />
            )}
        </div>
    );
});

export default React.memo(CardForm);