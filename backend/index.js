const express = require("express");
const cors = require("cors");
const mongoose = require("./src/db/mongo_db");
const db = require("./src/db/sql_db");
const app = express();
const port = 4000;
const expensesRoutes = require("./src/expenses/expenses.route");
const budgetRoutes = require("./src/budget/budget.route");
const userRoutes = require("./src/users/users.route");

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expensesRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api", userRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
