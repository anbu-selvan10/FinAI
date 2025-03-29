const express = require("express");
const router = express.Router();
const { getUserStockSessions, getUserStockChat } = require("./stocksession.controller");

router.get("/get_stock_sessions", getUserStockSessions);
router.get("/get_session_detail", getUserStockChat);

module.exports = router;