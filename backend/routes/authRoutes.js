import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/register", (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
    res.json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return res.status(400).json({ error: "Invalid username or password" });

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ error: "Invalid username or password" });

  const token = jwt.sign({ id: user.id }, "your_jwt_secret", { expiresIn: "1h" });
  res.json({ token });
});

export default router;
