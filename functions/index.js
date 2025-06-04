const functions = require("firebase-functions");
require('dotenv').config();
const { google } = require("googleapis");
const fetch = require('node-fetch');
const serviceAccount = require('./service-account.json');
const cors = require("cors")({ origin: ["http://localhost:3000", "https://tomodachitours-f4612.web.app"] });
const Payjp = require("payjp");
const payjp = Payjp(process.env.STRIPE_SECRET_KEY);

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

//Depricated attempt to fetch bookings
/**exports.getBookings = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Method not allowed");
        }

        const { sheetUrl } = req.body;

        if (!sheetUrl || typeof sheetUrl !== 'string') {
            return res.status(400).json({ error: "Invalid or missing url" });
        }

        try {
            const response = await fetch(sheetUrl);
            const data = await response.json();

            res.status(200).send({ data });
        } catch (error) {
            console.error("Failed to fetch Google sheets data:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })
})*/

exports.getBookings = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).send('Method not allowed');
            }

            const spreadsheetId = "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM";
            const dataRange = req.body.range;

            const auth = new google.auth.GoogleAuth({
                credentials: serviceAccount,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });

            const client = await auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: dataRange,
            });

            // Return the full raw response from Google API
            res.status(200).json(response.data);
        } catch (error) {
            console.error("Unhandled error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});

exports.createBookings = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).send('Method not allowed');
            }
            const spreadsheetId = "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM";
            const dataRange = req.body.range;

            const auth = new google.auth.GoogleAuth({
                credentials: serviceAccount,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const client = await auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            const values = [
                [
                    req.body.date,
                    req.body.time,
                    req.body.adults,
                    req.body.children,
                    req.body.infants,
                    req.body.name,
                    req.body.phone,
                    req.body.email,
                    "",
                    new Date().toISOString(), // timestamp
                ],
            ];

            const resource = { values };

            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: dataRange,
                valueInputOption: "USER_ENTERED",
                resource,
            });

            const scriptUrl = 'https://script.google.com/macros/s/AKfycbx7ZkjQRaqafa2BdzRxCYBvX7rVwBYE12Zr6z4YQWi7y_RvInXqa4MCkm4MzWOdHNm9/exec';
            const emailNotification = await fetch(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'ifyoureadthisyouregay',
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    date: req.body.date,
                    time: req.body.time,
                    adults: req.body.adults,
                    children: req.body.children,
                    infants: req.body.infants,
                    tourname: req.body.tourname,
                    tourprice: req.body.tourprice
                })
            });

            const emailResult = await emailNotification.text();

            res.status(200).json({
                success: true,
                result: response.data,
                emailStatus: emailResult
            });
        } catch (error) {
            console.error("Create booking error:", error);
            res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    })
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
