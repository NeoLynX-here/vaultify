import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Middleware to verify admin JWT
function verifyAdmin(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Missing token" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") throw new Error();
    req.admin = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign(
      { role: "admin", username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.json({ token });
  }
  res.status(401).json({ error: "Unauthorized" });
});

// GET /api/admin/users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, is_premium, premium_key, twofa_enabled FROM users ORDER BY id"
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PATCH /api/admin/users/:id/premium
router.patch("/users/:id/premium", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_premium } = req.body;

  try {
    await pool.query("UPDATE users SET is_premium = $1 WHERE id = $2", [
      is_premium,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// NEW: PATCH /api/admin/users/:id/premium-key
router.patch("/users/:id/premium-key", verifyAdmin, async (req, res) => {
  const { id } = req.params;

  const newKey = crypto.randomBytes(16).toString("hex");

  try {
    await pool.query("UPDATE users SET premium_key = $1 WHERE id = $2", [
      newKey,
      id,
    ]);

    res.json({ premium_key: newKey });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Optional: reset 2FA
router.patch("/users/:id/2fa-reset", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE users SET twofa_enabled = false, twofa_secret = NULL WHERE id = $1",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
