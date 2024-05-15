import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { Link } from "react-router-dom";
import profilepic from "../img/profile.png";
import expense from "../img/expenses.png"; 
import budget from "../img/budget.jpg"; 

import "../../src/styles/home.css";

const HomePage = () => {
  const { userLoggedIn } = useAuth();
  return (
    <>
      {userLoggedIn ? (

      <div className="homebgmain">
      <div className="homebg2">
        <h2 className="finaihomedesc">
          <i>"Your Personalized Financial Assistant is here!
          <br></br>
          Record your daily expenses on various categories using our daily tracker!
          <br></br>
          Plan your monthly budget accordingly and analyse your spendings!"</i>
        </h2>
      </div>
       <div className="homebg1">
        <h1 className="finaitext">FinAI</h1>
        
       </div>
       <div className="homebg2">
        <div className="containerhome">
          <div className="item item-1">
              <Link
                to={"/profile"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h1 className="profiletext"> Profile </h1>
              </Link>

            <img src={profilepic} alt="Profile" className="item-img" />
          </div>
          <div className="item item-2">
               <Link
                to={"/expense"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h1 className="profiletext"> Expense Tracker </h1>
              </Link>
            <img src={expense} alt="Expense Tracker" className="item-img" />
          </div>
          <div className="item item-3">
              <Link
                to={"/budget"}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h1 className="profiletext"> Budget Tracker</h1>
              </Link>

            <img src={budget} alt="Budgeting" className="item-img" />
    
          </div>
        </div>
        </div>
        </div>
      
      ) : (
        <h3 className="loginfirsttext">
          Login first to access the homepage content
        </h3>
        
      )}
    </>
  );
};

export default HomePage;

