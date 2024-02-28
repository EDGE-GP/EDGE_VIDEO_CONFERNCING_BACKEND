import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import app from "./app";
//For env File
dotenv.config({
  path: ".env",
});

const PORT: string | number = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// process.on("unhandledRejection", (err) => {
//   console.log("UNHANDLED REJECTION! 💥 Shutting down...");
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
