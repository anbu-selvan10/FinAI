import React, { useContext } from "react";
import { BudgetContext } from "../contexts/BudgetContext";
import BudgetDetails from "./BudgetDetails";

const BudgetList = () => {
  const { budget } = useContext(BudgetContext);
  const amounts = budget.map((budget) => parseInt(budget.amount));
  const total = amounts.reduce((acc, item) => (acc += item), 0);

  return (
    <>
      <h3>Net Amount: {total}</h3>
      <h4>Your Budget</h4>
      {budget.length ? (
        <div>
          <ul>
            {budget.map((bg) => {
              return <BudgetDetails budget={bg} key={bg.id}></BudgetDetails>;
            })}
          </ul>
        </div>
      ) : (
        <p>No transactions</p>
      )}
    </>
  );
};

export default BudgetList;
