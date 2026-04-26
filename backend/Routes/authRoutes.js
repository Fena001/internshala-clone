const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../Model/UserModel");
const UAParser = require("ua-parser-js");
const LoginHistory = require("../Model/LoginHistory");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

function generateRandomPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const length = Math.floor(Math.random() * 5) + 8; // Random length between 8 and 12
    let pass = "";
    for (let i = 0; i < length; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

router.post("/forgot-password", async (req, res) => {
    try {
        const { type, value } = req.body;

        if (!value || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Check if user exists (Mock auto-create if not for demo purposes)
        let user = await User.findOne({ [type]: value });
        if (!user) {
            // Because main auth is via Firebase Google OAuth, they don't natively exist in MongoDB yet
            user = await User.create({ [type]: value }); 
        }

        // 2. Reset Limit Rule (Once per day)
        if (user.lastResetDate) {
            const today = new Date();
            const lastReset = new Date(user.lastResetDate);
            if (
                today.getDate() === lastReset.getDate() &&
                today.getMonth() === lastReset.getMonth() &&
                today.getFullYear() === lastReset.getFullYear()
            ) {
                return res.status(429).json({ error: "You can use this option only once per day." });
            }
        }

        // 3. Generate Random Password (A-Z, a-z only)
        const newPassword = generateRandomPassword();

        // 4. Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 5. Update user password and track last reset date
        user.password = hashedPassword;
        user.lastResetDate = new Date();
        await user.save();

        // 6. Send new password via Email or Mock SMS
        if (type === "email") {
            const mailOptions = {
                from: process.env.EMAIL,
                to: value,
                subject: "Your New Password for InternArea",
                text: `Your password has been reset successfully!\n\nYour new temporary password is: ${newPassword}\n\nPlease login and change it immediately.`
            };
            if (process.env.EMAIL && process.env.PASSWORD) {
                await transporter.sendMail(mailOptions);
            } else {
                console.log("\n-----------------------------------------");
                console.log(`[TEST EMAIL FOR: ${value}]`);
                console.log(`Your new password is: ${newPassword}`);
                console.log("-----------------------------------------\n");
            }
        } else if (type === "phone") {
            console.log("\n-----------------------------------------");
            console.log(`[TEST SMS FOR: ${value}]`);
            console.log(`Your new password is: ${newPassword}`);
            console.log("-----------------------------------------\n");
        }

        res.status(200).json({ success: true, message: `A new secure password has been sent to your ${type}!` });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: "An internal error occurred" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { type, value, password } = req.body;

        if (!value || !type || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Parse User Agent & IP
        const parser = new UAParser(req.headers["user-agent"]);
        const result = parser.getResult();
        const browser = result.browser.name || "Unknown Browser";
        const os = result.os.name || "Unknown OS";
        const deviceType = result.device.type || "Desktop";
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown IP";

        // Create initial failed log
        const logEntry = new LoginHistory({ 
            userUid: "Unknown", email: value, browser, os, deviceType, ipAddress, status: "Failed", reason: "Invalid credentials" 
        });

        const user = await User.findOne({ [type]: value });
        if (!user || !user.password) {
            await logEntry.save();
            return res.status(401).json({ error: "Invalid credentials" });
        }

        logEntry.userUid = user._id;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logEntry.save();
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Security Rule 2: Mobile Time Restriction
        if (deviceType.toLowerCase() === "mobile" || deviceType.toLowerCase() === "tablet") {
            const currentHour = new Date().getHours();
            if (currentHour < 10 || currentHour >= 13) {
                logEntry.status = "Blocked";
                logEntry.reason = "Time restricted (Mobile login only 10AM - 1PM)";
                await logEntry.save();
                return res.status(403).json({ error: "Mobile login allowed only between 10:00 AM and 1:00 PM." });
            }
        }

        // Security Rule 1: Chrome -> OTP
        if (browser.includes("Chrome")) {
            const otp = generateOtp();
            user.loginOtp = otp;
            user.loginOtpExpiry = new Date(Date.now() + 5 * 60000); // 5 mins
            await user.save();

            // Send OTP
            if (process.env.EMAIL && process.env.PASSWORD) {
               await transporter.sendMail({
                 from: `"Internshala Security" <${process.env.EMAIL}>`,
                 to: user.email,
                 subject: 'Your Login OTP',
                 text: `Your OTP for login is ${otp}. It expires in 5 minutes.`
               });
            } else {
               console.log(`[TEST OTP FOR ${user.email}]: ${otp}`);
            }

            logEntry.status = "Pending OTP";
            logEntry.reason = "Chrome browser OTP required";
            await logEntry.save();

            return res.status(200).json({ success: true, requireOtp: true, message: "OTP sent to your email", email: user.email });
        }

        // Normal Login
        logEntry.status = "Success";
        logEntry.reason = "Normal login";
        await logEntry.save();

        res.status(200).json({
            success: true,
            user: {
                uid: user._id,
                email: user.email || null,
                phoneNumber: user.phone || null,
                name: user.name || "User",
                photo: user.photo || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "An internal error occurred" });
    }
});

// Verify OTP
router.post("/verify-login-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        // Parse UA for logging
        const parser = new UAParser(req.headers["user-agent"]);
        const result = parser.getResult();
        const browser = result.browser.name || "Unknown Browser";
        const os = result.os.name || "Unknown OS";
        const deviceType = result.device.type || "Desktop";
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown IP";

        if (!user || user.loginOtp !== otp || new Date() > user.loginOtpExpiry) {
            const logEntry = new LoginHistory({ 
                userUid: user ? user._id : "Unknown", 
                email, browser, os, deviceType, ipAddress, 
                status: "Failed", reason: "Invalid or expired OTP" 
            });
            await logEntry.save();
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }

        // OTP Valid
        user.loginOtp = undefined;
        user.loginOtpExpiry = undefined;
        await user.save();

        const logEntry = new LoginHistory({ 
            userUid: user._id, 
            email, browser, os, deviceType, ipAddress, 
            status: "Success", reason: "OTP Verified" 
        });
        await logEntry.save();

        res.status(200).json({
            success: true,
            user: {
                uid: user._id,
                email: user.email || null,
                phoneNumber: user.phone || null,
                name: user.name || "User",
                photo: user.photo || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            }
        });
    } catch (err) {
        console.error("Verify OTP Error:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

// Get Login History
router.get("/login-history/:uid", async (req, res) => {
    try {
        const history = await LoginHistory.find({ userUid: req.params.uid }).sort({ loginDate: -1 }).limit(50);
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ error: "Internal error" });
    }
});

// Log OAuth Login
router.post("/log-oauth-login", async (req, res) => {
    try {
        const { uid, email } = req.body;

        // Parse User Agent & IP
        const parser = new UAParser(req.headers["user-agent"]);
        const result = parser.getResult();
        const browser = result.browser.name || "Unknown Browser";
        const os = result.os.name || "Unknown OS";
        const deviceType = result.device.type || "Desktop";
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown IP";

        const logEntry = new LoginHistory({ 
            userUid: uid || "Unknown", 
            email: email || "Unknown", 
            browser, 
            os, 
            deviceType, 
            ipAddress, 
            status: "Success", 
            reason: "Google OAuth Login" 
        });
        
        await logEntry.save();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("OAuth Login Log Error:", error);
        res.status(500).json({ error: "Internal error" });
    }
});

module.exports = router;
