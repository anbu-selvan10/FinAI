import React, { useState } from 'react';
import axios from 'axios';
import '../styles/chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState(''); 

  const handleSend = async () => {
    if (!input) return;

    setMessages([...messages, { sender: 'user', text: input }]);

    try {
      const response = await axios.post('http://localhost:5000/get_response', 
      {
        question: input
      }, 
      {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const botResponse = response.data.response;
      setMessages([...messages, { sender: 'user', text: input }, { sender: 'bot', text: botResponse }]);
      
    } catch (error) {
      console.error("Error in chatbot API call", error);
      setMessages([...messages, { sender: 'user', text: input }, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className='chatbot-container'>
      <h1 className='chatbottitle'>Welcome to RM Chatbot</h1>
      
      <div className='chat-window'>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      
      <div className='input-container'>
        <input 
          type='text' 
          className='chat-input' 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder='Type a message' 
        />
        <button className='send-button' onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default Chatbot;