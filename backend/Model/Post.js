const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userUid: { type: String, required: true },
  userName: { type: String, required: true },
  userPhoto: { type: String },
  caption: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  hashtags: [{ type: String }],
  likes: [{ type: String }], // Array of user UIDs
  comments: [{
    userUid: String,
    userName: String,
    userPhoto: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  shares: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
