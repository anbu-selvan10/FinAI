import React, { useContext, useState } from "react";
import { ExpenseContext } from "../contexts/ExpenseContext";

export const AddTransactions = () => {
  const { dispatch } = useContext(ExpenseContext);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "ADD_TRANSACTION", transaction: { category, amount } });
    setCategory("");
    setAmount(0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <button type="submit">Add</button>
    </form>
  );
};
