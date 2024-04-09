import React, { useContext } from "react";
import { ExpenseContext } from "../contexts/ExpenseContext";
import { TransactionDetails } from "./TransactionDetails";

export const TransactionList = () => {
  const { transactions } = useContext(ExpenseContext);
  const amounts = transactions.map((transaction) =>
    parseInt(transaction.amount)
  );
  const total = amounts.reduce((acc, item) => (acc += item), 0);

  return (
    <>
      <h3>Net Amount: {total}</h3>
      <h4>Transaction History</h4>
      {transactions.length ? (
        <div>
          <ul>
            {transactions.map((tr) => {
              return (
                <TransactionDetails
                  transaction={tr}
                  key={tr.id}
                ></TransactionDetails>
              );
            })}
          </ul>
        </div>
      ) : (
        <p>No transactions</p>
      )}
    </>
  );
};
