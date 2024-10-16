const User = require("./users.model");
const mongoose = require("../db/mongo_db");

const getUsers = async(req, res) => {
    try {
        const email = req.query.email;
        const user = await User.findOne({ email });
        if (user) {
          user.coins = user.coins || 10;
          await user.save(); 
        }
        res.json(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ error: "Internal server error" });
      }
}

const postUsers = async(req, res) => {
    try {
        const { userName, name, age, aboutMe, phone, email, coins } = req.body;
    
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
          coins: coins || 10, 
        });
    
        await newUser.save();
    
        res.status(201).json({ message: "User created successfully" });
      } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: "Internal server error" });
      }
}

module.exports = {
    getUsers,
    postUsers
}