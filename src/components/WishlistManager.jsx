import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/WishlistManager.css";

const WishlistManager = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
      return;
    }

    fetchWishlist();
  }, [currentUser, navigate]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:4000/api/getWishlist/${currentUser.email}`);
      setWishlistItems(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setError("Failed to load your wishlist. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this stock from your wishlist?")) {
      try {
        await axios.delete(`http://localhost:4000/api/deleteWishlist/${id}`);
        setWishlistItems(wishlistItems.filter(item => item._id !== id));
      } catch (error) {
        console.error("Error deleting wishlist item:", error);
        alert("Failed to delete item. Please try again.");
      }
    }
  };

  const handleBackToAnalyst = () => {
    navigate("/stock-analyst");
  };

  if (isLoading) {
    return (
      <div className="wishlist-loading">
        <div className="wishlist-loading-spinner"></div>
        <p>Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-manager-container">
      <div className="wishlist-header">
        <h1>Your Stock Wishlist</h1>
        <button className="back-button" onClick={handleBackToAnalyst}>
          Back to Stock Analyst
        </button>
      </div>

      {error && <div className="wishlist-error">{error}</div>}

      {!error && wishlistItems.length === 0 && (
        <div className="wishlist-empty">
          <p>Your wishlist is empty. Add stocks from the Stock Analyst to see them here.</p>
          <button className="back-button" onClick={handleBackToAnalyst}>
            Add Stocks
          </button>
        </div>
      )}

      <div className="wishlist-grid">
        {wishlistItems.map((item) => (
          <div className="wishlist-card" key={item._id}>
            <div className="wishlist-card-content">
              <h3 className="stock-name">{item.stock_name}</h3>
              <p className="added-date">Added: {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="wishlist-card-actions">
              <button 
                className="delete-button" 
                onClick={() => handleDelete(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistManager;