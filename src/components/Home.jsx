import React, { useEffect } from 'react';
import { useAuth } from "./contexts/AuthContext";
import { Link } from "react-router-dom";
import profilepic from "../img/profile.png";
import expense from "../img/expenses.png";
import budget from "../img/budget.jpg";
import chatbot from "../img/chatbot.jpeg";
import store from "../img/store.png";
import stock from "../img/stock-analyst.png";
import { useNavigate } from 'react-router-dom';  

import "../../src/styles/home.css";

const HomePage = () => {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoggedIn) {
      navigate('/login');
    }
  }, [userLoggedIn, navigate]);

  const tools = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'View and manage your personal information and account settings.',
      image: profilepic, // Replace with profilepic when you have the actual import
      path: '/profile'
    },
    {
      id: 'expense',
      title: 'Expense Tracker',
      description: 'Track and categorize your spending with detailed visual reports.',
      image: expense, // Replace with expense when you have the actual import
      path: '/expense'
    },
    {
      id: 'budget',
      title: 'Budget Tracker',
      description: 'Set financial goals and create detailed budgets to stay on target.',
      image: budget, // Replace with budget when you have the actual import
      path: '/budget'
    },
    {
      id: 'rmbot',
      title: 'RM Bot',
      description: 'Get personalized financial advice and answers to your money questions.',
      image: chatbot, // Replace with chatbot when you have the actual import
      path: '/chatbot'
    },
    {
      id: 'stock',
      title: 'Stock Analyst',
      description: 'Analyze market trends and get insights on potential investments.',
      image: stock, // Replace with stock when you have the actual import
      path: '/stock-analyst'
    },
    {
      id: 'store',
      title: 'RM Store',
      description: 'Shop for premium features and tools to enhance your financial journey.',
      image: store, // Replace with store when you have the actual import
      path: '/RMStore'
    }
  ];


  return (
    <>
      <div className="homebgmain">
          <div className="homebg2">
            <h2 className="finaihomedesc">
              <i>
                "Your Personalized Financial Assistant is here!
                <br></br>
                Record your daily expenses on various categories using our daily
                tracker!
                <br></br>
                Plan your monthly budget accordingly and analyse your
                spendings!"
              </i>
            </h2>
          </div>
          <div className="homebg1">
            <h1 className="finaitext">FinAI</h1>
          </div>
          <div className="homebg2">
            <div className="containerhome">
            <div className="tools-container">
      {tools.map((tool, index) => (
        <div 
          className={`tool-card ${index % 2 === 0 ? 'image-left' : 'image-right'}`} 
          key={tool.id}
        >
          <div className="tool-content-wrapper">
            <div className="tool-image-container">
              {/* Replace with your actual image component */}
              <img 
                src={tool.image} 
                alt={tool.title} 
                className="tool-img" 
              />
            </div>
            <div className="tool-text-container">
              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-description">{tool.description}</p>
              <Link to={tool.path} className="tool-link">
                VIEW {tool.title} <span className="arrow">›</span>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default HomePage;
