import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import queueRoutes from "./routes/queueRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticateManager } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes: managers must be able to register and log in
app.use("/api/auth", authRoutes);

// Protected routes: require a valid JWT
app.use("/api/queues", authenticateManager, queueRoutes);
app.use("/api/tokens", authenticateManager, tokenRoutes);
app.use("/api/analytics", authenticateManager, analyticsRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("QueueFlow Backend is Running!");
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
