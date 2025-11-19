// routes/premium.js
import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requirePremium.js"; // Consistent naming

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();


// User verifies premium key
router.post("/verifyPremium", requireAuth, async (req, res) => {
  const { key } = req.body;
  const userId = req.user.userId;

  if (!key) {
    return res.status(400).json({ message: "Missing premium key" });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, premium_key, is_premium 
       FROM users WHERE id = $1 AND premium_key = $2`,
      [userId, key]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid premium key" });
    }

    const user = result.rows[0];

    // Check if already premium
    if (user.is_premium) {
      return res.status(400).json({ message: "User is already premium" });
    }

    // Activate premium
    await pool.query("UPDATE users SET is_premium = true WHERE id = $1", [
      userId,
    ]);

    // Generate new premium token
    const premiumToken = jwt.sign(
      {
        userId: user.id,
        premium: true,
        email: user.email,
        jti: crypto.randomBytes(6).toString("hex"),
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Premium unlocked successfully",
      premiumToken,
      is_premium: true,
    });
  } catch (err) {
    console.error(" verifyPremium error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Check premium status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ isPremium: result.rows[0].is_premium });
  } catch (err) {
    console.error(" premium status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get salt for current user
router.get("/salt", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT salt FROM users WHERE id = $1", [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ salt: result.rows[0].salt });
  } catch (err) {
    console.error(" get salt error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Disable premium for current user
router.post("/disable", requireAuth, async (req, res) => {
  const { auth_proof } = req.body;
  const userId = req.user.userId;

  if (!auth_proof) {
    return res.status(400).json({ message: "Password verification required" });
  }

  try {
    // Get user's stored auth_hash (bcrypt) and premium status
    const userResult = await pool.query(
      "SELECT auth_hash, is_premium FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.is_premium) {
      return res.status(400).json({ message: "User is not premium" });
    }

    //  FIXED: Use bcrypt to compare the PBKDF2 proof with bcrypt hash
    const valid = await bcrypt.compare(auth_proof, user.auth_hash);
    if (!valid) {
      return res.status(403).json({ message: "Invalid password" });
    }

    // Disable premium
    await pool.query(
      "UPDATE users SET is_premium = false, premium_key = NULL WHERE id = $1",
      [userId]
    );

    res.json({
      message: "Premium access disabled successfully",
      is_premium: false,
    });
  } catch (err) {
    console.error(" disable premium error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
