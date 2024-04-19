import React, { useContext, useState } from "react";
import { BudgetContext } from "../contexts/BudgetContext";

export const AddBudget = () => {
  const { dispatch } = useContext(BudgetContext);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "ADD_BUDGET", budget: { category, amount } });
    setCategory("");
    setAmount(0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
        className="inpboxexp"
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
        className="inpboxexp"
      />
      <button type="submit" onSubmit={handleSubmit} className="submitexp">
        Add
      </button>
    </form>
  );
};

export default AddBudget;
