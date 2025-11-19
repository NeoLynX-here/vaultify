import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import dotenv from "dotenv";
import { createTicket } from "./twofa.js";
import crypto from "crypto";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

//  1. Get Salt
router.get("/getSalt", async (req, res) => {
  const { email } = req.query;
  try {
    const result = await pool.query("SELECT salt FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ salt: result.rows[0].salt });
  } catch (err) {
    console.error(" /getSalt Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  2. Register (no default empty vault)
router.post("/register", async (req, res) => {
  const { email, auth_proof, salt } = req.body;
  try {
    const hashedProof = await bcrypt.hash(auth_proof, 10);

    // Don't include encrypted_blob or cards_blob at registration
    await pool.query(
      `INSERT INTO users (email, auth_hash, salt)
       VALUES ($1, $2, $3)`,
      [email, hashedProof, salt]
    );

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error(" /register Error:", err);
    if (err.code === "23505")
      return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Server error" });
  }
});

//  3. Login
router.post("/login", async (req, res) => {
  const { email, auth_proof } = req.body;

  try {
    // 1️ Fetch user data from DB (only needed fields)
    const result = await pool.query(
      "SELECT id, auth_hash, salt, is_premium, twofa_enabled FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = result.rows[0];

    // 2️ Verify password proof
    const valid = await bcrypt.compare(auth_proof, user.auth_hash);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    // 3️ If 2FA is enabled (and premium), require verification ticket
    if (user.is_premium && user.twofa_enabled) {
      const ticket = await createTicket(user.id, 300); // expires in 5 mins
      return res.json({
        twofa_required: true,
        ticket,
        message: "2FA verification required",
      });
    }

    // 4 Generate JWT (with premium claim)
    const token = jwt.sign(
      {
        userId: user.id,
        premium: !!user.is_premium,
        email: user.email,
        jti: crypto.randomBytes(4).toString("hex"),
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5 Return premium state explicitly to frontend
    res.json({
      token,
      is_premium: !!user.is_premium, // always tell frontend
      message: "Login successful",
    });
  } catch (err) {
    console.error(" /login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//  4. Get Vault
router.get("/vault", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      "SELECT encrypted_blob FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    let { encrypted_blob } = result.rows[0];

    // If no vault exists yet, return an empty object
    if (!encrypted_blob) {
      return res.json({ encrypted_blob: {} });
    }

    // Parse safely
    if (typeof encrypted_blob === "string") {
      try {
        encrypted_blob = JSON.parse(encrypted_blob);
      } catch {
        encrypted_blob = {};
      }
    }

    res.json({ encrypted_blob });
  } catch (err) {
    console.error(" /vault GET Error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

//  5. Save Vault
router.post("/vault", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    let { encrypted_blob } = req.body;

    if (!encrypted_blob)
      return res.status(400).json({ message: "Missing encrypted_blob" });

    // Ensure correct JSON format
    if (typeof encrypted_blob !== "string") {
      encrypted_blob = JSON.stringify(encrypted_blob);
    }

    await pool.query("UPDATE users SET encrypted_blob = $1 WHERE id = $2", [
      encrypted_blob,
      decoded.userId,
    ]);

    res.json({ message: "Vault updated successfully" });
  } catch (err) {
    console.error(" /vault POST Error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

//  6. Get Cards
router.get("/cards", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      "SELECT cards_blob FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    let { cards_blob } = result.rows[0];

    // If no cards exist yet, return empty object
    if (!cards_blob) {
      return res.json({ encrypted_blob: {} });
    }

    // Parse safely
    if (typeof cards_blob === "string") {
      try {
        cards_blob = JSON.parse(cards_blob);
      } catch {
        cards_blob = {};
      }
    }

    res.json({ encrypted_blob: cards_blob });
  } catch (err) {
    console.error(" /cards GET Error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

//  7. Save Cards
router.post("/cards", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    let { encrypted_blob } = req.body;

    if (!encrypted_blob)
      return res.status(400).json({ message: "Missing encrypted_blob" });

    if (typeof encrypted_blob !== "string") {
      encrypted_blob = JSON.stringify(encrypted_blob);
    }

    await pool.query("UPDATE users SET cards_blob = $1 WHERE id = $2", [
      encrypted_blob,
      decoded.userId,
    ]);

    res.json({ message: "Cards updated successfully" });
  } catch (err) {
    console.error(" /cards POST Error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
