const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const mongoose = require("../db/mongo_db");
const User = require("../users/users.model");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Insert Budget Logic
async function insertBudget(month, year, username, categories, parsedBudget) {
  for (const category of categories) {
    const totalAmount = parsedBudget.reduce((acc, transaction) => {
      if (transaction.category === category) {
        return acc + parseFloat(transaction.amount);
      }
      return acc;
    }, 0);

    if (totalAmount > 0) {
      const { error } = await supabase
        .from("budget")
        .insert([
          {
            month: month,
            year: year,
            username: username,
            category: category,
            budget_amt_categorized: totalAmount,
          },
        ]);

      if (error) {
        console.error("Error inserting budget:", error);
        throw error;
      }

      console.log(`Category Budget inserted for category: ${category}`);
    }
  }
}

// Budget Tracking Handler
const trackBudget = async (req, res) => {
  const { email, budget, currentMonthYear } = req.body;
  const parts = currentMonthYear.split(" ");
  const month = parts[0]; // Example: "February"
  const year = parseInt(parts[1]); // Example: 2025

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const categories = [
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
      "Shopping",
      "Travel",
      "Miscellaneous",
    ];

    let parsedBudget;
    try {
      parsedBudget = JSON.parse(budget);
    } catch (error) {
      console.error("Error parsing budget data:", error);
      return res.status(400).send("Invalid budget data.");
    }

    // Check if budget already exists for this month
    const { data: existingBudget, error } = await supabase
      .from("budget")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .eq("username", user.userName);

    if (error) {
      console.error("Error checking existing records:", error);
      return res
        .status(500)
        .send("An error occurred while checking existing records.");
    }

    if (existingBudget.length > 0) {
      return res
        .status(400)
        .send("You have already submitted budget for this month.");
    } else {
      try {
        await insertBudget(month, year, user.userName, categories, parsedBudget);

        // Increment user's coins by 15 after submitting the budget
        user.coins = (user.coins || 0) + 15;
        await user.save();

        return res.status(200).json({
          message: "Budget for this month submitted successfully. You earned 15 coins!",
          coins: user.coins,
        });
      } catch (error) {
        console.error("Error inserting budget:", error);
        return res
          .status(500)
          .send("An error occurred while inserting budget.");
      }
    }
  } catch (error) {
    console.error("Error in budget tracking:", error);
    return res.status(500).send("An error occurred while processing your request.");
  }
};

module.exports = {
  trackBudget,
};
