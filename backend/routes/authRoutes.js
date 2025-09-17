import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

// Register
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hashedPassword);
    res.json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(400).json({ error: "Invalid email or password" });

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign({ id: user.id }, "your_jwt_secret", { expiresIn: "1h" });
  res.json({ token });
});

export default router;
