import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/chatbot.css";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { currentUser } = useAuth();
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoggedIn) {
      navigate("/login");
    }
  }, [userLoggedIn, navigate]);

  const handleSend = async () => {
    if (!input) return;

    setMessages([...messages, { sender: "user", text: input }]);

    try {
      const email = currentUser.email;
      const response = await axios.post(
        `http://localhost:5000/get_response`,
        {
          question: input,
          email: email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const botResponse = response.data.response;
      const formattedResponse = botResponse
        .replace(/\n\n/g, "<br>")
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/###(.*?)(?=<br>|$)/g, "<h3>$1</h3>");

      setMessages([
        ...messages,
        { sender: "user", text: input },
        { sender: "bot", text: formattedResponse },
      ]);
    } catch (error) {
      console.error("Error in chatbot API call", error);
      setMessages([
        ...messages,
        { sender: "user", text: input },
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <h1 className="chatbottitle">Welcome to RM Chatbot</h1>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {/* Render HTML for bot messages using dangerouslySetInnerHTML */}
            {msg.sender === "bot" ? (
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            ) : (
              msg.text
            )}
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
        />
        <button className="send-button" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
