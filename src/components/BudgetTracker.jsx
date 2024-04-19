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

  const getCurrentMonthYear = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${month} ${year}`;
  };

  const handleSubmit = async () => {
    const currentUserEmail = currentUser.email;
    const budget = localStorage.getItem(`budget_${currentUser.email}`);
    setMsg("");

    const confirmed = window.confirm(
      "Do you want to record the budget for this month?"
    );

    if (confirmed) {
      try {
        const currentMonthYear = getCurrentMonthYear();
        const response = await axios.post(
          "http://localhost:4000/budget_track",
          {
            email: currentUserEmail,
            budget: budget,
            currentMonthYear: currentMonthYear,
          }
        );
        if (response.status === 200) {
          setMsg(
            "Thank You! Budget submitted successfully. You can come again after a month!"
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setMsg(
            "You have already submitted budget for this month. Visit after a month!"
          );
        } else {
          setMsg("An error occurred. Please try again later.");
        }
      }
    }
  };

  return (
    <BudgetContextProvider>
      <p>Budget for {getCurrentMonthYear()}</p>
      <BudgetList />
      <AddBudget />
      <button
        onClick={() => {
          handleSubmit();
        }}
        className="buttonexp"
      >
        Submit
      </button>
      {msg && <div className="messagesubmitexp">{msg}</div>}
    </BudgetContextProvider>
  );
};
