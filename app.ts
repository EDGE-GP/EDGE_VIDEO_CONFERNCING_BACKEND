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

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: "development" | "production";
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
    }
  }
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

dotenv.config();

const app: Application = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Hello World",
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  req.body.requestTime = new Date().toISOString();
  next();
});

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
