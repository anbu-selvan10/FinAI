const express = require("express");
const router = express.Router();
const { trackExpenses } = require("./expenses.controller");

router.post("/expense_track", trackExpenses);

module.exports = router;