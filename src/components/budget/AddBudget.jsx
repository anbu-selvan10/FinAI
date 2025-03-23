import React, { useState, useContext } from "react";
import { BudgetContext } from "../contexts/BudgetContext";

const AddBudget = () => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const { addBudget } = useContext(BudgetContext);

  const defaultCategories = [
    "Automotive",
    "Bills & Utilities",
    "Education",
    "Entertainment",
    "Food & Drink",
    "Petrol & Gas",
    "Gifts & Donations",
    "Groceries",
    "Health & Wellness",
    "Home",
    "Personal",
    "Professional Services",
    "Rent",
    "Savings",
    "Shopping",
    "Travel",
    "Miscellaneous",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (category === "") {
      alert("Please select a category");
      return;
    }
    
    if (amount === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    // If "Other" is selected, use the custom category
    const finalCategory = category === "Other" ? customCategory : category;
    
    // Validate custom category
    if (category === "Other" && customCategory.trim() === "") {
      alert("Please enter a custom category");
      return;
    }
    
    // Add the budget
    addBudget(finalCategory, Number(amount));
    
    // Reset form
    setCategory("");
    setAmount("");
    setCustomCategory("");
  };

  return (
    <form className="add-budget-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          <option value="">Select Category</option>
          {defaultCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      
      {category === "Other" && (
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="custom-category-input"
          />
        </div>
      )}
      
      <div className="form-group">
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="amount-input"
        />
      </div>
      
      <button type="submit" className="add-budget-btn">
        Add Budget Item
      </button>
    </form>
  );
};

export default AddBudget;