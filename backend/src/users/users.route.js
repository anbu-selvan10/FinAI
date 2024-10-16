const express = require('express');
const User = require('./users.model');
const { getUsers, postUsers } = require('./users.controller');
const router = express.Router();

router.post("/users", postUsers);
router.get("/users", getUsers);

module.exports = router;