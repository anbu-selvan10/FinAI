import React, { useContext, useState } from "react";
import { ExpenseContext } from "../contexts/ExpenseContext";

export const AddTransactions = () => {
  const { dispatch } = useContext(ExpenseContext);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);

  const getCurrentTime = () => {
    const currentDate = new Date();
    let hours = currentDate.getHours();
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const amPM = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const time = `${hours}:${minutes} ${amPM}`;
    return time;
    
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentTime = getCurrentTime();
    dispatch({ type: "ADD_TRANSACTION", transaction: { category, amount, time: currentTime } });
    setCategory("");
    setAmount(0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      >
        <option value="">Select Category</option>
        <option value="Automotive">Automotive</option>
        <option value="Bills & Utilities">Bills & Utilities</option>
        <option value="Education">Education</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Food & Drink">Food & Drink</option>
        <option value="Petrol & Gas">Petrol & Gas</option>
        <option value="Gifts & Donations">Gifts & Donations</option>
        <option value="Groceries">Groceries</option>
        <option value="Health & Wellness">Health & Wellness</option>
        <option value="Home">Home</option>
        <option value="Personal">Personal</option>
        <option value="Professional Services">Professional Services</option>
        <option value="Shopping">Shopping</option>
        <option value="Travel">Travel</option>
        <option value="Miscellaneous">Miscellaneous</option>
      </select>
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
