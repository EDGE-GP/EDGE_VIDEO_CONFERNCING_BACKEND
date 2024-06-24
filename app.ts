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
import cron from "node-cron";
import prisma from "./prisma";
import Email from "./utils/email";

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
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USERNAME: string;
      EMAIL_PASSWORD: string;
      FRONT_END_BASE_URL: string;
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
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  req.body.requestTime = new Date().toISOString();
  next();
});
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "/views"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.get("/signs", (req, res) => {
  console.log('signs hit')
  res.render("signs");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/meetings", meetingRouter);
app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `404 - Not Found. API '${req.originalUrl}' not found.`,
  });
});
function roundToNearestMinute(date: Date): Date {
  date.setSeconds(0, 0);
  return date;
}
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const nowUtc = new Date(now.toISOString());
    const fifteenMinutesLater = new Date(nowUtc.getTime() + 15 * 60000);
    console.log({ fifteenMinutesLater });
    console.log({
      fifteenMinutes: roundToNearestMinute(fifteenMinutesLater),
    });
    const meetings = await prisma.meeting.findMany({
      where: {
        startTime: roundToNearestMinute(fifteenMinutesLater),
      },
      include: {
        participants: true,
      },
    });

    for (const meeting of meetings) {
      for (const participant of meeting.participants) {
        new Email(
          participant,
          `${process.env.FRONT_END_BASE_URL}/stage/meetings/${meeting.conferenceId}`
        ).sendMeetingReminders(meeting.title);
        console.log("email sent");
      }
    }

    console.log("Running a task every minute");
  } catch (err) {
    console.log(err);
  }
});

app.use(errorHandler);
export default app;
