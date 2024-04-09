const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
