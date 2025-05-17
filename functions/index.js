const functions = require("firebase-functions");
const cors = require("cors")({ origin: ["http://localhost:3000", "https://tomodachitours-f4612.web.app"] });
const Payjp = require("payjp");
const payjp = Payjp("sk_test_66666666666666666");

exports.createCharge = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Incoming Request =====");
        console.log("Method:", req.method);
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);

        if (req.method === "OPTIONS") {
            console.log("OPTIONS preflight request");
            return res.status(204).send('');
        }

        if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }

        const token = req.body.token;
        const amount = req.body.amount;
        console.log("Received token:", token);

        if (!token) {
            console.error("Missing token");
            return res.status(400).send({ success: false, message: "Missing token" });
        }

        try {
            console.log("Attempting charge with:", {
                amount,
                currency: "jpy",
                card: token,
                description: "Tour payment"
            });
            const charge = await payjp.charges.create({
                amount,
                currency: "jpy",
                card: token,
                description: "Tour payment",
            });
            console.log("✅ Charge successful:", charge);
            return res.status(200).send({ success: true, charge });
        } catch (error) {
            console.error("❌ Charge failed");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            return res.status(500).send({ success: false, error: error.message });
        }
    });
});

exports.redirectCharge = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Incoming Request =====");
        console.log("Method:", req.method);
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);

        {/**if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }*/}

        const payId = req.query.token_id
        if (!payId) {
            return res.status(400).send("Missing charge_id");
        }

        try {
            // Step 0: Get the charge_id from query params
            const payId = req.query.charge_id;
            if (!payId) {
                console.error("Missing charge_id in query");
                return res.status(400).send("Missing charge_id");
            }

            // Step 1: Fetch the charge info
            const chargeRes = await fetch(`https://api.pay.jp/v1/charges/${payId}`, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${Buffer.from(payjp + ":").toString("base64")}`,
                },
            });

            const chargeData = await chargeRes.json();

            // If 3D Secure was not completed properly
            if (chargeData.three_d_secure_status === "attempted") {
                return res.redirect("http://localhost:3000/cancellation-policy");
            }

            // Step 2: Finish the 3DS redirect flow
            const finishRes = await fetch(`https://api.pay.jp/v1/charges/${payId}/tds_finish`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(payjp + ":").toString("base64")}`,
                },
            });

            if (!finishRes.ok) {
                console.error("Failed to finish 3DS charge:", await finishRes.text());
                return res.redirect("http://localhost:3000/commercial-disclosure");
            }

            return res.redirect("http://localhost:3000/tours");

        } catch (err) {
            console.error("Callback error:", err);
            return res.status(500).send("Internal Server Error");
        }
    });
});
