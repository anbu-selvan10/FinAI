const express = require('express');
const router = express.Router();
const { getMissingExpenseDates } = require('./notifi.controller');

router.get('/missing-expenses', getMissingExpenseDates);

module.exports = router;