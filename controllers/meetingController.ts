import AppError from "../utils/AppError";
import prisma from "../prisma";
import { Meeting } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { decode } from "jsonwebtoken";

const generateRandomString = async (): Promise<string> => {
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

  const existingMeeting = await prisma.meeting.findUnique({
    where: {
      conferenceId: randomString,
    },
  });

  if (existingMeeting) {
    return generateRandomString();
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
        conferenceId: await generateRandomString(),
        oranizerId: decoded.id,
        participants: {
          connect: {
            id: decoded.id,
          },
        },
      },
    });
    if (!meeting) {
      return next(
        new AppError("Please verify all fields and meeting settings", 400)
      );
    }

    // TODO: Invitation should be created and sent to participants' email
    const invitationsPromises = participants.map((participant: string) =>
      prisma.invitation.create({
        data: {
          meetingId: meeting.id,
          userId: participant,
          status: "pending",
        },
        select: {
          user: true,
        },
      })
    );

    const invitations = await Promise.all(invitationsPromises);
    console.log({ invitations });

    res.status(201).json({
      status: "success",
      data: {
        meeting,
        invitations,
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
