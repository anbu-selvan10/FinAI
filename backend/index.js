const express = require("express");
const cors = require("cors");
const mongoose = require("./src/db/mongo_db");
const db = require("./src/db/sql_db");
const app = express();
const port = 4000;
const expensesRoutes = require("./src/expenses/expenses.route");
const budgetRoutes = require("./src/budget/budget.route");
const userRoutes = require("./src/users/users.route");
const stockRoutes = require("./src/wishlist/stockanalyst.route");
const stockSessionRoutes = require("./src/stocksession/stocksession.route");
const PortSessionRoutes = require("./src/portfoliosession/portsession.route");
const notifications = require("./src/notifications/notifi.route");

app.use(cors());
app.use(express.json());

app.use("/api/expenses", expensesRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api", userRoutes);
app.use("/api", stockRoutes);
app.use("/api/stocksession",stockSessionRoutes);
app.use("/api/portsession",PortSessionRoutes);
app.use("/api/notification",notifications);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
