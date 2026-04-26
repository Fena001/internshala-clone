const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application=require("./application")

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
const otpRoutes = require("./otpRoutes");
router.use("/otp", otpRoutes);
const paymentRoute = require("./paymentRoute");
router.use("/resume", paymentRoute);
const authRoutes = require("./authRoutes");
router.use("/auth", authRoutes);
const publicSpaceRoutes = require("./publicSpace");
router.use("/public-space", publicSpaceRoutes);
const subscriptionRoutes = require("./subscriptionRoutes");
router.use("/subscription", subscriptionRoutes);

module.exports = router;