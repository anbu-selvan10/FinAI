import React, { useContext } from "react";
import { BudgetContext } from "../contexts/BudgetContext";

const BudgetList = () => {
  const { budgets, removeBudget } = useContext(BudgetContext);

  return (
    <div className="budget-list">
      <h3>Your Budget Allocations</h3>
      {budgets.length === 0 ? (
        <p className="empty-budget-message">No budget items added yet. Add your first category below.</p>
      ) : (
        budgets.map((budget) => (
          <div className="budget-item" key={budget.id}>
            <span className="budget-category">{budget.category}</span>
            <div className="budget-item-actions">
              <span className="budget-item-amount">₹{budget.amount}</span>
              <button 
                className="remove-budget-btn"
                onClick={() => removeBudget(budget.id)}
                aria-label="Remove budget item"
              >
                ×
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default BudgetList;