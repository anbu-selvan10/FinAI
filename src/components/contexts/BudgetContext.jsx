import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export const BudgetContext = createContext();

const BudgetContextProvider = (props) => {
  const [budgets, setBudgets] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const storedBudget = localStorage.getItem(`budget_${currentUser.email}`);
      if (storedBudget) {
        setBudgets(JSON.parse(storedBudget));
      }
    }
  }, [currentUser]);

  const saveBudgetToLocal = (newBudgets) => {
    if (currentUser) {
      localStorage.setItem(
        `budget_${currentUser.email}`,
        JSON.stringify(newBudgets)
      );
      
      // Dispatch custom event for budget updates
      const event = new Event("budgetUpdated");
      window.dispatchEvent(event);
    }
  };

  const addBudget = (category, amount) => {
    // Generate a unique ID for the new budget item
    const id = Math.random().toString(36).substr(2, 9);
    const newBudget = { id, category, amount };
    const newBudgets = [...budgets, newBudget];
    setBudgets(newBudgets);
    saveBudgetToLocal(newBudgets);
  };

  const removeBudget = (id) => {
    const newBudgets = budgets.filter((budget) => budget.id !== id);
    setBudgets(newBudgets);
    saveBudgetToLocal(newBudgets);
  };

  const updateBudget = (id, updatedBudget) => {
    const newBudgets = budgets.map((budget) => 
      budget.id === id ? updatedBudget : budget
    );
    setBudgets(newBudgets);
    saveBudgetToLocal(newBudgets);
  };

  return (
    <BudgetContext.Provider
      value={{ budgets, addBudget, removeBudget, updateBudget }}
    >
      {props.children}
    </BudgetContext.Provider>
  );
};

export default BudgetContextProvider;