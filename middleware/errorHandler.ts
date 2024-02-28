import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
const errorHandler = (
  err: AppError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("reached error handler");
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (err.code === 11000) {
    err.message = "Invalid data input";
    err.statusCode = 400;
  }
  if (err.name === "JsonWebTokenError") {
    err.message = "Invalid token. Please log in again";
    err.statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    err.message = "Your token has expired. Please log in again";
    err.statusCode = 401;
  }
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export default errorHandler;
