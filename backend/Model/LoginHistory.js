const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  userUid: { type: String, required: true },
  email: { type: String }, // To identify who attempted to login
  loginDate: { type: Date, default: Date.now },
  browser: { type: String },
  os: { type: String },
  deviceType: { type: String },
  ipAddress: { type: String },
  status: { type: String, enum: ["Success", "Failed", "Blocked", "Pending OTP"], required: true },
  reason: { type: String }
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
