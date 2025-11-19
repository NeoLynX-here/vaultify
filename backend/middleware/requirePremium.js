// middleware/requirePremium.js
import jwt from "jsonwebtoken";
import { pool } from "../db.js"; // Add this import
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

export async function requirePremium(req, res, next) {
  // Make async
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    //  Check JWT premium claim first (fast path)
    if (decoded.premium) {
      req.user = decoded;
      return next();
    }

    //  If JWT says no premium, check database (fallback)
    const result = await pool.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    //  Allow if database says user has premium
    if (result.rows[0].is_premium) {
      req.user = decoded;
      return next();
    }

    //  Both JWT and database say no premium
    return res.status(403).json({ message: "Premium required" });
  } catch (err) {
    console.error(" requirePremium error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
}
