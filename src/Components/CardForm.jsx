import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';
import { supabase } from '../lib/supabase';

const payjp = window.Payjp("pk_test_c5620903dcfe0af2f19e8475", { locale: "en" });

const CardForm = forwardRef(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, setPaymentProcessing }, ref) => {
    const handleCreateBooking = async () => {
        try {
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
                alert(`Failed to create booking. ${error.message || error}`);
                return;
            }

            // Store booking ID for later use
            window.currentBookingId = data.id;
            handleGetToken();
        } catch (error) {
            setPaymentProcessing(false);
            console.error("Error submitting booking:", error);
            alert("Something went wrong.");
        }
    }

    const numberElement = useRef(null);
    const expiryElement = useRef(null);
    const cvcElement = useRef(null);

    const [paymentFailed, setPaymentFailed] = useState(false);

    useEffect(() => {
        const elements = payjp.elements();
        numberElement.current = elements.create("cardNumber");
        numberElement.current.mount("#number-form");
        expiryElement.current = elements.create("cardExpiry");
        expiryElement.current.mount("#expiry-form");
        cvcElement.current = elements.create("cardCvc");
        cvcElement.current.mount("#cvc-form");

        window.cardElements = {
            numberElement: numberElement.current,
            expiryElement: expiryElement.current,
            cvcElement: cvcElement.current,
        };
    }, []);

    const handleGetToken = async () => {
        if (!numberElement.current || !expiryElement.current || !cvcElement.current) {
            alert("element is not mounted");
            return;
        }
        const token = await payjp.createToken(numberElement.current);

        if (!token || token.error) {
            alert("Token creation failed.");
            setPaymentProcessing(false);
            return;
        }

        // Call Supabase Edge Function instead of Firebase
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-charge`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                token: token.id,
                amount: totalPrice,
                discountCode: appliedDiscount?.code || null,
                originalAmount: originalPrice || totalPrice,
                bookingId: window.currentBookingId
            }),
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = "/thankyou"
        } else {
            setPaymentProcessing(false);
            setPaymentFailed(true);
        }
    };

    useImperativeHandle(ref, () => ({
        handleCreateBooking
    }));

    /**const handleRedirectToken = async () => {
            if (!numberElement || !expiryElement || !cvcElement) {
                alert("element is not mounted");
                return;
            }
            
            const token = await payjp.createToken(window.cardElements.numberElement);
            
            if (!token || token.error) {
                alert("Token creation failed.");
                return;
            }
            
            // Redirect to backend function with query params
            window.location.href = `https://us-central1-tomodachitours-f4612.cloudfunctions.net/redirectCharge?token=${token.id}&amount=${totalPrice}`;
        };*/

    return (
        <div className='w-full h-36 flex flex-col gap-4'>
            <div>
                <span>Card Number</span>
                <div id='number-form' className='p-2 bg-white border border-gray-300 rounded-md' />
            </div>
            <div className='flex flex-row gap-4'>
                <div className='basis-1/2'>
                    <span>Expiry Date</span>
                    <div id='expiry-form' className='p-2 bg-white border border-gray-300 rounded-md' />
                </div>
                <div className='basis-1/2'>
                    <span>Security Code</span>
                    <div id='cvc-form' className='p-2 bg-white border border-gray-300 rounded-md' />
                </div>
            </div>
            {paymentFailed ? <PaymentFailed onClick={() => setPaymentFailed(false)} /> : null}
        </div>
    );
});

export default React.memo(CardForm);