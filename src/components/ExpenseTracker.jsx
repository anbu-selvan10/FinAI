import React, { useState } from "react";
import axios from "axios";
import { TransactionList } from "./expenses/TransactionList";
import { AddTransactions } from "./expenses/AddTransactions";
import ExpenseContextProvider from "./contexts/ExpenseContext";
import { useAuth } from "./contexts/AuthContext";

export const ExpenseTracker = () => {
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
    const transactions = localStorage.getItem(
      `transactions_${currentUser.email}`
    );
    setMsg("");

    const confirmed = window.confirm(
      "Do you want to record the expenses for today?"
    );

    if (confirmed) {
      try {
        const currentDate = getCurrentDate();
        const response = await axios.post(
          "http://localhost:4000/expense_track",
          {
            email: currentUserEmail,
            transactions: transactions,
            currentDate: currentDate,
          }
        );
        if (response.status == 200) {
          setMsg(
            "Thank You! Expenses submitted successfully. You can come again tomorrow!"
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setMsg("You have already submitted expenses for today.");
        } else {
          setMsg("An error occurred. Please try again later.");
        }
      }
    }
  };

  return (
    <div>
      <ExpenseContextProvider>
        <h2>Expense Tracker</h2>
        <p>
          Today is {getCurrentDayName()}, {getCurrentDate()}
        </p>
        <p>
          You can click the submit button once a day. So, it is advised to click
          the submit button at the end of the day after you have recorded all
          the transactions
        </p>
        <TransactionList />
        <AddTransactions />
        <button
          onClick={() => {
            handleSubmit();
          }}
        >
          Submit
        </button>
        {msg && <div>{msg}</div>}
      </ExpenseContextProvider>
    </div>
  );
};
