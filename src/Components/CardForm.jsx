import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';
import { supabase } from '../lib/supabase';
import StripePaymentForm from './StripePaymentForm';

const CardForm = forwardRef(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, setPaymentProcessing }, ref) => {
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateBookingAndPayment = async (paymentData) => {
        try {
            setIsProcessing(true);
            setPaymentProcessing(true);
            setPaymentStatus('Creating booking...');

            // Get form data from the main form
            const form = formRef.current;
            if (!form) {
                throw new Error('Form not found');
            }

            const formData = new FormData(form);
            const contactName = formData.get('contactName');
            const contactEmail = formData.get('contactEmail');
            const contactPhone = formData.get('contactPhone');
            const tourDate = formData.get('tourDate');
            const timeSlot = formData.get('timeSlot');
            const numberOfPeople = parseInt(formData.get('numberOfPeople'));
            const specialRequests = formData.get('specialRequests') || '';
            const discountCode = formData.get('discountCode') || '';

            // Validate required fields
            if (!contactName || !contactEmail || !contactPhone || !tourDate || !timeSlot || !numberOfPeople) {
                throw new Error('Please fill in all required fields');
            }

            console.log('Creating booking with data:', {
                contactName, contactEmail, contactPhone, tourDate, timeSlot, numberOfPeople, specialRequests,
                totalPrice, originalPrice, appliedDiscount, discountCode
            });

            setPaymentStatus('Creating booking...');

            // Create booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    customer_name: contactName,
                    customer_email: contactEmail,
                    customer_phone: contactPhone,
                    booking_date: tourDate,
                    booking_time: timeSlot,
                    adults: numberOfPeople,
                    children: 0,
                    infants: 0,
                    tour_type: sheetId.toUpperCase().replace(' ', '_'),
                    discount_amount: appliedDiscount ? (appliedDiscount.originalAmount - appliedDiscount.finalAmount) : null,
                    discount_code: discountCode,
                    status: 'PENDING_PAYMENT',
                    paid_amount: totalPrice // Set the paid amount (final price after discount) during booking creation
                })
                .select()
                .single();

            if (bookingError) {
                console.error('Booking creation error:', bookingError);
                throw new Error('Failed to create booking');
            }

            console.log('Booking created:', booking);

            // Process payment
            setPaymentStatus('Processing payment...');

            console.log('Making payment request with data:', {
                bookingId: booking.id,
                amount: totalPrice,
                originalAmount: originalPrice || totalPrice,
                discountCode: discountCode,
                payment_method_id: paymentData.payment_method_id
            });

            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-charge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: totalPrice,
                    originalAmount: originalPrice || totalPrice,
                    discountCode: discountCode,
                    payment_method_id: paymentData.payment_method_id
                })
            });

            console.log('Payment API response status:', response.status);
            console.log('Payment API response ok:', response.ok);

            const result = await response.json();
            console.log('Payment API response body:', result);

            if (!response.ok || !result.success) {
                console.error('Payment processing failed:', result);
                throw new Error(result.error || `Payment processing failed: ${response.status}`);
            }

            console.log('Payment successful!', result);

            // Store booking info and redirect to thank you page
            localStorage.setItem('bookingConfirmation', JSON.stringify({
                id: booking.id,
                contactName: booking.contact_name,
                tourDate: booking.tour_date,
                timeSlot: booking.time_slot,
                numberOfPeople: booking.number_of_people,
                totalPrice: booking.total_price
            }));

            // Redirect to thank you page
            window.location.href = '/thankyou';

        } catch (error) {
            console.error('Payment error:', error);
            handlePaymentError(error.message);
        } finally {
            setIsProcessing(false);
            setPaymentProcessing(false);
            setPaymentStatus('');
        }
    };

    const handlePaymentError = (errorMessage) => {
        console.error('Payment failed:', errorMessage);
        setPaymentFailed(true);
        setPaymentStatus('');
        setIsProcessing(false);
        setPaymentProcessing(false);
    };

    const handlePaymentProcessing = (status) => {
        setPaymentStatus(status);
    };

    const handleCreateBooking = () => {
        // This maintains compatibility with the existing interface
        // The actual payment processing is triggered by the Stripe form
        console.log('Booking creation triggered');
    };

    useImperativeHandle(ref, () => ({
        handleCreateBooking
    }));

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

            <div className='text-sm text-gray-600 mb-2'>
                Payment powered by Stripe
            </div>

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
                <PaymentFailed
                    onRetry={() => {
                        setPaymentFailed(false);
                        setPaymentStatus('');
                    }}
                />
            )}
        </div>
    );
});

CardForm.displayName = 'CardForm';

export default CardForm;