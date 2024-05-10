import { Server } from "socket.io";
import { userSockets } from "../server";

export function sendNotificationToUser(
  userId: string,
  notificationData: any,
  io: Server
) {
  const socketId = userSockets[userId];
  console.log({
    userSockets,
    socketId,
  });
  if (socketId) {
    io.to(socketId).emit("notification", notificationData);
    console.log("Notification fired");
  } else {
    console.log(`User ${userId} is not connected`);
  }
}
