import React, { createContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import v4 from "uuid-random";

export const BudgetContext = createContext();

const budgetReducer = (state, action) => {
  switch (action.type) {
    case "ADD_BUDGET":
      return [
        ...state,
        {
          category: action.budget.category,
          amount: action.budget.amount,
          id: v4(),
        },
      ];
    case "REMOVE_BUDGET":
      return state.filter((bg) => bg.id !== action.id);
    default:
      return state;
  }
};

const BudgetContextProvider = (props) => {
  const { currentUser } = useAuth();

  const [budget, dispatch] = useReducer(budgetReducer, [], () => {
    const data1 = localStorage.getItem(`budget_${currentUser.email}`);
    return data1 ? JSON.parse(data1) : [];
  });

  useEffect(() => {
    localStorage.setItem(`budget_${currentUser.email}`, JSON.stringify(budget));
  }, [budget]);

  return (
    <BudgetContext.Provider value={{ budget, dispatch }}>
      {props.children}
    </BudgetContext.Provider>
  );
};

export default BudgetContextProvider;
