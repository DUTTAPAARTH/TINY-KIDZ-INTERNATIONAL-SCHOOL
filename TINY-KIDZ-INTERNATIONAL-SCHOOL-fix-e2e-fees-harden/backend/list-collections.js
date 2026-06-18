const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("📊 MongoDB Atlas Collections:");
    console.log("================================\n");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments({});
      console.log(`${collection.name}: ${count} documents`);
    }

    console.log("\n================================");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
