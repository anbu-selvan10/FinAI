const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  age: Number,
  aboutMe: String,
  phone: String,
  email: String,
  coins: Number,
  lastExpenseSubmission: Date,
});

const User = mongoose.model("User", userSchema);

module.exports = User;