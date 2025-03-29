import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import ChatSidebar from "./ChatSidebar";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/StockAnalyst.css";

const StockAnalyst = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [stockName, setStockName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAddToWishlist = async () => {
    if (!stockName.trim()) return;
    
    try {
      const response = await axios.post("http://localhost:4000/api/addWishlist", {
        userName: currentUser.displayName || "Anonymous",
        email: currentUser.email,
        stock_name: stockName
      });
      console.log(response.data);
      alert("Stock added to wishlist successfully!");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("Failed to add stock to wishlist.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
  
    if (!inputValue.trim()) return;
  
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };
  
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);
  
    try {
      const response = await axios.post("http://localhost:5000/ask", {
        question: inputValue,
        email: currentUser.email,
        session_id: currentSessionId,
      });
      
      if (response.data.session_id && !currentSessionId) {
        setCurrentSessionId(response.data.session_id);
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: "bot",
        isMarkdown: true,
      };
  
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      
      if (stockName.trim()) {
        setTimeout(() => {
          const addToWishlist = window.confirm(`Do you want to add ${stockName} to your wishlist?`);
          if (addToWishlist) {
            handleAddToWishlist();
          }
        }, 500);
      }
  
    } catch (error) {
      console.error("Error fetching response:", error);
  
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, there was an error processing your request. Please try again later.",
        sender: "bot",
      };
  
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(""); 
    setMessages([]);
    setInputValue("");
    setStockName("");
  };

  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    
    try {
      const response = await axios.get("http://localhost:4000/api/stocksession/get_session_detail", {
        params: { 
          session_id: sessionId,
          email: currentUser.email 
        }
      });
      
      if (response.data && response.data.memory && response.data.memory.runs) {
        const sessionMessages = [];

        response.data.memory.runs.forEach(run => {
          sessionMessages.push({
            id: `user-${Date.now()}-${Math.random()}`,
            text: run.input || "",
            sender: "user",
          });

          sessionMessages.push({
            id: `bot-${Date.now()}-${Math.random()}`,
            text: run.response || "", 
            sender: "bot",
            isMarkdown: true,
          });
        });

        setMessages(sessionMessages);
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      setMessages([{
        id: Date.now(),
        text: "Failed to load the complete session. Please try again.",
        sender: "bot"
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigateToWishlist = () => {
    navigate("/wishlist-manager");
  };

  return (
    <div className={`stock-analyst-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {isSidebarOpen && (
        <ChatSidebar 
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          currentSessionId={currentSessionId}
        />
      )}
      
      <div className="stock-analyst-main">
        <div className="stock-analyst-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </button>
          <h2 className="stock-analyst-title">Stock Analyst</h2>
          <button 
            className="wishlist-manager-button"
            onClick={navigateToWishlist}
          >
            Manage Wishlist
          </button>
        </div>

        <div className="stock-analyst-container">
          <div className="stock-analyst-messages">
            {messages.length === 0 && (
              <div className="stock-analyst-empty">
                <p>
                  Ask me anything about stocks, market trends, or investment advice.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`stock-analyst-message ${
                  message.sender === "user"
                    ? "stock-analyst-message-user"
                    : "stock-analyst-message-bot"
                }`}
              >
                <div
                  className={`stock-analyst-message-bubble ${
                    message.isMarkdown ? "stock-analyst-markdown" : ""
                  }`}
                >
                  {message.isMarkdown ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div>{message.text}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="stock-analyst-message stock-analyst-message-bot">
                <div className="stock-analyst-message-bubble stock-analyst-loading">
                  <div className="stock-analyst-dot"></div>
                  <div className="stock-analyst-dot"></div>
                  <div className="stock-analyst-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="stock-analyst-form">
            <div className="stock-analyst-input-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about stocks..."
                className="stock-analyst-input"
                disabled={isLoading}
              />
              <input
                type="text"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                placeholder="Enter stock name (e.g., AAPL)"
                className="stock-analyst-input stock-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="stock-analyst-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="stock-analyst-spinner"></span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAnalyst;