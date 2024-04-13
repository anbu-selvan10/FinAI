import React, { useContext } from "react";
import { BudgetContext } from "../contexts/BudgetContext";
import "../../styles/budget.css";

const BudgetDetails = ({ budget }) => {
  const { dispatch } = useContext(BudgetContext);
  return (
    <li className="translist">
      <div className="detailstrans">{budget.category}</div>{" "}
      <div className="detailstrans"> ₹{budget.amount}</div>{" "}
      <div className="detailstrans">{budget.time}</div>{" "}
      <button className="transremove"
        onClick={() =>
          dispatch({ type: "REMOVE_BUDGET", id: budget.id})
        }
      >
        -
      </button>
    </li>
  );
};

export default BudgetDetails;