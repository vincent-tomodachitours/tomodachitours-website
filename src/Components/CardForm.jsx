import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';

const payjp = window.Payjp("pk_test_c5620903dcfe0af2f19e8475", { locale: "en" });

const CardForm = forwardRef(({ totalPrice, originalPrice, appliedDiscount, formRef, tourName, sheetId, setPaymentProcessing }, ref) => {
    const handleCreateBooking = async () => {
        try {
            const bookingData = {
                ...formRef.current
            }
            console.log(formRef.current)
            const response = await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/createBookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...bookingData,
                    range: `${sheetId}!A2:M`,
                    tourname: tourName,
                    tourprice: totalPrice,
                    discountcode: appliedDiscount?.code || ""
                }),
            });

            const result = await response.json();

            if (result.success) {
                handleGetToken()
            } else {
                setPaymentProcessing(false);
                alert("Oops, something went wrong.");
            }
        } catch (error) {
            setPaymentProcessing(false);
            console.error("Error submitting booking:", error);
            alert("Something went wrong.");
        }
    }

    let numberElement = null;
    let expiryElement = null;
    let cvcElement = null;

    const [paymentFailed, setPaymentFailed] = useState(false);

    const handlePayDivMount = () => {
        const elements = payjp.elements();

        numberElement = elements.create("cardNumber");
        numberElement.mount("#number-form");
        expiryElement = elements.create("cardExpiry");
        expiryElement.mount("#expiry-form")
        cvcElement = elements.create("cardCvc");
        cvcElement.mount("#cvc-form")

        window.cardElements = {
            numberElement,
            expiryElement,
            cvcElement,
        };
    };

    const handleGetToken = async () => {
        if (!numberElement || !expiryElement || !cvcElement) {
            alert("element is not mounted");
            return;
        }
        const token = await payjp.createToken(window.cardElements.numberElement);

        const response = await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/createCharge", {
            method: "POST", //POST for popup
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token.id,
                amount: totalPrice, // This is the discounted amount
                discountCode: appliedDiscount?.code || null,
                originalAmount: originalPrice || totalPrice
            }),
        });

        const data = await response.json();
        if (data.success) {
            // Update booking with charge ID before redirecting
            try {
                await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/updateBookingChargeId", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: formRef.current.email,
                        chargeId: data.charge.id,
                        tourname: tourName
                    }),
                });
            } catch (error) {
                console.error("Failed to update booking with charge ID:", error);
                // Don't block the success flow
            }
            
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
                    <div id='cvc-form' ref={handlePayDivMount} className='p-2 bg-white border border-gray-300 rounded-md' />
                </div>
            </div>
            {paymentFailed ? <PaymentFailed onClick={() => setPaymentFailed(false)} /> : null}
        </div>
    );
});

export default React.memo(CardForm);