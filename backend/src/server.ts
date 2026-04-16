import { app } from "./app";
import { prisma } from "./config/prisma";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`Finora auth backend running on port ${env.PORT}`);
});

const gracefulShutdown = async () => {
  console.log("Shutting down server...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
