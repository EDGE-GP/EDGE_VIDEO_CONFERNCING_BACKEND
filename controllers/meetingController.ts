import AppError from "../utils/AppError";
import prisma from "../prisma";
import { Meeting } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { decode } from "jsonwebtoken";

const generateRandomString = (): string => {
  const getRandomUpperCaseLetter = () =>
    String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Random uppercase letter generator

  let randomString = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      randomString += getRandomUpperCaseLetter();
    }
    if (i < 2) {
      randomString += "-";
    }
  }
  return randomString;
};

export const createMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      startTime,
      activityFlag,
      enableAvatar,
      enableInterpreter,
      saveConversation,
      participants,
    } = req.body;
    // if (
    //   !title ||
    //   !startTime ||
    //   !activityFlag ||
    //   !enableAvatar ||
    //   !enableInterpreter ||
    //   !saveConversation
    // ) {
    //   return next(new AppError("Please provide all the required fields", 400));
    // }
    if (!title || !startTime || !activityFlag || !participants) {
      return next(new AppError("Please provide title", 400));
    }
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // console.log(token);
    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }
    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };
    const decoded: any = await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET
    );
    console.log(decoded.id);
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime,
        activityFlag,
        enableAvatar,
        enableInterpreter,
        saveConversation,
        conferenceId: generateRandomString(),
        oranizerId: decoded.id,
        participants: {
          connect: participants.map((participantId: string) => ({
            id: participantId,
          })),
        },
      },
    });
    if (!meeting) {
      return next(
        new AppError("Please verify all fields and meeting settings", 400)
      );
    }

    res.status(201).json({
      status: "success",
      data: {
        meeting,
      },
    });
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError("Something went wrong", 500));
  }
};

export const getMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const meetingID = req.params.id;
    const meeting: Meeting | null = await prisma.meeting.findUnique({
      where: {
        id: meetingID,
      },
      //include participants without their password
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        meeting,
      },
    });
  } catch (error: any) {
    next(new AppError("Something went wrong", 500));
  }
};
