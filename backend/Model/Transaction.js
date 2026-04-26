const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userUid: { type: String, required: true },
  amount: { type: Number, required: true },
  planName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  invoiceId: { type: String, required: true },
  status: { type: String, default: "Success" },
  paymentId: { type: String }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
