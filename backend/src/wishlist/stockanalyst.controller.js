const Wishlist = require("./stockanalyst.model");

const addToWishlist = async (req, res) => {
  try {
    const { userName, email, stock_name } = req.body;
    
    if (!email || !stock_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newWishlistItem = new Wishlist({
      userName,
      email,
      stock_name
      // createdAt will be automatically set to the current date/time
    });
    
    const result = await newWishlistItem.save();
    
    if (result) {
      return res.status(200).json({ 
        success: true, 
        message: 'Stock added to wishlist',
        data: result
      });
    } else {
      return res.status(500).json({ error: 'Failed to add to wishlist' });
    }
    
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to wishlist',
      error: error.message
    });
  }
};

const getWishlistByEmail = async (req, res) => {
    try {
      const email = req.params.email;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const wishlistItems = await Wishlist.find({ email }).sort({ createdAt: -1 });
      
      res.status(200).json(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching wishlist',
        error: error.message
      });
    }
  };

const deleteWishlistItem = async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }
      
      const result = await Wishlist.findByIdAndDelete(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Wishlist item not found' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Wishlist item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting wishlist item',
        error: error.message
      });
    }
};

module.exports = {
    addToWishlist,
    getWishlistByEmail,
    deleteWishlistItem
};
