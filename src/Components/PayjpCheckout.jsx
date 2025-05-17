import React, { useEffect, useRef, useState } from 'react'

const PayjpCheckout = ({ totalPrice }) => {
    const scriptContainerRef = useRef(null);
    const [token, setToken] = useState("");

    useEffect(() => {
        scriptContainerRef.current.innerHTML = '';

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://checkout.pay.jp/";
        script.className = "payjp-button";
        script.setAttribute("data-key", "pk_test_c5620903dcfe0af2f19e8475");
        script.setAttribute("data-submit-text", "PAY NOW");
        script.setAttribute("data-partial", "true");

        script.setAttribute("data-payjp-lang", "en");
        script.setAttribute("data-payjp-on-created", "onCreatedToken");
        script.setAttribute("data-payjp-three-d-secure", "true");
        script.setAttribute("data-payjp-three-d-secure-workflow", "redirect");

        window.onCreatedToken = async (token) => {
            console.log(token);
            setToken(token);
            if (!token.id) {
                alert("Failed to create token!");
                return;
            }

            {/**try {
                const res = await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/redirectCharge", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token.id,
                        amount: totalPrice,
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    alert("Payment successful!");
                } else {
                    console.log(data);
                    alert("Payment failed.");
                }
            } catch (error) {
                console.error("Payment error: ", error);
                alert("Payment error.")
            }*/}
        };

        scriptContainerRef.current.appendChild(script);

        return () => {
            delete window.onCreatedToken;
        };
    }, []);

    return (
        <div>
            <div ref={scriptContainerRef}></div>
            <div>token: {token.id}</div>

        </div>
    )
}

export default PayjpCheckout