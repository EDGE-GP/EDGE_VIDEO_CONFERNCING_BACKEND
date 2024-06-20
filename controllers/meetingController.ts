//TODO: only address verified users
import AppError from "../utils/AppError";
import prisma from "../prisma";
import { Meeting, User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { io } from "../server";
import { sendNotificationToUser } from "../utils/NotificationService";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
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
const generateRandomPrivateMeetingPassword = (): string => {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26) + 65;
    randomString += String.fromCharCode(randomCharCode);
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
      privacyStatus,
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
        privacyStatus,
        conferenceId: await generateRandomString(),
        organizerId: user.id,
        password:
          privacyStatus === "private"
            ? generateRandomPrivateMeetingPassword()
            : null,
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
              avatar: true,
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
          badge: user.avatar,
        },
        select: {
          id: true,
          createdAt: true,
          message: true,
          read: true,
          type: true,
          badge: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
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

    //TODO: send mails to participants

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
            avatar: true,
            active: true,
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
        badge: user.avatar,
      },
      select: {
        id: true,
        createdAt: true,
        message: true,
        read: true,
        type: true,
        badge: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            active: true,
          },
        },
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
            password: true,

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
                avatar: true,
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
        invitations: invitations.map((invitation) => {
          return {
            ...invitation,
            meeting: {
              ...invitation.meeting,
              participants: invitation.meeting.participants.map(
                (participant) => {
                  return {
                    ...participant,
                    avatar: participant.avatar? `${process.env.BASE_URL}/public/uploads/users/${participant.avatar}` : null,
                  };
                }
              ),
            },
          };
        }),
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
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            active: true,
          },
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

export const joinMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { conferenceId } = req.body;
    let meeting = await prisma.meeting.findUnique({
      where: {
        conferenceId,
      },
      include: {
        Invitation: true,
        organizer: true,
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            active: true,
          },
        },
      },
    });
    if (!meeting) {
      return next(
        new AppError("No meeting found with the provided conference id", 404)
      );
    }
    const room = io.sockets.adapter.rooms.get(meeting.id);

    const isPast =
      new Date() > new Date(meeting.startTime.getTime() + 15 * 60 * 1000);
    console.log({
      room,
      size: room?.size,
      isPast,
    });
    if (isPast && (!room || room?.size === 0)) {
      return next(
        new AppError("The meeting you are trying to join is expired", 404)
      );
    }
    if (meeting?.privacyStatus === "public") {
      res.status(200).json({
        status: "success",
        data: {
          meeting,
          passwordRequirment: false,
        },
      });
    } else if (
      meeting?.participants.some((participant) => participant.id === user.id) ||
      meeting?.Invitation.some((invitation) => invitation.userId === user.id)
    ) {
      res.status(200).json({
        status: "success",
        data: {
          meeting,
          passwordRequirment: false,
        },
      });
    } else if (meeting.privacyStatus === "private") {
      res.status(200).json({
        status: "success",
        data: {
          meeting,
          passwordRequirment: true,
        },
      });
    }

    //TODO: manage active participants using sockets, if meeting current time is greater than start time plus 15 minutes, do not allow join
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

export const createInstantMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      participants,
      language,
      activityFlag,
      enableAvatar,
      enableInterpreter,
      saveConversation,
      privacyStatus,
    } = req.body;
    const { user } = req;
    const conferenceId = await generateRandomString();
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        activityFlag,
        enableAvatar,
        enableInterpreter,
        saveConversation,
        language,
        conferenceId,
        privacyStatus,
        organizerId: user.id,
        password:
          privacyStatus === "private"
            ? generateRandomPrivateMeetingPassword()
            : null,
        participants: {
          connect: [
            { id: user.id },
            ...participants.map((participant: string) => ({
              id: participant,
            })),
          ],
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
              avatar: true,
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
          badge: user.avatar,
        },
        select: {
          id: true,
          createdAt: true,
          message: true,
          read: true,
          type: true,
          badge: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
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

    //TODO: send mails to participants

    res.status(201).json({
      status: "success",
      data: {
        meeting,
        invitations,
        notifications,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const checkMeetingPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { meetingId, password } = req.body;
    //check user password if it is correct and if the user is in the participants list or in the invitations list
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        password,
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            active: true,
          },
        },
      },
    });
    if (!meeting) {
      return next(new AppError("password is incorrect", 401));
    }
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

//TODO: edit meeting
//TODO: manage conversations with meetings
