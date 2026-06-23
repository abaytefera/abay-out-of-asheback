import "dotenv/config";
import app from "./app";
import prisma from "./config/prisma";
import logger from "./config/logger";
import fs from "fs";
import path from "path";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

// Ensure required directories exist
["logs", "uploads"].forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

async function bootstrap() {
  try {
    // Verify DB connection
    await prisma.$connect();
    logger.info("✅ Database connected");

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV ?? "development"}`);
      logger.info(`📖 API prefix: /api/v1`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database disconnected");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server", { error: err });
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
