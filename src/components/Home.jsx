import React, { useEffect, useState } from 'react';
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
  const [activeCard, setActiveCard] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoggedIn) {
      navigate('/login');
    }
  }, [userLoggedIn, navigate]);

  const cards = [
    {
      id: 'profile',
      title: 'PROFILE',
      image: profilepic,
      path: '/profile',
      description: 'View and manage your personal financial information. Track your progress and set your financial goals.'
    },
    {
      id: 'expense',
      title: 'EXPENSE TRACKER',
      image: expense,
      path: '/expense',
      description: 'Record your daily expenses across various categories. Get insights into your spending habits and identify areas for improvement.'
    },
    {
      id: 'budget',
      title: 'BUDGET TRACKER',
      image: budget,
      path: '/budget',
      description: 'Plan and manage your monthly budget effectively. Set spending limits for different categories and track your progress.'
    },
    {
      id: 'chatbot',
      title: 'RM BOT',
      image: chatbot,
      path: '/chatbot',
      description: 'Your personal financial assistant. Get answers to your financial questions and receive personalized advice.'
    },
    {
      id: 'stock',
      title: 'STOCK ANALYST',
      image: stock,
      path: '/stock-analyst',
      description: 'Analyze stock market trends and make informed investment decisions. Get real-time updates and expert recommendations.'
    },
    {
      id: 'store',
      title: 'RM STORE',
      image: store,
      path: '/RMStore',
      description: 'Use your earned RM Coins to claim products as rewards.'
    }
  ];

  return (
    <div className="finai-container">
      {/* Hero Section */}
      <section className="hero-section" style={{ transform: `translateY(${scrollPosition * 0.4}px)` }}>
        <div className="hero-content">
          <h1 className="finai-title">FinAI</h1>
          <p className="finai-tagline">Your Personalized Financial Assistant</p>
          <div className="hero-description">
            <p>"Record your daily expenses on various categories using our daily tracker!</p>
            <p>Plan your monthly budget accordingly and analyse your spendings!"</p>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="home-cards-section">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className={`home-card-container ${activeCard === card.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveCard(card.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="home-card-background" style={{ backgroundImage: `url(${card.image})` }}></div>
              <div className="home-card-content">
                <h2 className="home-card-title">{card.title}</h2>
                
                <div className="home-card-details" style={{ 
                  opacity: activeCard === card.id ? 1 : 0,
                  transform: activeCard === card.id ? 'translateY(0)' : 'translateY(20px)'
                }}>
                  <p className="home-card-description">{card.description}</p>
                  <Link to={card.path} className="home-card-button">
                    VIEW {card.title}
                  </Link>
                </div>
              </div>
          </div>
        ))}
</section>
    </div>
  );
};

export default HomePage;