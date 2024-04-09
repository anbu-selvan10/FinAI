import React from "react";
import { TransactionList } from "./expenses/TransactionList";
import { AddTransactions } from "./expenses/AddTransactions";
import ExpenseContextProvider from "./contexts/ExpenseContext";

export const ExpenseTracker = () => {
  return (
    <div>
      <ExpenseContextProvider>
        <h2>Expense Tracker</h2>
        <TransactionList />
        <AddTransactions />
      </ExpenseContextProvider>
    </div>
  );
};
