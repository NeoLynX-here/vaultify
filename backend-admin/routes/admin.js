import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "crypto";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();
const router = express.Router();

/* -----------------------------
   1. Admin Login Rate Limiter
------------------------------ */
const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Allow 5 attempts / minute
  message: { error: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* -----------------------------------------
   2. Admin API (JWT Protected) Limiter
------------------------------------------ */
const adminApiLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 30, // Allow 30 admin requests per 15s
  message: { error: "Too many requests from admin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all /api/admin/* except login
router.use((req, res, next) => {
  if (req.path === "/login") return next();
  return adminApiLimiter(req, res, next);
});

/* -----------------------------
   3. Verify Admin JWT
------------------------------ */
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

/* -----------------------------
   4. Admin Login (with limiter)
------------------------------ */
router.post("/login", adminLoginLimiter, async (req, res) => {
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

/* -----------------------------
   5. Fetch All Users
------------------------------ */
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

/* -----------------------------
   6. Toggle Premium
------------------------------ */
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

/* -----------------------------
   7. Generate New Premium Key
------------------------------ */
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

/* -----------------------------
   8. Reset 2FA
------------------------------ */
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
