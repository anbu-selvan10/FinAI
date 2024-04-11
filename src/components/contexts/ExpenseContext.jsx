import React, { createContext, useReducer, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import v4 from "uuid-random";

export const ExpenseContext = createContext();

const expenseReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return [
        ...state,
        {
          category: action.transaction.category,
          amount: action.transaction.amount,
          time: action.transaction.time,
          id: v4(),
        },
      ];
    case "REMOVE_TRANSACTION":
      return state.filter((tr) => tr.id !== action.id);
    default:
      return state;
  }
};

const ExpenseContextProvider = (props) => {
  const { currentUser } = useAuth();

  const [transactions, dispatch] = useReducer(expenseReducer, [], () => {
    const data = localStorage.getItem(`transactions_${currentUser.email}`);
    return data ? JSON.parse(data) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      `transactions_${currentUser.email}`,
      JSON.stringify(transactions)
    );
  }, [transactions]);

  return (
    <ExpenseContext.Provider value={{ transactions, dispatch }}>
      {props.children}
    </ExpenseContext.Provider>
  );
};

export default ExpenseContextProvider;
