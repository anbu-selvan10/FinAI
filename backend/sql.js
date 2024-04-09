//demo js file to test whether express is connected to sql database

const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 4000;

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '//password',
  database: 'employee'
});


db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

app.post('/data', (req, res) => {
    const { name, id } = req.body;
  
    const sql = 'INSERT INTO Info (name, id) VALUES (?, ?)';
    
    db.query(sql, [name, id], (err, result) => {
      if (err) {
        console.error('Error inserting data: ' + err.message);
        return res.status(500).send('Error inserting data');
      }
      console.log('Data inserted');
      res.send('Data inserted successfully');
    });
  });


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
