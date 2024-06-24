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
    ({ conferenceId, signer }: { conferenceId: string; signer: boolean }) => {
      if (!conferenceId) {
        socket.disconnect(true);
        return;
      }
      console.log({ signer, conferenceId });

      console.log(`User ${id} joining meeting ${conferenceId}`);
      socket.data.signer = signer;

      socket.join(conferenceId);
      const room = io.sockets.adapter.rooms.get(conferenceId);
      console.log({ room });
      if (room) {
        room.forEach((socketId) => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket) {
            if (participantSocket.data.signer) {
              console.log(`User ${socketId} is a signer`);
            } else {
              console.log(`User ${socketId} is not a signer`);
            }
          }
        });
      }
    }
  );
  socket.on(
    "sendSigns",
    ({ conferenceId, message }: { conferenceId: string; message: string }) => {
      console.log(
        `sneding sign: ${message} from ${socket.id} to ${conferenceId}`
      );
      socket.to(conferenceId).emit("signsMessage", { message });
    }
  );
  socket.on("sendDummySignsSigns", ({ message }) => {
    console.log(`sending sign: ${message} from ${socket.id} to all rooms`);

    const sockets = io.sockets.sockets;
    sockets.forEach((s) => {
      s.rooms.forEach((room) => {
        console.log(room, s.id, message);
        if (room !== s.id) {
          // Exclude the default room of the socket
          io.to(room).emit("signsMessage", { message });
        }
      });
    });
  });
  socket.on(
    "sendSpeech",
    ({ conferenceId, message }: { conferenceId: string; message: string }) => {
      const room = io.sockets.adapter.rooms.get(conferenceId);
      if (room) {
        room.forEach((socketId) => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket) {
            if (participantSocket.data.signer) {
              console.log(
                `sending speech: ${message} from ${socket.id} to ${conferenceId}`
              );
              participantSocket.emit("speechMessage", { message });
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
