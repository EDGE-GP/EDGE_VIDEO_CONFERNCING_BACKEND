import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import jwt, { decode } from "jsonwebtoken";
import crypto from "crypto";

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (
  user: User,
  statusCode: number,
  res: Response
) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      },
    },
  });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }
    const user: User | null = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }
    createSendToken(user, 200, res);
  } catch (err: any) {
    next(new AppError("Something went wrong", 400));
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.confirmPassword
    ) {
      return next(new AppError("Please provide all required fields", 400));
    }
    if (req.body.password !== req.body.confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }
    const existingUser: User | null = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });
    if (existingUser) {
      return next(new AppError("User already exists", 400));
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const newUser: User = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      },
    });
    createSendToken(newUser, 201, res);
  } catch (err: any) {
    next(new AppError(err.message, 400));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("Please provide all required fields", 400));
    }
    const user: User | null = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: passwordResetToken,
        passwordResetExpires: passwordResetExpires,
      },
    });
    console.log(resetToken);
    res.status(200).json({
      status: "success",
      expiresIn: "10 minutes",
      resetToken,
    });
  } catch (err: any) {
    next(new AppError(err.message, 400));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if (!password || !confirmPassword) {
      return next(new AppError("Please provide all required fields", 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });
    if (!user) {
      return next(new AppError("Invalid or expired token", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(Date.now() - 1000),
      },
    });
    // createSendToken(user, 200, res);
    res.status(200).json({
      status: "success",
      message: "Password reset successful",
    });
  } catch (err: any) {
    next(new AppError(err.message, 400));
  }
};

export const validate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    console.log(token);
    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }
    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };
    const decoded: any = await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET
    );
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!user)
      throw new Error("The User belonging to the token no longer exists!");
    if (user.passwordChangedAt) {
      const changedTimestamp: number = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      console.log(decoded.iat < changedTimestamp);
      console.log(decoded.iat, changedTimestamp);
      if (decoded.iat < changedTimestamp) {
        return next(
          new AppError(
            "User recently changed password! Please log in again",
            401
          )
        );
      }
    }
    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          photo: user.photo,
        },
      },
    });
  } catch (err: any) {
    next(new AppError(err.message, 400));
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({
      status: "success",
    });
  } catch (err: any) {
    next(new AppError(err.message, 400));
  }
};
