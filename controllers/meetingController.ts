import AppError from "../utils/AppError";
import prisma from "../prisma";
import { Meeting } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { decode } from "jsonwebtoken";
import { addHours, parseISO } from "date-fns";
import { Invitation } from "@prisma/client";
import { io } from "../server";
import { sendNotificationToUser } from "../utils/NotificationService";
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

export const scheduleMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const {
      title,
      description,
      startTime,
      activityFlag,
      enableAvatar,
      enableInterpreter,
      saveConversation,
      participants,
      language,
    } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime,
        activityFlag,
        enableAvatar,
        enableInterpreter,
        saveConversation,
        language,
        conferenceId: await generateRandomString(),
        organizerId: user.id,
        participants: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    if (!meeting) {
      return next(
        new AppError("Please verify all fields and meeting settings", 400)
      );
    }

    const invitationsPromises = participants.map((participant: string) =>
      prisma.invitation.create({
        data: {
          meetingId: meeting.id,
          userId: participant,
          status: "pending",
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true,
            },
          },
        },
      })
    );
    const notificationPromises = participants.map((participant: string) =>
      prisma.notification.create({
        data: {
          userId: participant,
          message: `You have been invited to ${meeting.title} meeting by ${user.name}`,
          type: "meetingInvitation",
        },
        select: {
          id: true,
          createdAt: true,
          message: true,
          read: true,
          type: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true,
            },
          },
        },
      })
    );

    const invitations = await Promise.all(invitationsPromises);
    const notifications = await Promise.all(notificationPromises);
    notifications.forEach((notification) => {
      sendNotificationToUser(notification.user.id, notification, io);
    });

    //TODO: send mails to participants and fire the notification event on sockets io

    res.status(201).json({
      status: "success",
      data: {
        meeting,
        invitations,
        notifications,
      },
    });
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(error.message, 500));
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
    next(new AppError(error.message, 500));
  }
};

export const handleMeetingInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { invitationId, status } = req.body;
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: invitationId,
        userId: user.id,
      },
    });
    if (!invitation) {
      return next(
        new AppError(
          "No invitation found for that user with the provided id",
          404
        )
      );
    }
    if (status === "accepted") {
      await prisma.meeting.update({
        where: {
          id: invitation.meetingId,
        },
        data: {
          participants: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
    const updatedInvitation = await prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status,
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            organizer: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
    //TODO: test on frontend
    const notification = await prisma.notification.create({
      data: {
        message: `${user.name} ${status} your ${updatedInvitation.meeting.title} meeting invitation`,
        type:
          status === "accepted"
            ? "meetingInvitationAccepted"
            : "meetingInvitationRejected",
        userId: updatedInvitation.meeting.organizer.id,
      },
    });
    sendNotificationToUser(
      updatedInvitation.meeting.organizer.id,
      notification,
      io
    );
    res.status(200).json({
      status: "success",
      data: {
        invitation: updatedInvitation,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const fetchUserMeetingInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const invitations = await prisma.invitation.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
        meeting: {
          select: {
            activityFlag: true,
            conferenceId: true,
            description: true,
            id: true,
            organizerId: true,
            startTime: true,
            title: true,
            participants: {
              orderBy: {
                createdAt: "desc",
              },
              where: {
                NOT: {
                  id: user.id,
                },
              },
              select: {
                email: true,
                name: true,
                photo: true,
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!invitations) {
      return next(
        new AppError(
          "No invitation found for that user with the provided id",
          404
        )
      );
    }
    res.status(200).json({
      status: "success",
      data: {
        invitations,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};
export const fetchUserMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const meetings = await prisma.meeting.findMany({
      where: {
        participants: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        participants: {
          orderBy: {
            createdAt: "desc",
          },
          where: {
            NOT: {
              id: user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!meetings) {
      return next(
        new AppError(
          "No scheduled or previous meetings found for that user with the provided id",
          404
        )
      );
    }
    res.status(200).json({
      status: "success",
      length: meetings.length,
      data: {
        meetings,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

//TODO: edit meeting
//TODO: manage conversations with meetings