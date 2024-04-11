import React, { useContext } from "react";
import { ExpenseContext } from "../contexts/ExpenseContext";
import "../../styles/expenses.css";

export const TransactionDetails = ({ transaction }) => {
  const { dispatch } = useContext(ExpenseContext);
  return (
    <li className="translist">
      <div className="detailstrans">{transaction.category}</div>{" "}
      <div className="detailstrans"> ₹{transaction.amount}</div>{" "}
      <div className="detailstrans">{transaction.time}</div>{" "}
      <button className="transremove"
        onClick={() =>
          dispatch({ type: "REMOVE_TRANSACTION", id: transaction.id })
        }
      >
        -
      </button>
    </li>
  );
};
