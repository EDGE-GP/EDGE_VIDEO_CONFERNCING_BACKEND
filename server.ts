import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import app from "./app";
import { Socket, Server as SocketIOServer } from "socket.io";

//For env File
dotenv.config({
  path: ".env",
});

const PORT: string | number = process.env.PORT || 5000;
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
  socket.on("disconnect", () => {
    console.log(`User ${id} disconnected`);
    delete userSockets[id];
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
