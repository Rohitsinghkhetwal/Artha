import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import ConnectDatabase from "./config/Database.js";
import connectRedis from "./config/Redis.js";
import { startCronJob, getCronJobStatus } from "./cron/Jobimportcron.js";
import { logger } from "./utils/logger.js";
import importRoute from "./routes/import.route.js"

dotenv.config({
  path: "./config.env",
});

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "50mb" }));
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/api", limiter);

app.get("/health", (req, res) => {
  res.send("Hey Welcome ! ");
});

app.use("/api/v1", importRoute)

const startServer = async () => {
  try {
    logger.info("🚀 Starting Job Importer Server...");

    logger.info(" Connecting to MongoDB...");
    await ConnectDatabase();

    // Connect to Redis
    logger.info(" Connecting to Redis...");
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
    });


    logger.info(" Starting cron scheduler...");
    startCronJob();

    const cronStatus = getCronJobStatus();
    logger.info(` Cron Status: ${cronStatus.isRunning ? "Running" : "Stopped"}`);

    const gracefulShutdown = async (signal) => {
      logger.warn(`\n${signal} received, shutting down gracefully...`);

      // Close HTTP server
      server.close(() => {
        logger.info("🛑 HTTP server closed");
      });

      // Close database connections
      try {
        // Close MongoDB
        const mongoose = await import("mongoose");
        await mongoose.default.connection.close(false);
        logger.info("📦 MongoDB connection closed");

        // Close Redis (if you have a close method)
        // await redisClient.quit();
        // logger.info("🔴 Redis connection closed");

        logger.info("✅ Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        logger.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));


    process.on("uncaughtException", (error) => {
      logger.error(" Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error(" Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    logger.error(" Failed to start server:", error);
    process.exit(1);
  }
};


startServer();