import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost", "http://localhost:5174", "http://localhost:5173"],
    credentials: false,
  })
);
app.use(express.json({ limit: "10mb" })); // Prevent large payload attacks

app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(` Vaultify Admin Backend running on http://localhost ${PORT}`)
);
