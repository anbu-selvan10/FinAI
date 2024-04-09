import React, { useContext } from "react";
import { ExpenseContext } from "../contexts/ExpenseContext";

export const TransactionDetails = ({ transaction }) => {
  const { dispatch } = useContext(ExpenseContext);
  return (
    <li>
      <div>Category : {transaction.category}</div>{" "}
      <div>Amount: ₹{transaction.amount}</div>{" "}
      <button
        onClick={() =>
          dispatch({ type: "REMOVE_TRANSACTION", id: transaction.id })
        }
      >
        -
      </button>
    </li>
  );
};
