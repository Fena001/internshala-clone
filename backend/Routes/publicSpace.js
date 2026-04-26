const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../Model/Post");
const Friend = require("../Model/Friend");
const User = require("../Model/UserModel");

// Helper to get friend count
const getFriendCount = async (uid) => {
  const friendDoc = await Friend.findOne({ uid });
  return friendDoc ? friendDoc.friends.length : 0;
};

// 1. Fetch feed API
router.get("/feed", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Post.countDocuments();
    res.json({ success: true, posts, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Friend count and list API
router.get("/friends/:uid", async (req, res) => {
  try {
    const friendDoc = await Friend.findOne({ uid: req.params.uid });
    const count = friendDoc ? friendDoc.friends.length : 0;
    const friendUids = friendDoc ? friendDoc.friends : [];
    
    // Filter out valid MongoDB ObjectIds, because dummy friends (e.g., 'dummy_123') will throw a CastError
    const validUids = friendUids.filter(uid => mongoose.Types.ObjectId.isValid(uid));
    
    // Fetch full user objects for these UIDs
    const friendsDetails = await User.find({ _id: { $in: validUids } }).select("name email photo");

    const friends = await Promise.all(friendUids.map(async uid => {
      // 1. Check if they exist in MongoDB User collection
      const details = friendsDetails.find(u => u._id.toString() === uid);
      if (details) {
        const emailPrefix = details.email ? details.email.split('@')[0] : "User";
        const displayName = details.name || emailPrefix;
        return { uid: details._id, name: displayName, email: details.email, photo: details.photo };
      }
      
      // 2. If not in MongoDB, they might be a Firebase user. Check if they have a post to grab their name/photo.
      const userPost = await Post.findOne({ userUid: uid });
      if (userPost) {
        return { uid, name: userPost.userName || "User", email: "", photo: userPost.userPhoto };
      }
      
      // 3. Complete fallback
      return { uid, name: "Unknown User", photo: null };
    }));

    res.json({ success: true, count, friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2.6 Search Users API
router.get("/search-users", async (req, res) => {
  try {
    const { q, currentUid, currentEmail } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    // Search by name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).limit(10);

    const filtered = users.filter(u => {
      const isSameUid = u._id.toString() === currentUid;
      const isSameEmail = currentEmail && u.email && u.email.toLowerCase() === currentEmail.toLowerCase();
      return !isSameUid && !isSameEmail;
    });
    res.json({ success: true, users: filtered.map(u => {
      const emailPrefix = u.email ? u.email.split('@')[0] : "User";
      const displayName = u.name || emailPrefix;
      return { uid: u._id, name: displayName, email: u.email, photo: u.photo };
    }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2.5 Suggested Friends API
router.get("/suggested-friends/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { currentEmail } = req.query;
    const friendDoc = await Friend.findOne({ uid });
    const friendsList = friendDoc ? friendDoc.friends : [];
    
    // Find users who are not the current user and not in their friends list
    const excludeUids = [...friendsList, uid];
    
    // We need to match MongoDB `_id` with `excludeUids`. 
    // Since Firebase `uid` is sometimes used, we should check if they match _id or uid field.
    // In our authRoutes, we set _id as uid for MongoDB auth, but Firebase users use Firebase uid.
    // User model doesn't have a specific 'uid' field, it uses '_id', or if firebase, maybe we don't have them in User model.
    // Let's just return all users from User model who are not the current user.
    const suggested = await User.find({}).limit(5);
    
    // Filter out manually because _id and uid formats might be tricky
    const filtered = suggested.filter(u => {
      const isInExcludeList = excludeUids.includes(u._id.toString());
      const isSameUid = u._id.toString() === uid;
      const isSameEmail = currentEmail && u.email && u.email.toLowerCase() === currentEmail.toLowerCase();
      return !isInExcludeList && !isSameUid && !isSameEmail;
    });

    res.json({ success: true, suggested: filtered.map(u => {
      const emailPrefix = u.email ? u.email.split('@')[0] : "User";
      const displayName = u.name || emailPrefix;
      return { uid: u._id, name: displayName, email: u.email, photo: u.photo };
    }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add friend (For testing/implementation)
router.post("/friends/add", async (req, res) => {
  try {
    const { uid, friendUid } = req.body;
    let friendDoc = await Friend.findOne({ uid });
    if (!friendDoc) {
      friendDoc = new Friend({ uid, friends: [] });
    }
    if (!friendDoc.friends.includes(friendUid) && uid !== friendUid) {
      friendDoc.friends.push(friendUid);
    }
    await friendDoc.save();
    res.json({ success: true, friends: friendDoc.friends, count: friendDoc.friends.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Daily post count API
router.get("/daily-count/:uid", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const count = await Post.countDocuments({
      userUid: req.params.uid,
      createdAt: { $gte: startOfToday }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Create post API
router.post("/post", async (req, res) => {
  try {
    const { userUid, userName, userPhoto, caption, mediaUrl, mediaType, hashtags } = req.body;
    
    // Applying Friend-Based Posting Limit Rules
    const friendCount = await getFriendCount(userUid);
    if (friendCount === 0) {
      return res.json({ success: false, code: "NO_FRIENDS", message: "Add friends to start posting in Public Space." });
    }
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const postCountToday = await Post.countDocuments({ userUid, createdAt: { $gte: startOfToday } });
    
    let limit = 0;
    if (friendCount === 1) limit = 1;
    else if (friendCount === 2) limit = 2;
    else if (friendCount >= 3 && friendCount <= 10) limit = friendCount;
    else if (friendCount > 10) limit = Infinity;

    if (postCountToday >= limit) {
      return res.json({ success: false, code: "LIMIT_REACHED", message: `Daily posting limit reached. You have ${friendCount} friends, so you can post ${limit} times per day.` });
    }
    
    const newPost = new Post({ userUid, userName, userPhoto, caption, mediaUrl, mediaType, hashtags });
    await newPost.save();
    res.json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Like/unlike API
router.post("/post/:postId/like", async (req, res) => {
  try {
    const { uid } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    
    const likeIndex = post.likes.indexOf(uid);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(uid);
    }
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Comment API
router.post("/post/:postId/comment", async (req, res) => {
  try {
    const { userUid, userName, userPhoto, text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    
    const comment = { userUid, userName, userPhoto, text, createdAt: new Date() };
    post.comments.push(comment);
    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Share API
router.post("/post/:postId/share", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.shares += 1;
    await post.save();
    res.json({ success: true, shares: post.shares });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Delete own post API
router.delete("/post/:postId", async (req, res) => {
  try {
    const { uid } = req.query; // Send from frontend query ?uid=...
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.userUid !== uid) return res.status(403).json({ success: false, message: "Unauthorized to delete this post" });
    
    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
