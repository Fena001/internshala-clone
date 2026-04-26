const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  hasPremium: {
    type: Boolean,
    default: false,
  },
  paymentId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Resume", resumeSchema);
