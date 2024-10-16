const mysql = require("mysql");
const dotenv = require('dotenv');
dotenv.config();

const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
console.log(MYSQL_PASSWORD);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: MYSQL_PASSWORD,
  database: "finai",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database");
});

module.exports = db;