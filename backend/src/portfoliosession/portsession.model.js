const mongoose = require("mongoose");

const runSchema = new mongoose.Schema({
  input: { type: String, required: true },
  response: { type: String, required: true }
});

const memorySchema = new mongoose.Schema({
  runs: { type: [runSchema], default: [] }
});

const sessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  memory: { type: memorySchema, default: {} },
  created_at: { type: Number, required: true },
  updated_at: { type: Number, required: true }
});

const portfolioSession = mongoose.model("portfolioSession", sessionSchema, "portfolio");

module.exports = portfolioSession;