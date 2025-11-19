import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import premiumRoutes from "./routes/premium.js";
import twofaRoutes from "./routes/twofa.js";

dotenv.config();

// Environment validation
const requiredEnvVars = ["JWT_SECRET"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars);
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost","http://localhost:5173"],
    credentials: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" })); // Prevent large payload attacks

// Routes
app.use("/api", authRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/2fa", twofaRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Vaultify backend running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
