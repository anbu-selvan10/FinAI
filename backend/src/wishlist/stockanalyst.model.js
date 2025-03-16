const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  stock_name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;