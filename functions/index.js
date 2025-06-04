const functions = require("firebase-functions");
const admin = require("firebase-admin");
require('dotenv').config();
const { google } = require("googleapis");
const fetch = require('node-fetch');

// Try to load service account, fallback to default admin initialization
let serviceAccount;
try {
    serviceAccount = require('./service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    // Use default Firebase Admin authentication in production
    if (!admin.apps.length) {
        admin.initializeApp();
    }
}

const cors = require("cors")({ origin: ["http://localhost:3000", "https://tomodachitours-f4612.web.app"] });
const Payjp = require("payjp");

// Initialize Pay.jp only if API key is available
let payjp;
const payjpKey = process.env.PAYJP_SECRET_KEY || functions.config().payjp?.secret_key;
if (payjpKey) {
    payjp = Payjp(payjpKey);
    console.log("✅ Pay.jp initialized successfully");
} else {
    console.warn("Pay.jp API key not found - payment functions will not work");
}

// Function to get Google Auth client using Firebase Admin SDK
async function getGoogleAuthClient() {
    try {
        // Try to use service account if available
        if (serviceAccount) {
            console.log("Using service account for Google Sheets authentication");
            const auth = new google.auth.GoogleAuth({
                credentials: serviceAccount,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return await auth.getClient();
        } else {
            console.log("Using default credentials for Google Sheets authentication");
            // Fallback to default application credentials
            const auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return await auth.getClient();
        }
    } catch (error) {
        console.error("Failed to authenticate with Google Sheets:", error);
        throw error;
    }
}

exports.validateDiscountCode = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Discount Code Validation Request =====");
        console.log("Method:", req.method);
        console.log("Body:", req.body);

        if (req.method === "OPTIONS") {
            console.log("OPTIONS preflight request");
            return res.status(204).send('');
        }

        if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { code, tourPrice, adults, children } = req.body;

        if (!code || !tourPrice || adults === undefined || children === undefined) {
            console.error("Missing required fields");
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        try {
            // Define discount codes (could be moved to Firestore for dynamic management)
            const discountCodes = {
                "WELCOME10": { type: "percentage", value: 10, active: true },
                "SUMMER20": { type: "percentage", value: 20, active: true },
                "FRIEND50": { type: "fixed", value: 500, active: true },
                "VIP25": { type: "percentage", value: 25, active: true }
            };

            const discount = discountCodes[code.toUpperCase()];
            
            if (!discount || !discount.active) {
                console.log("Invalid discount code:", code);
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid or expired discount code" 
                });
            }

            const originalAmount = (adults + children) * tourPrice;
            let discountAmount = 0;
            
            if (discount.type === "percentage") {
                discountAmount = Math.round(originalAmount * (discount.value / 100));
            } else if (discount.type === "fixed") {
                discountAmount = Math.min(discount.value, originalAmount);
            }

            const finalAmount = originalAmount - discountAmount;

            console.log("✅ Discount validation successful:", {
                code: code.toUpperCase(),
                originalAmount,
                discountAmount,
                finalAmount
            });

            return res.status(200).json({
                success: true,
                discount: {
                    code: code.toUpperCase(),
                    type: discount.type,
                    value: discount.value,
                    discountAmount,
                    originalAmount,
                    finalAmount
                }
            });

        } catch (error) {
            console.error("❌ Discount validation failed");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            return res.status(500).json({ success: false, error: "Internal server error" });
        }
    });
});

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
        const discountCode = req.body.discountCode;
        const originalAmount = req.body.originalAmount;

        console.log("Received token:", token);
        console.log("Discount info:", { discountCode, originalAmount, amount });

        if (!token) {
            console.error("Missing token");
            return res.status(400).send({ success: false, message: "Missing token" });
        }

        try {
            if (!payjp) {
                console.error("Pay.jp not initialized - missing API key");
                return res.status(500).send({ success: false, error: "Payment service not available" });
            }

            console.log("Attempting charge with:", {
                amount,
                currency: "jpy",
                card: token,
                description: discountCode ? 
                    `Tour payment (${discountCode} applied - Original: ¥${originalAmount})` : 
                    "Tour payment"
            });
            
            const charge = await payjp.charges.create({
                amount,
                currency: "jpy",
                card: token,
                description: discountCode ? 
                    `Tour payment (${discountCode} applied - Original: ¥${originalAmount})` : 
                    "Tour payment",
                metadata: {
                    discount_code: discountCode || "",
                    original_amount: originalAmount || amount
                }
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

            const client = await getGoogleAuthClient();
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

            const client = await getGoogleAuthClient();
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
                    req.body.tourname || "", // Tour name (I)
                    new Date().toISOString(), // timestamp (J)
                    "CONFIRMED", // Status (K)
                    "", // Charge ID (L) - will be updated after payment
                    req.body.discountcode || "", // Discount code (M)
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

exports.updateBookingChargeId = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Update Booking Charge ID Request =====");
        console.log("Method:", req.method);
        console.log("Body:", req.body);

        if (req.method === "OPTIONS") {
            console.log("OPTIONS preflight request");
            return res.status(204).send('');
        }

        if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { email, chargeId, tourname } = req.body;

        if (!email || !chargeId || !tourname) {
            console.error("Missing required fields for charge ID update");
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        try {
            const spreadsheetId = "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM";
            
            const client = await getGoogleAuthClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            // Find the most recent booking for this email and tour without charge ID
            const getResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `A2:M`,
            });

            const bookings = getResponse.data.values || [];
            const bookingIndex = bookings.findIndex(booking => 
                booking[7] === email && 
                booking[8] === tourname && 
                !booking[11] // No charge ID yet (column L)
            );

            if (bookingIndex !== -1) {
                const rowIndex = bookingIndex + 2;
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `L${rowIndex}`, // Charge ID column
                    valueInputOption: "USER_ENTERED",
                    resource: {
                        values: [[chargeId]]
                    }
                });

                console.log("✅ Charge ID updated successfully");
            } else {
                console.log("No matching booking found for charge ID update");
            }

            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("❌ Update charge ID failed");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            return res.status(500).json({ success: false, error: "Internal server error" });
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
            if (!payjp) {
                console.error("Pay.jp not initialized - cannot process redirect");
                return res.redirect("http://localhost:3000/commercial-disclosure");
            }

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
                    Authorization: `Basic ${Buffer.from(payjpKey + ":").toString("base64")}`,
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
                    Authorization: `Basic ${Buffer.from(payjpKey + ":").toString("base64")}`,
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

exports.cancelBooking = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Booking Cancellation Request =====");
        console.log("Method:", req.method);
        console.log("Body:", req.body);

        if (req.method === "OPTIONS") {
            console.log("OPTIONS preflight request");
            return res.status(204).send('');
        }

        if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { bookingId, chargeId, email } = req.body;

        if (!chargeId || !email) {
            console.error("Missing required fields for cancellation");
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        try {
            // 1. Verify booking exists and get details
            const spreadsheetId = "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM";
            
            const client = await getGoogleAuthClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            // Get booking details
            const getResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `A2:M`, // Extended to include new columns
            });

            const bookings = getResponse.data.values || [];
            const bookingIndex = bookings.findIndex(booking => 
                booking[7] === email && booking[11] === chargeId // email (H) and charge_id (L) match
            );

            if (bookingIndex === -1) {
                console.error("Booking not found for cancellation");
                return res.status(404).json({ 
                    success: false, 
                    message: "Booking not found" 
                });
            }

            const booking = bookings[bookingIndex];
            const bookingDate = new Date(booking[0]);
            const now = new Date();
            const timeDifference = bookingDate.getTime() - now.getTime();
            const hoursDifference = timeDifference / (1000 * 3600);

            console.log("Booking found:", {
                email,
                date: booking[0],
                hoursDifference: hoursDifference
            });

            // Check 24-hour cancellation policy
            if (hoursDifference < 24) {
                console.error("Cancellation attempted within 24 hours");
                return res.status(400).json({
                    success: false,
                    message: "Cancellation must be made at least 24 hours before the tour date"
                });
            }

            // 2. Process refund through Pay.jp
            console.log("Processing refund for charge:", chargeId);
            
            if (!payjp) {
                console.error("Pay.jp not initialized - cannot process refund");
                return res.status(500).json({
                    success: false,
                    message: "Payment service not available for refunds"
                });
            }

            const refund = await payjp.refunds.create({
                charge: chargeId,
                reason: "requested_by_customer"
            });

            if (!refund || refund.object !== 'refund') {
                console.error("Failed to create refund");
                return res.status(500).json({
                    success: false,
                    message: "Failed to process refund"
                });
            }

            console.log("✅ Refund successful:", refund);

            // 3. Update booking status in Google Sheets
            const rowIndex = bookingIndex + 2; // +2 because sheets are 1-indexed and we start from row 2
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `K${rowIndex}`, // Status column
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: [["CANCELLED"]]
                }
            });

            console.log("✅ Booking status updated to CANCELLED");

            // 4. Send cancellation confirmation email
            const emailNotification = await fetch('https://script.google.com/macros/s/AKfycbx7ZkjQRaqafa2BdzRxCYBvX7rVwBYE12Zr6z4YQWi7y_RvInXqa4MCkm4MzWOdHNm9/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'ifyoureadthisyouregay',
                    type: 'cancellation',
                    name: booking[5], // F: name
                    email: booking[7], // H: email
                    tourname: booking[8] || 'Tour', // I: tour name (will be added)
                    date: booking[0], // A: date
                    time: booking[1], // B: time
                    refundAmount: refund.amount
                })
            });

            const emailResult = await emailNotification.text();
            console.log("Email notification sent:", emailResult);

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                refund: {
                    amount: refund.amount,
                    id: refund.id
                }
            });

        } catch (error) {
            console.error("❌ Cancellation failed");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            return res.status(500).json({ 
                success: false, 
                error: "Internal server error" 
            });
        }
    });
});

exports.getBookingDetails = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        console.log("===== Get Booking Details Request =====");
        console.log("Method:", req.method);
        console.log("Body:", req.body);

        if (req.method === "OPTIONS") {
            console.log("OPTIONS preflight request");
            return res.status(204).send('');
        }

        if (req.method !== "POST") {
            console.error("Invalid method:", req.method);
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { email } = req.body;

        if (!email) {
            console.error("Missing email for booking lookup");
            return res.status(400).send({ success: false, message: "Email is required" });
        }

        try {
            const spreadsheetId = "1sGrijFYalE47yFiV4JdyHHiY9VmrjVMdbI5RTwog5RM";
            
            const client = await getGoogleAuthClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `A2:M`,
            });

            const bookings = response.data.values || [];
            const userBookings = bookings
                .filter(booking => booking[7] === email && booking[10] !== "CANCELLED") // Not cancelled
                .map((booking, index) => ({
                    id: index + 2, // Row number in sheet
                    date: booking[0],
                    time: booking[1],
                    adults: booking[2],
                    children: booking[3],
                    tourName: booking[8] || 'Tour',
                    chargeId: booking[11] || '', // L: charge_id
                    canCancel: new Date(booking[0]).getTime() - new Date().getTime() > 24 * 60 * 60 * 1000 // 24 hours
                }));

            console.log("✅ Found bookings for user:", userBookings.length);

            return res.status(200).json({
                success: true,
                bookings: userBookings
            });

        } catch (error) {
            console.error("❌ Get booking details failed");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
            return res.status(500).json({ 
                success: false, 
                error: "Internal server error" 
            });
        }
    });
});