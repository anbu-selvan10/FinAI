const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mysql = require("mysql");
const app = express();
const port = 4000;

mongoose
  .connect("//url", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  age: Number,
  aboutMe: String,
  phone: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "//pw",
  database: "finai",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database");
});

app.use(cors());
app.use(express.json());

app.get("/users", async (req, res) => {
  try {
    const email = req.query.email;
    const user = await User.findOne({ email });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { userName, name, age, aboutMe, phone, email } = req.body;

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = new User({
      userName,
      name,
      age,
      aboutMe,
      phone,
      email,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function insertExpenses(
  mysqlDateString,
  username,
  categories,
  parsedTransactions
) {
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
      console.log(`Category total inserted for category: ${category}`);
    }
  }
}

app.post("/expense_track", async (req, res) => {
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

  const user = await User.findOne({ email });

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
          return res.sendStatus(200);
        } catch (error) {
          console.error("Error inserting expenses:", error);
          return res
            .status(500)
            .send("An error occurred while inserting expenses.");
        }
      }
    }
  );
});

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
      console.log(`Category total inserted for category: ${category}`);
    }
  }
}

app.post("/budget_track", async (req, res) => {
  const { email, budget, currentMonthYear } = req.body;
  const parts = currentMonthYear.split(" ");
  const month = parts[0];
  const year = parseInt(parts[1]);
  const user = await User.findOne({ email });

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
          return res.sendStatus(200);
        } catch (error) {
          console.error("Error inserting budget:", error);
          return res
            .status(500)
            .send("An error occurred while inserting budget.");
        }
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
