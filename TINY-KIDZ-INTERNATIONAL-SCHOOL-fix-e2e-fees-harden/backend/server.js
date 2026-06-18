const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

dotenv.config({ path: path.join(__dirname, ".env") });

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
