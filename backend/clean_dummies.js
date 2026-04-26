const mongoose = require("mongoose");
const Friend = require("./Model/Friend");
mongoose.connect("mongodb://localhost:27017/internshala").then(async () => {
  const friends = await Friend.find({});
  for (let f of friends) {
    const validUids = f.friends.filter(uid => mongoose.Types.ObjectId.isValid(uid));
    if (validUids.length !== f.friends.length) {
      f.friends = validUids;
      await f.save();
    }
  }
  console.log("Cleaned dummy friends");
  process.exit(0);
});
