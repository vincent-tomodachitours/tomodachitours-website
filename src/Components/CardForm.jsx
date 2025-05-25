import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PaymentFailed from '../Pages/PaymentFailed';

const payjp = window.Payjp("pk_test_c5620903dcfe0af2f19e8475", { locale: "en" });

const CardForm = forwardRef(({ totalPrice }, ref) => {
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
                amount: totalPrice
            }),
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = "/thankyou"
        } else {
            setPaymentFailed(true);
        }
    };

    useImperativeHandle(ref, () => ({
        handleGetToken
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