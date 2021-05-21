const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  trackingId: {
    type: String,
  },
  event: {
    type: String,
  },
  timestamp: {
    type: Date,
  },
});

module.exports = mongoose.model("User", UserSchema);
