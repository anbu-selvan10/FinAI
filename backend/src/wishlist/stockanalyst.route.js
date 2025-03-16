const express = require('express');
const router = express.Router();
const { 
    addToWishlist, 
    getWishlistByEmail, 
    deleteWishlistItem 
} = require('./stockanalyst.controller');

router.post("/addWishlist", addToWishlist);
router.get('/getWishlist/:email', getWishlistByEmail);
router.delete('/deleteWishlist/:id', deleteWishlistItem);

module.exports = router;