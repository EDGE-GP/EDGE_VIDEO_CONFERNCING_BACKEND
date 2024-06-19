import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import app from "./app";
import { Socket, Server as SocketIOServer } from "socket.io";
import { User } from "@prisma/client";

//For env File
dotenv.config({
  path: ".env",
});

const PORT: string | number = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

export const userSockets: Record<string, string> = {};
io.on("connection", (socket: Socket) => {
  const id = socket.handshake.query.id as string;

  if (!id) {
    socket.disconnect(true);
    return;
  }

  console.log(`User ${id} connected via WebSocket`);

  userSockets[id] = socket.id;
  console.log(userSockets);
  socket.on(
    "joinMeeting",
    ({ meetingId, signer }: { meetingId: string; signer: boolean }) => {
      if (!meetingId) {
        socket.disconnect(true);
        return;
      }

      console.log(`User ${id} joining meeting ${meetingId}`);
      socket.data.signer = signer;

      socket.join(meetingId);
      const room = io.sockets.adapter.rooms.get(meetingId);
      console.log({ room });
      if (room) {
        room.forEach((socketId) => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket) {
            if (participantSocket.data.signer) {
              console.log(`User ${socket.id} is a signer`);
            } else {
              console.log(`User ${socket.id} is not a signer`);
            }
          }
        });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`User ${id} disconnected`);

    // Remove user from all rooms they are part of
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`User ${id} left meeting ${room}`);
      }
    }

    delete userSockets[id];
    console.log(userSockets);
  });
});

io.on("connect_error", (error: any) => {
  console.error("Socket.IO connection error:", error);
});
process.on("unhandledRejection", (err: any) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
