import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import app from "./app";
import { Server as SocketIOServer } from "socket.io";

//For env File
dotenv.config({
  path: ".env",
});

const PORT: string | number = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.on("connection", (client: any) => {
  console.log("New websocket connection");
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
