import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../db.js";

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    // Insert user into Supabase
    const { error } = await supabase
      .from("users")
      .insert([{ username, password: hashedPassword }]);

    // Handle errors
    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Username already exists" });
      }
      return res.status(500).json({ error: "Something went wrong" });
    }

    // Success response
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Fetch user from Supabase (returns single object or null)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password")
      .eq("username", username)
      .maybeSingle();

    // Handle invalid username
    if (error || !user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    // Success response
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

export default router;
