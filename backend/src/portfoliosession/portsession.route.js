const express = require('express');
const router = express.Router();
const { getUserPortfolioChat , getUserPortfolioSessions , checkSessionExists } = require('./portsession.controller');

router.get('/sessions', getUserPortfolioSessions);
router.get('/:session_id', getUserPortfolioChat);
router.get('/checkid/:id',checkSessionExists);
module.exports = router;