// backend/server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/authRoutes.js";
import scrapingRoutes from "./routes/scrapingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import schedulerService from "./services/schedulerService.js";

import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/scrape", scrapingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/email", emailRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start the weekly email scheduler
  setTimeout(() => {
    schedulerService.startScheduler();
  }, 2000); // Wait 2 seconds for server to fully start
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

export default app;
