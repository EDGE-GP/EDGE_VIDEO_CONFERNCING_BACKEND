import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

prisma
  .$connect()
  .then(() => {
    console.log("Connected to the database 😅");
  })
  .catch((error) => {
    throw new Error("Failed to connect to the database");
  });

export default prisma;
