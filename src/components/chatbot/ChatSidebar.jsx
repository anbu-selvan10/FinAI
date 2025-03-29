import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const ChatSidebar = ({ onSelectSession, onNewChat, currentSessionId }) => {
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
      const response = await axios.get("http://localhost:4000/api/stocksession/get_stock_sessions", {
        params: { email: currentUser.email }
      });
      
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };
  

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Stock Analyst Chats</h3>
        <button 
          className="new-chat-button" 
          onClick={onNewChat}
          title="New Chat"
        >
          <span>+</span>
        </button>
      </div>
      
      <div className="sidebar-sessions">
        {loading ? (
          <div className="loading-sessions">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="no-sessions">No previous sessions found</div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.session_id}
              className={`session-item ${session.session_id === currentSessionId ? 'active' : ''}`}
              onClick={() => onSelectSession(session.session_id, session.runs)}
            >
              <div className="session-title">
                {session.runs && session.runs.length > 0 
                    ? session.runs[0].input 
                    : 'Empty session'}
                </div>

              <div className="session-date">{formatDate(session.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;