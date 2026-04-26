const mongoose = require("mongoose");

const FriendSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  friends: [{ type: String }] // Array of friend UIDs
});

module.exports = mongoose.model("Friend", FriendSchema);
