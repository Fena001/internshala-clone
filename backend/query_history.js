const mongoose = require("mongoose");
require('dotenv').config();
const url = process.env.DATABASE_URL;

mongoose.connect(url).then(async () => {
    const LoginHistory = require("./Model/LoginHistory");
    const count = await LoginHistory.countDocuments({});
    console.log("Total LoginHistory documents:", count);
    
    if(count > 0) {
        const docs = await LoginHistory.find({}).limit(5);
        console.log(JSON.stringify(docs, null, 2));
    }
    
    // Also list all collections just in case
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name).join(", "));
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
