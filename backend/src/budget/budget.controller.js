const db = require("../db/sql_db");
const mongoose = require("../db/mongo_db");
const User = require("../users/users.model");

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
        const insertQuery = `INSERT INTO Budget (month, year, username, category, budget_amt_categorized) 
                             VALUES (?, ?, ?, ?, ?)`;
        const insertValues = [month, year, username, category, totalAmount];
        await db.query(insertQuery, insertValues);
        console.log(`Category Budget inserted for category: ${category}`);
      }
    }
  }

// Budget Tracking Handler
const trackBudget = async(req, res) => {
    const { email, budget, currentMonthYear } = req.body;
  const parts = currentMonthYear.split(" ");
  const month = parts[0];
  const year = parseInt(parts[1]);
  
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

    db.query(
      "SELECT * FROM Budget WHERE month = ? AND year = ? AND username = ?",
      [month, year, user.userName],
      async function (err, result) {
        if (err) {
          console.error("Error checking existing records:", err);
          return res
            .status(500)
            .send("An error occurred while checking existing records.");
        }

        if (result.length > 0) {
          return res
            .status(400)
            .send("You have already submitted budget for this month.");
        } else {
          try {
            await insertBudget(
              month,
              year,
              user.userName,
              categories,
              parsedBudget
            );

            // Increment the user's coins by 15 after submitting the budget
            user.coins = (user.coins || 0) + 15;
            await user.save();

            return res.status(200).json({ 
              message: "Budget for this month submitted successfully. You earned 15 coins!", 
              coins: user.coins 
            });
          } catch (error) {
            console.error("Error inserting budget:", error);
            return res
              .status(500)
              .send("An error occurred while inserting budget.");
          }
        }
      }
    );
  } catch (error) {
    console.error("Error in budget tracking:", error);
    return res.status(500).send("An error occurred while processing your request.");
  }
}
  
module.exports = {
    trackBudget
}