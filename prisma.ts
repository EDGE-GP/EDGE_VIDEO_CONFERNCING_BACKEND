import { PrismaClient } from "@prisma/client";
import { Request } from "express";
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

prisma.$use(async (params, next) => {
  const result = await next(params);
  const { baseURL } = params.args;
  if (params.model === "User" && result) {
    // const req = params.args.req as Request;
    // const host = req.get("host");
    // const protocol = req.protocol;

    const processAvatar = (user: any) => {
      if (user.avatar) {
        user.avatar = `${process.env.BASE_URL}/public/uploads/users/${user.avatar}`;
      }
    };

    if (Array.isArray(result)) {
      result.forEach(processAvatar);
    } else {
      processAvatar(result);
    }
  }

  return result;
});
export default prisma;
