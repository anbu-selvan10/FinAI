const express = require("express");
const router = express.Router();
const { trackBudget } = require("./budget.controller");

router.post("/budget_track", trackBudget);

module.exports = router;