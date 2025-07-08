import React, { useState, useEffect, useRef, useCallback } from 'react';

// Initialize PayJP outside of component to ensure single initialization
let payjp = null;
if (typeof window !== 'undefined' && window.Payjp && !payjp) {
    payjp = window.Payjp(process.env.REACT_APP_PAYJP_PUBLIC_KEY, {
        locale: "en",
        threeDSecure: true
    });
}

const PayjpPaymentForm = ({ totalPrice, originalPrice, appliedDiscount, onCreateBookingAndPayment, onError, onProcessing, isProcessing }) => {
    const [isPayJPReady, setIsPayJPReady] = useState(false);
    const numberElement = useRef(null);
    const expiryElement = useRef(null);
    const cvcElement = useRef(null);
    const initializationAttempted = useRef(false);

    useEffect(() => {
        if (initializationAttempted.current) return;
        initializationAttempted.current = true;

        if (!payjp && typeof window !== 'undefined' && window.Payjp) {
            payjp = window.Payjp(process.env.REACT_APP_PAYJP_PUBLIC_KEY, {
                locale: "en",
                threeDSecure: true
            });
        }

        const initializePayJP = () => {
            if (payjp) {
                setIsPayJPReady(true);
            } else if (typeof window !== 'undefined' && window.Payjp) {
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
        const numberForm = document.getElementById("payjp-number-form");
        const expiryForm = document.getElementById("payjp-expiry-form");
        const cvcForm = document.getElementById("payjp-cvc-form");

        if (numberForm) numberElement.current.mount("#payjp-number-form");
        if (expiryForm) expiryElement.current.mount("#payjp-expiry-form");
        if (cvcForm) cvcElement.current.mount("#payjp-cvc-form");

        // Cleanup function
        return () => {
            if (numberElement.current) numberElement.current.unmount();
            if (expiryElement.current) expiryElement.current.unmount();
            if (cvcElement.current) cvcElement.current.unmount();
        };
    }, [isPayJPReady]);

    const handleSubmit = useCallback(async () => {
        if (!numberElement.current || !expiryElement.current || !cvcElement.current) {
            onError("Payment form is not ready");
            return;
        }

        if (isProcessing) {
            return; // Prevent double submission
        }

        // Set 3D Secure flags IMMEDIATELY before any processing starts
        // Use both localStorage and sessionStorage for maximum persistence
        localStorage.setItem('payjp_3ds_in_progress', 'true');
        localStorage.setItem('checkout_should_stay_open', 'true');
        sessionStorage.setItem('payjp_3ds_in_progress', 'true');
        sessionStorage.setItem('checkout_should_stay_open', 'true');
        console.log('🔒 PayJP 3D Secure flags set - preventing checkout close');

        onProcessing('Verifying payment with PayJP... If a popup opens, please complete the verification.');

        try {
            // Create token - PayJP handles 3D Secure automatically
            const tokenResponse = await payjp.createToken(numberElement.current);

            // Clear 3D Secure flags
            localStorage.removeItem('payjp_3ds_in_progress');
            localStorage.removeItem('checkout_should_stay_open');
            sessionStorage.removeItem('payjp_3ds_in_progress');
            sessionStorage.removeItem('checkout_should_stay_open');

            if (!tokenResponse || tokenResponse.error) {
                throw new Error(tokenResponse.error?.message || "Token creation failed");
            }

            // Update processing message after successful token creation
            onProcessing('Payment verified! Completing your booking...');

            // Call the booking and payment handler with PayJP payment data
            await onCreateBookingAndPayment({
                token: tokenResponse.id,
                provider: 'payjp'
            });

        } catch (error) {
            // Clear 3D Secure flags in case of error
            localStorage.removeItem('payjp_3ds_in_progress');
            localStorage.removeItem('checkout_should_stay_open');
            sessionStorage.removeItem('payjp_3ds_in_progress');
            sessionStorage.removeItem('checkout_should_stay_open');

            console.error('PayJP payment error:', error);
            onError(error.message);
        }
    }, [isProcessing, onCreateBookingAndPayment, onError, onProcessing]);

    // Expose submit function to window for external button
    useEffect(() => {
        window.submitPaymentForm = handleSubmit;
        return () => {
            delete window.submitPaymentForm;
        };
    }, [handleSubmit]);

    return (
        <div className="w-full">
            <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">Card Number</span>
                <div id='payjp-number-form' className='p-2 bg-white border border-gray-300 rounded-md' />
            </div>
            <div className='flex flex-row gap-4 mb-4'>
                <div className='basis-1/2'>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</span>
                    <div id='payjp-expiry-form' className='p-2 bg-white border border-gray-300 rounded-md' />
                </div>
                <div className='basis-1/2'>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Security Code</span>
                    <div id='payjp-cvc-form' className='p-2 bg-white border border-gray-300 rounded-md' />
                </div>
            </div>
        </div>
    );
};

export default PayjpPaymentForm; 