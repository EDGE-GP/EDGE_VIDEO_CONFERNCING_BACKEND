import express, {
  Express,
  Request,
  Response,
  NextFunction,
  Application,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import errorHandler from "./middleware/errorHandler";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes";
import meetingRouter from "./routes/meetingRoutes";
import { User } from "@prisma/client";
import path from "path";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: "development" | "production";
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_COOKIE_EXPIRES_IN: string;
      AGORA_APP_ID: string;
      AGORA_APP_CERTIFICATE: string;
      AGORA_EXPIRES_IN: string;
      BASE_URL: string;
    }
  }
  namespace Express {
    interface Request {
      user: User;
    }
  }
}
declare module "@prisma/client" {
  namespace Prisma {
    interface args {
      req?: Request;
    }
  }
}

dotenv.config();

const app: Application = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  req.body.requestTime = new Date().toISOString();
  next();
});
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/meetings", meetingRouter);
app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `404 - Not Found. API '${req.originalUrl}' not found.`,
  });
});

app.use(errorHandler);
export default app;
