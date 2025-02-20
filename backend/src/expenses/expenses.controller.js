const db = require("../db/sql_db");
const mongoose = require("../db/mongo_db");
const User = require("../users/users.model");

// Insert Expenses Logic
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD
const formatDateToISO = (dateStr) => {
  const parts = dateStr.split("-"); // Splitting DD-MM-YYYY
  return `${parts[2]}-${parts[1]}-${parts[0]}`; // Rearranging as YYYY-MM-DD
};

// Function to generate the primary key ID
const generatePrimaryKey = (date, username, category) => {
  // Extract the day part (DD) from the ISO date (YYYY-MM-DD)
  const dateParts = date.split('-');
  const year = dateParts[0].substring(2); // Get last 2 digits of year
  const month = dateParts[1];             // Month (MM)
  const day = dateParts[2];               // Day (DD)
  
  // Format as DDMMYY
  const datePart = `${day}${month}${year}`;
  
  // Keep username as is
  const userPart = username;
  
  // Take first 3 chars of category
  const catPart = category.substring(0, 3).toUpperCase();
  
  // Combine in the required format
  return `${userPart}${catPart}${datePart}`;
};

const insertExpenses = async (isoDate, username, categories, parsedTransactions) => {
  for (const category of categories) {
    const totalAmount = parsedTransactions.reduce((acc, transaction) => {
      if (transaction.category === category) {
        return acc + parseFloat(transaction.amount);
      }
      return acc;
    }, 0);

    if (totalAmount > 0) {
      // Generate the primary key ID
      const id = generatePrimaryKey(isoDate, username, category);
      
      const { error } = await supabase
        .from("expenses")
        .insert([
          {
            id: id, // Add the primary key
            date: isoDate,
            username: username,
            category: category,
            expense_amt_categorized: totalAmount,
          },
        ]);

      if (error) {
        console.error("Error inserting expenses:", error);
        throw error;
      }

      console.log(`Category Expenses inserted for category: ${category}, ID: ${id}`);
    }
  }
};
// Expense Tracking Handler
const trackExpenses = async (req, res) => {
  const { email, transactions, currentDate } = req.body;
  const parts = currentDate.split("/"); // Assuming input is DD/MM/YYYY
  const mysqlDateString = `${parts[0]}-${parts[1]}-${parts[2]}`; // Convert to DD-MM-YYYY
  const isoDate = formatDateToISO(mysqlDateString); // Convert to YYYY-MM-DD

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

    // Check if expenses already exist for this date
    const { data: existingExpenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("date", isoDate) // Use formatted date
      .eq("username", user.userName);

    if (error) {
      console.error("Error checking existing records:", error);
      return res
        .status(500)
        .send("An error occurred while checking existing records.");
    }

    if (existingExpenses.length > 0) {
      return res
        .status(400)
        .send("You have already submitted expenses for today.");
    } else {
      try {
        await insertExpenses(isoDate, user.userName, categories, parsedTransactions);

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
  } catch (error) {
    console.error("Error in expense tracking:", error);
    return res.status(500).send("An error occurred while processing your request.");
  }
};

module.exports = {
  trackExpenses,
};
