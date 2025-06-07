import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';
import { supabase } from '../lib/supabase';

// Initialize PayJP outside of component to ensure single initialization
let payjp = null;
if (window.Payjp && !payjp) {
    payjp = window.Payjp(process.env.REACT_APP_PAYJP_PUBLIC_KEY, {
        locale: "en",
        threeDSecure: true
    });
}

const CardForm = forwardRef(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, setPaymentProcessing }, ref) => {
    const [isPayJPReady, setIsPayJPReady] = useState(false);
    const numberElement = useRef(null);
    const expiryElement = useRef(null);
    const cvcElement = useRef(null);
    const [paymentFailed, setPaymentFailed] = useState(false);
    const initializationAttempted = useRef(false);

    useEffect(() => {
        if (initializationAttempted.current) return;
        initializationAttempted.current = true;

        if (!payjp && window.Payjp) {
            payjp = window.Payjp(process.env.REACT_APP_PAYJP_PUBLIC_KEY, {
                locale: "en",
                threeDSecure: true
            });
        }

        const initializePayJP = () => {
            if (payjp) {
                setIsPayJPReady(true);
            } else if (window.Payjp) {
                payjp = window.Payjp(process.env.REACT_APP_PAYJP_PUBLIC_KEY, {
                    locale: "en",
                    threeDSecure: true
                });
                setIsPayJPReady(true);
            }
        };

        initializePayJP();

        if (!payjp) {
            const checkPayJP = setInterval(() => {
                initializePayJP();
                if (payjp) {
                    clearInterval(checkPayJP);
                }
            }, 100);

            return () => clearInterval(checkPayJP);
        }
    }, []);

    useEffect(() => {
        if (!isPayJPReady || !payjp) return;

        // Cleanup previous elements
        if (numberElement.current) {
            numberElement.current.unmount();
        }
        if (expiryElement.current) {
            expiryElement.current.unmount();
        }
        if (cvcElement.current) {
            cvcElement.current.unmount();
        }

        const elements = payjp.elements();
        numberElement.current = elements.create("cardNumber");
        expiryElement.current = elements.create("cardExpiry");
        cvcElement.current = elements.create("cardCvc");

        // Mount elements
        const numberForm = document.getElementById("number-form");
        const expiryForm = document.getElementById("expiry-form");
        const cvcForm = document.getElementById("cvc-form");

        if (numberForm) numberElement.current.mount("#number-form");
        if (expiryForm) expiryElement.current.mount("#expiry-form");
        if (cvcForm) cvcElement.current.mount("#cvc-form");

        window.cardElements = {
            numberElement: numberElement.current,
            expiryElement: expiryElement.current,
            cvcElement: cvcElement.current,
        };

        // Cleanup function
        return () => {
            if (numberElement.current) numberElement.current.unmount();
            if (expiryElement.current) expiryElement.current.unmount();
            if (cvcElement.current) cvcElement.current.unmount();
        };
    }, [isPayJPReady]);

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

    const handleGetToken = async () => {
        if (!numberElement.current || !expiryElement.current || !cvcElement.current) {
            alert("element is not mounted");
            return;
        }

        try {
            // Create token without additional parameters - PayJP handles 3D Secure automatically
            const tokenResponse = await payjp.createToken(numberElement.current);

            if (!tokenResponse || tokenResponse.error) {
                console.error("Token creation failed:", tokenResponse.error);
                setPaymentProcessing(false);
                alert("Payment failed: " + (tokenResponse.error?.message || "Token creation failed"));
                return;
            }

            // Call Supabase Edge Function
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-charge`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    token: tokenResponse.id,
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
        } catch (error) {
            console.error("Payment processing error:", error);
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