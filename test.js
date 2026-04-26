const mongoose = require("mongoose");
const User = require("./backend/Model/UserModel.js");
mongoose.connect("mongodb://localhost:27017/internshala").then(async () => {
  const users = await User.find({});
  console.log(users);
  process.exit(0);
});
