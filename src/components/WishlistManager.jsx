import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import "../styles/WishlistManager.css";

const WishlistManager = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioRecommendation, setPortfolioRecommendation] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

  const handlePortfolioRecommendations = async () => {
    const stockSymbols = wishlistItems.map(item => item.stock_name).join(',');
    
    if (stockSymbols.length === 0) {
      alert("Your wishlist is empty. Add stocks first to get recommendations.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/portfolio_ask', {
        email: currentUser.email,
        question: `Optimize portfolio for: ${stockSymbols}`
      });

      // Log the full response for debugging
      console.log("Full Portfolio Recommendation Response:", response.data);

      // Parse the nested JSON if it's a string
      const recommendationData = typeof response.data.response === 'string' 
        ? JSON.parse(response.data.response.match(/```json\n(.*)\n```/s)[1]) 
        : response.data.response;

      setPortfolioRecommendation({
        allocation: recommendationData.allocation,
        expected_returns: recommendationData.expected_returns,
        detailed_analysis: response.data.response
      });
    } catch (error) {
      console.error("Error getting portfolio recommendations:", error);
      alert("Failed to get portfolio recommendations. Please try again.");
    }
  };

  const handleBackToAnalyst = () => {
    navigate("/stock-analyst");
  };

  // Prepare data for Pie Chart
  const preparePieChartData = () => {
    if (!portfolioRecommendation?.allocation) return [];

    const total = Object.values(portfolioRecommendation.allocation).reduce((a, b) => a + b, 0);
    
    return Object.entries(portfolioRecommendation.allocation).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / total) * 100).toFixed(2)
    }));
  };

  // Colors for Pie Chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const extractDetailedAnalysis = () => {
    if (!portfolioRecommendation?.detailed_analysis) return null;

    // Regex to extract entire content from the first occurrence of "### Detailed Analysis"
    const analysisMatch = portfolioRecommendation.detailed_analysis.match(/(### Detailed Analysis[\s\S]*)/);
    
    if (!analysisMatch) return null;

    return analysisMatch[1].trim();
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
        <div className="wishlist-header-actions">
          <button className="back-button" onClick={handleBackToAnalyst}>
            Back to Stock Analyst
          </button>
          {wishlistItems.length > 0 && (
            <button 
              className="portfolio-recommendations-button" 
              onClick={handlePortfolioRecommendations}
            >
              Get Portfolio Recommendations
            </button>
          )}
        </div>
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

      {/* Portfolio Recommendation Visualization */}
      {portfolioRecommendation && portfolioRecommendation.allocation && (
        <div className="portfolio-recommendation-container">
          <h2>Portfolio Allocation</h2>
          
          {/* Pie Chart */}
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {preparePieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `$${value.toFixed(2)}`, 
                    `${props.payload.percentage}%`
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Analysis */}
          <div className="portfolio-detailed-analysis">
            <h3>Detailed Portfolio Analysis</h3>
            <div className="allocation-breakdown">
              {Object.entries(portfolioRecommendation.allocation).map(([stock, allocation]) => {
                const total = Object.values(portfolioRecommendation.allocation).reduce((a, b) => a + b, 0);
                const percentage = ((allocation / total) * 100).toFixed(2);
                
                return (
                  <div key={stock} className="stock-allocation">
                    <h4>{stock}</h4>
                    <p>Allocation: ${allocation.toFixed(2)} ({percentage}%)</p>
                    {portfolioRecommendation.expected_returns && (
                      <p>Expected Return: {(portfolioRecommendation.expected_returns[stock] * 100).toFixed(2)}%</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detailed Narrative Analysis */}
            {extractDetailedAnalysis() && (
                <div className="narrative-analysis">
                  <h4>Investment Strategy Insights</h4>
                  <ReactMarkdown 
                    components={{
                      h2: ({node, ...props}) => (
                        <h2 className="text-xl font-bold text-blue-700 mt-4 mb-2" {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className="text-lg font-semibold text-blue-600 mt-3 mb-1" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="list-disc list-inside pl-4 space-y-1" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="text-gray-700" {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="mb-2 text-gray-800" {...props} />
                      )
                    }}
                  >
                    {extractDetailedAnalysis()}
                  </ReactMarkdown>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistManager;