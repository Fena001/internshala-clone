const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const OTP = require('../Model/OtpModel');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await OTP.create({ email, otp });

        if (process.env.EMAIL && process.env.PASSWORD) {
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Internshala Clone - Language Change OTP',
                text: `Your OTP to change the website language to French is: ${otp}. It will expire in 5 minutes.`
            };
            await transporter.sendMail(mailOptions);
        } else {
            console.log("\n-----------------------------------------");
            console.log(`[TEST MODE] EMAIL NOT CONFIGURED IN .env!`);
            console.log(`[TEST MODE] The OTP for ${email} is: ${otp}`);
            console.log("-----------------------------------------\n");
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

        const record = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Delete verified OTP
        await OTP.deleteOne({ _id: record._id });
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
});

module.exports = router;
