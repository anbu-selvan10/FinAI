import React, { useState } from "react";
import axios from "axios";
import BudgetList from "./budget/BudgetList";
import AddBudget from "./budget/AddBudget"; 
import BudgetContextProvider from "./contexts/BudgetContext";
import { useAuth } from "./contexts/AuthContext";
import "../styles/budget.css";

export const BudgetTracker = () => {
    const { currentUser } = useAuth();
    const [msg, setMsg] = useState("");
  
    const getCurrentDayName = () => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const currentDate = new Date();
      return days[currentDate.getDay()];
    };
  
    const getCurrentDate = () => {
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const year = currentDate.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const handleSubmit = async () => {
        const currentUserEmail = currentUser.email;
        const budget = localStorage.getItem(
          `budget_${currentUser.email}`
        );
        setMsg("");
      
        const lastSubmissionDate = localStorage.getItem(
          `last_submission_${currentUser.email}`
        );
      
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
        if (
          lastSubmissionDate &&
          new Date(lastSubmissionDate) > oneWeekAgo
        ) {
          setMsg("You can only submit expenses once a week. Please try again later.");
          return;
        }
      
        const confirmed = window.confirm(
          "Do you want to record the budget for this week?"
        );
      
        if (confirmed) {
          try {
            const currentDate = getCurrentDate();
            const response = await axios.post(
              "http://localhost:4000/budget",
              {
                email: currentUserEmail,
                budget: budget,
                currentDate: currentDate,
              }
            );
            if (response.status === 200) {
              localStorage.setItem(
                `last_submission_${currentUser.email}`,
                currentDate
              );
              setMsg(
                "Thank You! Budget submitted successfully. You can come again after a week!"
              );
            }
          } catch (error) {
            if (error.response && error.response.status === 400) {
              setMsg("You have already submitted budget for this week. Visit after a week!");
            } else {
              setMsg("An error occurred. Please try again later.");
            }
          }
        }
      };

    
  return (
     <BudgetContextProvider>
        
        <BudgetList/>
        <AddBudget/>
        <button
          onClick={() => {
            handleSubmit();
          }} className="buttonexp"
        >
          Submit
        </button>
        {msg && <div className="messagesubmitexp">{msg}</div>}
      </BudgetContextProvider>
    
  );
};


    