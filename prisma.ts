import {
  Friendship,
  Meeting,
  MeetingLanguage,
  PrismaClient,
  PrivacyStatus,
  User,
} from "@prisma/client";
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
type MeetingWithParticipants = {
  id: string;
  title: string;
  description: string | null;
  activityFlag: string;
  conferenceId: string;
  startTime: Date;
  saveConversation: boolean;
  enableInterpreter: boolean;
  enableAvatar: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizerId: string;
  token: string | null;
  privacyStatus: PrivacyStatus;
  language: MeetingLanguage;
  participants?: User[];
};
prisma.$use(async (params, next) => {
  const result = await next(params);

  const processUser = (user: User) => {
    if (user.avatar) {
      user.avatar = `${process.env.BASE_URL}/public/uploads/users/${user.avatar}`;
    }
    return user;
  };

  // const processNotification = (notification: Notification) => {
  //   if (notification.badge) {
  //     notification.badge = `${process.env.BASE_URL}/public/uploads/users/${notification.badge}`;
  //   }
  //   return notification;
  // };

  const processMeeting = (meeting: any) => {
    if (meeting.participants) {
      meeting.participants = meeting.participants
        .map(processUser)
        .filter((user: User) => user !== null);
    }
    return meeting;
  };
  const processInvitation = (invitation: any) => {
    if (invitation.participants) {
      invitation.participants = invitation.participants
        .map(processUser)
        .filter((user: User) => user !== null);
    }
    return invitation;
  };

  if (params.model === "User" && result) {
    if (Array.isArray(result)) {
      return result.map(processUser).filter((user) => user !== null);
    } else {
      return processUser(result);
    }
  }

  if (params.model === "Meeting" && result) {
    if (Array.isArray(result)) {
      return result.map(processMeeting);
    } else {
      return processMeeting(result);
    }
  }
  if (params.model === "Invitation" && result) {
    if (Array.isArray(result)) {
      return result.map(processInvitation);
    } else {
      return processInvitation(result);
    }
  }
  if (params.model === "Friendship" && result) {
    if (Array.isArray(result)) {
      return result.map((friendship) => {
        if (friendship.friend) {
          friendship.friend = processUser(friendship.friend);
        }
        return friendship;
      });
    } else {
      if (result.friend) {
        result.friend = processUser(result.friend);
      }
      return result;
    }
  }

  return result;
});

export default prisma;
