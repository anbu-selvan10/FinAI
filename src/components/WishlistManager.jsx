import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import "../styles/WishlistManager.css";
import ChatSidebar from "./ChatSidebarPortfolio";

const WishlistManager = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioRecommendation, setPortfolioRecommendation] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
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

  // Generate unique session ID
  const generateSessionId = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 10);
  };

  // Check if session ID exists
  const checkSessionIdExists = async (sessionId) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/portsession/checkid/${sessionId}`);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking session ID:", error);
      return false;
    }
  };

  // Generate unique session ID that doesn't exist yet
  const getUniqueSessionId = async () => {
    let sessionId = generateSessionId();
    let exists = await checkSessionIdExists(sessionId);
    
    while (exists) {
      sessionId = generateSessionId();
      exists = await checkSessionIdExists(sessionId);
    }
    
    return sessionId;
  };

  const parsePortfolioResponse = (responseData) => {
    try {
      setPortfolioRecommendation(null);
      
      let allocationData = {};
      let expectedReturnsData = {};
      let detailedAnalysis = '';
      let isTruncated = false;
      
      console.log("Parsing response data:", responseData);
      
      // Handle string responses (direct API responses)
      if (typeof responseData === 'string') {
        const jsonMatch = responseData.match(/```json\n([\s\S]*?)\n```/);
        
        if (jsonMatch && jsonMatch[1]) {
          const parsedJson = JSON.parse(jsonMatch[1]);
          allocationData = parsedJson.allocation || {};
          expectedReturnsData = parsedJson.expected_returns || {};
        }
        
        detailedAnalysis = responseData;
      } 
      // If it's already an object with allocation property
      else if (responseData && responseData.allocation) {
        allocationData = responseData.allocation;
        expectedReturnsData = responseData.expected_returns || {};
        detailedAnalysis = JSON.stringify(responseData, null, 2);
      }
      // Handle the session history format from MongoDB
      else if (responseData && responseData.memory && responseData.memory.runs && responseData.memory.runs.length > 0) {
        const runData = responseData.memory.runs[0];
        
        console.log("Run data from history:", runData);
        
        if (runData && runData.response) {
          // Check if the response contains JSON data
          const jsonMatch = runData.response.match(/```json\n([\s\S]*?)\n```/);
          
          if (jsonMatch && jsonMatch[1]) {
            try {
              const parsedJson = JSON.parse(jsonMatch[1]);
              allocationData = parsedJson.allocation || {};
              expectedReturnsData = parsedJson.expected_returns || {};
            } catch (jsonError) {
              console.error("Error parsing JSON in response:", jsonError);
            }
          }
          
          // Check if there's a JSON block without markdown formatting
          if (Object.keys(allocationData).length === 0) {
            const jsonBlockMatch = runData.response.match(/\{[\s\S]*"allocation"[\s\S]*\}/);
            if (jsonBlockMatch) {
              try {
                const parsedBlock = JSON.parse(jsonBlockMatch[0]);
                allocationData = parsedBlock.allocation || {};
                expectedReturnsData = parsedBlock.expected_returns || {};
              } catch (blockError) {
                console.error("Error parsing JSON block:", blockError);
              }
            }
          }
          
          // Extract manually if still no allocation data
          if (Object.keys(allocationData).length === 0) {
            // Parse for allocation data pattern like: "INFY.NS": 500, "ADANIENSOL.BO": 500
            const allocationPattern = /"([^"]+)":\s*(\d+(?:\.\d+)?)/g;
            let match;
            const extractedAllocation = {};
            
            while ((match = allocationPattern.exec(runData.response)) !== null) {
              const symbol = match[1];
              const amount = parseFloat(match[2]);
              if (!isNaN(amount)) {
                extractedAllocation[symbol] = amount;
              }
            }
            
            if (Object.keys(extractedAllocation).length > 0) {
              allocationData = extractedAllocation;
            }
          }
          
          detailedAnalysis = runData.response;
          
          // Check if response is truncated (we'll display a message but still try to show what we have)
          if (runData.response.endsWith('...') || runData.response.endsWith('…')) {
            console.log("Response appears to be truncated");
            isTruncated = true;
          }
        }
      }
      
      console.log("Extracted allocation data:", allocationData);
      console.log("Extracted expected returns:", expectedReturnsData);
      
      // If we still have no allocation data but we have the input showing stock symbols
      // create a basic allocation dividing investment equally
      if (Object.keys(allocationData).length === 0 && 
          responseData && responseData.memory && responseData.memory.runs && 
          responseData.memory.runs[0] && responseData.memory.runs[0].input) {
        
        const input = responseData.memory.runs[0].input;
        let stockSymbols = [];
        
        // Try to extract from "Portfolio optimization for X, Y, Z" format
        const optimizeMatch = input.match(/portfolio(?:\s+optimization)?\s+for\s+(.+)/i);
        if (optimizeMatch && optimizeMatch[1]) {
          stockSymbols = optimizeMatch[1].split(/,\s*/).filter(Boolean);
        }
        
        // If we found stock symbols, create basic allocation
        if (stockSymbols.length > 0) {
          const equalAmount = 1000 / stockSymbols.length; // Assuming $1000 total investment
          stockSymbols.forEach(symbol => {
            allocationData[symbol.trim()] = equalAmount;
          });
          
          console.log("Created basic allocation from input:", allocationData);
        }
      }
      
      return {
        allocation: allocationData,
        expected_returns: expectedReturnsData,
        detailed_analysis: detailedAnalysis,
        is_truncated: isTruncated
      };
    } catch (error) {
      console.error("Error parsing portfolio response:", error);
      return {
        allocation: {},
        expected_returns: {},
        detailed_analysis: "Error parsing portfolio data: " + error.message,
        is_truncated: false
      };
    }
  };


  const handlePortfolioRecommendations = async () => {
    const stockSymbols = wishlistItems.map(item => item.stock_name).join(',');
    
    if (stockSymbols.length === 0) {
      alert("Your wishlist is empty. Add stocks first to get recommendations.");
      return;
    }

    try {
      // Generate a unique session ID
      const sessionId = await getUniqueSessionId();
      setCurrentSessionId(sessionId);
      
      // Clear any previous recommendation
      setPortfolioRecommendation(null);
      
      const response = await axios.post('http://localhost:5000/portfolio_ask', {
        email: currentUser.email,
        question: `Optimize portfolio for: ${stockSymbols}`,
        session_id: sessionId
      });

      // Log the full response for debugging
      console.log("Full Portfolio Recommendation Response:", response.data);

      // Parse the response
      const recommendationData = parsePortfolioResponse(response.data.response);
      setPortfolioRecommendation(recommendationData);
      
    } catch (error) {
      console.error("Error getting portfolio recommendations:", error);
      alert("Failed to get portfolio recommendations. Please try again.");
    }
  };

  const handleSelectSession = async (sessionId, runs) => {
    // Clear current recommendation when selecting a new session
    setPortfolioRecommendation(null);
    setCurrentSessionId(sessionId);
    
    try {
      console.log("Session ID passed to API:", sessionId);
      const response = await axios.get(`http://localhost:4000/api/portsession/${String(sessionId)}`, {
        params: { email: currentUser.email } 
      });
      
      console.log("Session data received:", response.data);
      
      // Check if response.data contains the session
      if (response.data) {
        // Parse the session data
        const recommendationData = parsePortfolioResponse(response.data);
        
        // If we couldn't extract allocation data, try to handle it as plain text
        if (!recommendationData.allocation || Object.keys(recommendationData.allocation).length === 0) {
          console.log("No allocation data found, using runs directly if available");
          
          // If runs were passed in directly, use those
          if (runs && runs.length > 0) {
            const directRecommendationData = parsePortfolioResponse({
              memory: { runs }
            });
            setPortfolioRecommendation(directRecommendationData);
          } else {
            setPortfolioRecommendation(recommendationData);
          }
        } else {
          setPortfolioRecommendation(recommendationData);
        }
      } else {
        console.error("No data received from session API");
        setPortfolioRecommendation(null);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setPortfolioRecommendation(null);
    }
  };

  const handleBackToAnalyst = () => {
    navigate("/stock-analyst");
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const preparePieChartData = () => {
    if (!portfolioRecommendation?.allocation) return [];

    const total = Object.values(portfolioRecommendation.allocation).reduce((a, b) => a + b, 0);
    
    return Object.entries(portfolioRecommendation.allocation).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / total) * 100).toFixed(2)
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const extractDetailedAnalysis = () => {
    if (!portfolioRecommendation?.detailed_analysis) return null;

    // Extract content starting from "### Detailed Analysis" or similar headers
    const analysisMatch = portfolioRecommendation.detailed_analysis.match(/(#{1,3}\s*Detailed\s*Analysis[\s\S]*)/i);
    
    if (!analysisMatch) return portfolioRecommendation.detailed_analysis;

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
    <div className="wishlist-container">
      {showSidebar && (
        <ChatSidebar 
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
        />
      )}
      
      <div className={`wishlist-manager-container ${!showSidebar ? 'full-width' : ''}`}>
        <div className="wishlist-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1>Your Stock Wishlist</h1>
          <div className="wishlist-header-actions">
            <button className="back-button" onClick={handleBackToAnalyst}>
              Back to Stock Analyst
            </button>
            {wishlistItems.length > 0 && (
              <button 
                className="recommendation-button"
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
        {portfolioRecommendation && portfolioRecommendation.allocation && Object.keys(portfolioRecommendation.allocation).length > 0 && (
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

            {/* Allocation Breakdown */}
            <div className="allocation-breakdown">
              <h3>Portfolio Allocation Breakdown</h3>
              <div className="stock-allocations-grid">
                {Object.entries(portfolioRecommendation.allocation).map(([stock, allocation]) => {
                  const total = Object.values(portfolioRecommendation.allocation).reduce((a, b) => a + b, 0);
                  const percentage = ((allocation / total) * 100).toFixed(2);
                  const expectedReturn = portfolioRecommendation.expected_returns?.[stock] || 0;
                  
                  return (
                    <div key={stock} className="stock-allocation-card">
                      <h4>{stock}</h4>
                      <p className="allocation-amount">Allocation: ${allocation.toFixed(2)}</p>
                      <p className="allocation-percentage">Percentage: {percentage}%</p>
                      {expectedReturn > 0 && (
                        <p className="expected-return">Expected Return: {(expectedReturn * 100).toFixed(2)}%</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Narrative Analysis */}
            {extractDetailedAnalysis() && (
              <div className="narrative-analysis">
                <h3>Investment Strategy Insights</h3>
                <div className="analysis-content">
                  <ReactMarkdown 
                    components={{
                      h1: ({node, ...props}) => (
                        <h2 className="analysis-h1" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h3 className="analysis-h2" {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h4 className="analysis-h3" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="analysis-ul" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol className="analysis-ol" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="analysis-li" {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="analysis-p" {...props} />
                      ),
                      code: ({node, inline, ...props}) => (
                        inline 
                          ? <code className="analysis-inline-code" {...props} />
                          : <pre className="analysis-code-block"><code {...props} /></pre>
                      )
                    }}
                  >
                    {extractDetailedAnalysis()}
                  </ReactMarkdown>
                </div>
              </div>

              
            )}

            
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistManager;