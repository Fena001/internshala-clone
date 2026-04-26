const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Subscription = require("../Model/Subscription");
const Transaction = require("../Model/Transaction");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

router.post("/create-order", async (req, res) => {
    try {
        // Payment Time Restriction Logic: 10:00 AM to 11:00 AM IST
        // Get current UTC time, add 5.5 hours for IST
        const nowUtc = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const nowIst = new Date(nowUtc.getTime() + istOffset);
        const hoursIst = nowIst.getUTCHours(); // getUTCHours because we manually added the offset

        if (hoursIst !== 10) {
            return res.status(403).json({ error: "Payments are allowed only between 10:00 AM and 11:00 AM IST." });
        }

        const { amount, planName } = req.body;
        if (!amount || !planName) return res.status(400).json({ error: "Amount and plan name required" });

        const options = {
            amount: amount * 100, // Razorpay takes amount in paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (err) {
        console.error("Create order error", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/verify-payment", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, planName, userUid, userEmail } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid signature" });
        }

        const invoiceId = `INV-${Date.now()}`;
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month plan

        // 1. Update Subscription
        let sub = await Subscription.findOne({ userUid });
        if (!sub) {
            sub = new Subscription({ userUid });
        }
        sub.plan = planName;
        sub.planExpiry = expiryDate;
        sub.applicationsThisMonth = 0; // Reset on new plan purchase
        sub.lastApplicationReset = startDate;
        await sub.save();

        // 2. Save Transaction
        const transaction = new Transaction({
            userUid,
            amount,
            planName,
            invoiceId,
            paymentId: razorpay_payment_id,
            status: "Success"
        });
        await transaction.save();

        // 3. Send Email
        if (process.env.EMAIL && process.env.PASSWORD && userEmail) {
            await transporter.sendMail({
                from: `"Internshala" <${process.env.EMAIL}>`,
                to: userEmail,
                subject: `Subscription Activated: ${planName} Plan`,
                html: `
                    <h2>Payment Successful!</h2>
                    <p>Your <b>${planName}</b> plan has been activated.</p>
                    <p><b>Amount Paid:</b> ₹${amount}</p>
                    <p><b>Invoice ID:</b> ${invoiceId}</p>
                    <p><b>Start Date:</b> ${startDate.toDateString()}</p>
                    <p><b>Expiry Date:</b> ${expiryDate.toDateString()}</p>
                    <br/>
                    <p>Thank you for choosing Internshala.</p>
                `
            });
        }

        res.json({ success: true, message: "Payment verified and plan activated!" });
    } catch (err) {
        console.error("Verify payment error", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/my-plan/:uid", async (req, res) => {
    try {
        const sub = await Subscription.findOne({ userUid: req.params.uid });
        res.json({ success: true, subscription: sub });
    } catch (err) {
        res.status(500).json({ error: "Internal error" });
    }
});

router.get("/transactions/:uid", async (req, res) => {
    try {
        const transactions = await Transaction.find({ userUid: req.params.uid }).sort({ date: -1 });
        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ error: "Internal error" });
    }
});

module.exports = router;
