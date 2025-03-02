import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "../../src/styles/StockAnalyst.css";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const StockAnalyst = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      // Send request to API
      const response = await axios.post("http://localhost:5000/ask", {
        question: inputValue,
      });

      // Add response to chat
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: "bot",
        isMarkdown: true,
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);

      // Add error message to chat
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

  return (
    <div className="stock-analyst-container">
      <div className="stock-analyst-header">
        <h2 className="stock-analyst-title">Stock Analyst</h2>
        <p className="stock-analyst-subtitle">
          Ask questions about stocks and markets
        </p>
      </div>

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
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                message.text
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
  );
};

export default StockAnalyst;
