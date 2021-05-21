const { config } = require("dotenv");
const mongoose = require("mongoose");
config();
const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database Connect Succssfully");
  } catch (err) {
    console.log("Database Cnnection Error: " + err.message);
  }
};

module.exports = dbConnect;
