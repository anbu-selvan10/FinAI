const db = require("../db/sql_db");
const mongoose = require("../db/mongo_db");
const User = require("../users/users.model");

// Insert Expenses Logic
const insertExpenses = async (mysqlDateString, username, categories, parsedTransactions) => {
  for (const category of categories) {
    const totalAmount = parsedTransactions.reduce((acc, transaction) => {
      if (transaction.category === category) {
        return acc + parseFloat(transaction.amount);
      }
      return acc;
    }, 0);

    if (totalAmount > 0) {
      const insertQuery = `INSERT INTO Expenses (date, username, category, expense_amt_categorized) 
                           VALUES (STR_TO_DATE(?, '%d-%m-%Y'), ?, ?, ?)`;
      const insertValues = [mysqlDateString, username, category, totalAmount];
      await db.query(insertQuery, insertValues);
      console.log(`Category Expenses inserted for category: ${category}`);
    }
  }
};

// Expense Tracking Handler
const trackExpenses = async (req, res) => {
  const { email, transactions, currentDate } = req.body;
  const parts = currentDate.split("/");
  const mysqlDateString = `${parts[0]}-${parts[1]}-${parts[2]}`;
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

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    let parsedTransactions;
    try {
      parsedTransactions = JSON.parse(transactions);
    } catch (error) {
      console.error("Error parsing transactions data:", error);
      return res.status(400).send("Invalid transactions data.");
    }

    db.query(
      "SELECT * FROM Expenses WHERE date = STR_TO_DATE(?, '%d-%m-%Y') AND username = ?",
      [mysqlDateString, user.userName],
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
            .send("You have already submitted expenses for today.");
        } else {
          try {
            await insertExpenses(
              mysqlDateString,
              user.userName,
              categories,
              parsedTransactions
            );

            user.coins = (user.coins || 0) + 2;
            await user.save();

            return res.status(200).json({
              message: "Expenses submitted successfully. You earned 2 coins!",
              coins: user.coins,
            });
          } catch (error) {
            console.error("Error inserting expenses:", error);
            return res
              .status(500)
              .send("An error occurred while inserting expenses.");
          }
        }
      }
    );
  } catch (error) {
    console.error("Error in expense tracking:", error);
    return res.status(500).send("An error occurred while processing your request.");
  }
};

module.exports = {
  trackExpenses,
};
