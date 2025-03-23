import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, ResponsiveContainer } from "recharts";
import BudgetList from "./budget/BudgetList";
import AddBudget from "./budget/AddBudget";
import BudgetContextProvider from "./contexts/BudgetContext";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/budget.css";

export const BudgetTracker = () => {
  const { currentUser } = useAuth();
  const [msg, setMsg] = useState("");
  const [budgetItems, setBudgetItems] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  
    const loadBudgetData = () => {
      try {
        const storedBudget = localStorage.getItem(`budget_${currentUser.email}`);
        if (storedBudget) {
          const parsedBudget = JSON.parse(storedBudget);
          
          // Make sure all budget items are properly loaded
          console.log("Loaded budget items:", parsedBudget); // Debug log
          
          // Ensure we're setting the complete list
          setBudgetItems(parsedBudget);
          
          // Calculate total budget
          const total = parsedBudget.reduce((sum, item) => sum + Number(item.amount), 0);
          setTotalBudget(total);
        }
      } catch (error) {
        console.error("Error loading budget data:", error);
      }
    };
  
    loadBudgetData();
    
    window.addEventListener("budgetUpdated", loadBudgetData);
    
    return () => {
      window.removeEventListener("budgetUpdated", loadBudgetData);
    };
  }, [currentUser, navigate]);
  


  const getCurrentMonthYear = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentDate = new Date();
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${month} ${year}`;
  };

  const handleSubmit = async () => {
    const currentUserEmail = currentUser.email;
    const budget = localStorage.getItem(`budget_${currentUser.email}`);
    setMsg("");

    const confirmed = window.confirm(
      "Do you want to record the budget for this month?"
    );

    if (confirmed) {
      try {
        const currentMonthYear = getCurrentMonthYear();
        const response = await axios.post(
          "http://localhost:4000/api/budget/budget_track",
          {
            email: currentUserEmail,
            budget: budget,
            currentMonthYear: currentMonthYear,
          }
        );
        if (response.status === 200) {
          setMsg(
            "Thank You! Budget submitted successfully. 15 RM Coins will be credited. You can come again after a month!"
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setMsg(
            "You have already submitted budget for this month. Visit after a month!"
          );
        } else {
          setMsg("An error occurred. Please try again later.");
        }
      }
    }
  };

  // Prepare chart data
  const chartData = budgetItems.map((item) => ({
    name: item.category,
    value: Number(item.amount),
    fill: getRandomColor(item.category)
  }));

  // Generate consistent colors based on category name
  function getRandomColor(category) {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
      "#9966FF", "#FF9F40", "#8AC926", "#1982C4", 
      "#6A4C93", "#F94144", "#F3722C", "#F8961E"
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  return (
    <div className="budget-tracker-container">
      <BudgetContextProvider>
        <div className="budget-content">
          <div className="budget-form-section">
            <div className="budget-header">
              <h2>Budget Tracker</h2>
              <p className="budget-subtitle">Budget for {getCurrentMonthYear()}</p>
              <p className="budget-info">
                You can click the submit button once a month. Submit at the end of the day
                after planning your budget for this month.
              </p>
            </div>

            <div className="budget-total-display">
              <span>Total Budget:</span>
              <span className="budget-amount">₹{totalBudget}</span>
            </div>

            <div className="budget-form-container">
              <BudgetList />
              <AddBudget />
            </div>

            <button onClick={handleSubmit} className="budget-submit-btn">
              Submit Monthly Budget
            </button>
            
            {msg && <div className="budget-message">{msg}</div>}
          </div>

          <div className="budget-chart-section">
            <div className="chart-header">
              <h3>Budget Allocation</h3>
              <p>Visual representation of your budget distribution</p>
            </div>
            
            {budgetItems.length > 0 ? (
              <div className="chart-container">
                <PieChartComponent data={chartData} />
                <div className="chart-legend">
                  {chartData.map((entry, index) => (
                    <div className="legend-item" key={index}>
                      <div className="color-box" style={{ backgroundColor: entry.fill }}></div>
                      <div className="legend-text">
                        <span className="category-name">{entry.name}</span>
                        <span className="category-value">₹{entry.value} ({((entry.value / totalBudget) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart-message">
                <p>Add budget categories to see your allocation chart</p>
              </div>
            )}
          </div>
        </div>
      </BudgetContextProvider>
    </div>
  );
};


const PieChartComponent = ({ data }) => {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {

    if (percent < 0.03) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          dataKey="value"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default BudgetTracker;