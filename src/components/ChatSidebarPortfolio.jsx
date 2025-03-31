import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./contexts/AuthContext";
import "../styles/StockAnalyst.css";

const ChatSidebarPortfolio = ({ onSelectSession, currentSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, [currentUser]);

  const fetchSessions = async () => {
    if (!currentUser || !currentUser.email) return;
    
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/api/portsession/sessions", {
        params: { email: currentUser.email }
      });
      
      console.log("Fetched sessions:", response.data);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching portfolio sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // Handle different date formats
    let date;
    if (typeof dateString === 'number') {
      // Unix timestamp in seconds
      date = new Date(dateString * 1000);
    } else if (typeof dateString === 'string') {
      // ISO string
      date = new Date(dateString);
    } else {
      // Default to current date if invalid
      date = new Date();
    }
    
    // Use a more reliable date formatting
    try {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid date";
    }
  };

  const extractStockSymbols = (session) => {
    if (session.memory && session.memory.runs && session.memory.runs.length > 0) {
      const input = session.memory.runs[0].input;
      if (input) {
        const match = input.match(/for\s+(.+)/i);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    
    if (session.question) {
      const match = session.question.match(/for:\s+(.+)/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return 'Portfolio Analysis';
  };
  
  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Portfolio History</h3>
      </div>
      
      <div className="sidebar-sessions">
        {loading ? (
          <div className="loading-sessions">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="no-sessions">No previous portfolio analyses found</div>
        ) : (
          sessions.map((session) => {
            const symbols = extractStockSymbols(session);
            
            const date = session.created_at ? formatDate(session.created_at) : "Unknown date";
            
            return (
              <div 
                key={session.session_id}
                className={`session-item ${session.session_id === currentSessionId ? 'active' : ''}`}
                onClick={() => onSelectSession(session.session_id, 
                  session.memory && session.memory.runs ? session.memory.runs : [])}
              >
                <div className="session-title">
                  {symbols}
                </div>
                <div className="session-date">{date}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebarPortfolio;