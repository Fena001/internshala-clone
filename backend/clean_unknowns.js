const mongoose = require("mongoose");
const Friend = require("./Model/Friend");
const User = require("./Model/UserModel");

mongoose.connect("mongodb://localhost:27017/internshala").then(async () => {
  const friends = await Friend.find({});
  for (let f of friends) {
    const validUids = f.friends.filter(uid => mongoose.Types.ObjectId.isValid(uid));
    
    // We only want to keep friends that exist in the User collection
    const existingUsers = await User.find({ _id: { $in: validUids } });
    const existingIds = existingUsers.map(u => u._id.toString());
    
    if (f.friends.length !== existingIds.length) {
      f.friends = existingIds;
      await f.save();
    }
  }
  console.log("Cleaned unknown users");
  process.exit(0);
});
