const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  userUid: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['Free', 'Bronze', 'Silver', 'Gold'], default: 'Free' },
  planExpiry: { type: Date },
  applicationsThisMonth: { type: Number, default: 0 },
  lastApplicationReset: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
