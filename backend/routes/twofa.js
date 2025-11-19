// routes/twofa.js
import express from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import dotenv from "dotenv";
import { requirePremium, requireAuth } from "../middleware/requirePremium.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();

/* ------------------------------------------
   Setup 2FA (Generate Secret & QR Code)
--------------------------------------------- */
router.post("/setup", requirePremium, async (req, res) => {
  const userId = req.user.userId;

  try {
    //  FIXED: Fetch both twofa_enabled AND email
    const userCheck = await pool.query(
      "SELECT twofa_enabled, email FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userCheck.rows[0];

    if (user.twofa_enabled) {
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    const secret = speakeasy.generateSecret({
      name: `Vaultify:${user.email}`,  //  FIXED: Use user.email from database
      issuer: "Vaultify",
      length: 20,
    });

    // Save secret temporarily — not yet enabled
    await pool.query(
      "UPDATE users SET twofa_secret = $1, twofa_enabled = false WHERE id = $2",
      [secret.base32, userId]
    );

    const qrCodeURL = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: "2FA setup initiated",
      qrCodeURL,
      secret: secret.base32, // For manual entry
    });
  } catch (err) {
    console.error(" /setup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------
   Verify 2FA Code and Activate
--------------------------------------------- */
router.post("/verify", requirePremium, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.userId;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const result = await pool.query(
      "SELECT twofa_secret, twofa_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.twofa_enabled) {
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    if (!user.twofa_secret) {
      return res.status(400).json({ message: "2FA setup not initiated" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: "base32",
      token,
      window: 1, // Allow 30 seconds before/after
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Activate 2FA
    await pool.query("UPDATE users SET twofa_enabled = true WHERE id = $1", [
      userId,
    ]);

    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    console.error(" /verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------
   Create Login Ticket (used in /login)
--------------------------------------------- */
export async function createTicket(userId, ttlSeconds = 300) {
  const ticket = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // Clean up expired tickets
  await pool.query("DELETE FROM twofa_tickets WHERE expires_at < NOW()");

  await pool.query(
    "INSERT INTO twofa_tickets (user_id, ticket, expires_at) VALUES ($1, $2, $3)",
    [userId, ticket, expiresAt]
  );

  return ticket;
}

/* ------------------------------------------
   Verify Ticket + OTP for Login
--------------------------------------------- */
router.post("/verify-login", async (req, res) => {
  const { ticket, otp } = req.body;

  if (!ticket || !otp) {
    return res.status(400).json({ message: "Ticket and OTP are required" });
  }

  try {
    // Get ticket with user info
    const result = await pool.query(
      `SELECT t.user_id, u.email, u.is_premium, u.twofa_secret, u.twofa_enabled 
       FROM twofa_tickets t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.ticket = $1 AND t.expires_at > NOW()`,
      [ticket]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired ticket" });
    }

    const { user_id, email, is_premium, twofa_secret, twofa_enabled } =
      result.rows[0];

    if (!twofa_enabled || !twofa_secret) {
      return res.status(400).json({ message: "2FA not enabled for this user" });
    }

    const verified = speakeasy.totp.verify({
      secret: twofa_secret,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    // Delete used ticket
    await pool.query("DELETE FROM twofa_tickets WHERE ticket = $1", [ticket]);

    // Create final JWT
    const token = jwt.sign(
      {
        userId: user_id,
        premium: !!is_premium,
        email: email,
        jti: crypto.randomBytes(6).toString("hex"),
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      is_premium: is_premium,
      message: "Login successful",
    });
  } catch (err) {
    console.error(" 2FA verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------
   GET 2FA Status
--------------------------------------------- */
router.get("/status", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT twofa_enabled FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      enabled: result.rows[0].twofa_enabled || false,
    });
  } catch (err) {
    console.error(" /2fa/status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------
   Disable 2FA with Password Verification
--------------------------------------------- */
router.post("/disable", requireAuth, async (req, res) => {
  const { auth_proof } = req.body; // Consistent naming with premium
  const userId = req.user.userId;

  if (!auth_proof) {
    return res.status(400).json({ message: "Password verification required" });
  }

  try {
    // Get user's auth_hash and 2FA status
    const userResult = await pool.query(
      "SELECT auth_hash, twofa_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (!user.twofa_enabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    //  Verify password proof using bcrypt (same as premium)
    const valid = await bcrypt.compare(auth_proof, user.auth_hash);
    if (!valid) {
      return res.status(403).json({ message: "Invalid password" }); //  Consistent 403
    }

    // Disable 2FA
    await pool.query(
      "UPDATE users SET twofa_enabled = false, twofa_secret = NULL WHERE id = $1",
      [userId]
    );

    res.json({ message: "2FA disabled successfully" });
  } catch (err) {
    console.error(" /disable error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
