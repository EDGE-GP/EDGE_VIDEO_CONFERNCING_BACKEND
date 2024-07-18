//TODO: only address verified users
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import jwt, { decode } from "jsonwebtoken";
import crypto from "crypto";
import Email from "../utils/email";

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
        avatar: user.avatar,
        remindersViaEmail: user.remindersViaEmail,
        location: user.location,
        bio: user.bio,
        notifyEmail: user.notifyEmail,
      },
    },
  });
};

export const protect = async (
  req: Request<Request, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("hitting protect");
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
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
    const freshUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      include: {
        blockedUsers: true,
        blockedBy: true,
      },
    });

    if (!freshUser)
      return next(
        new AppError("The User belonging to the token no longer exists!", 404)
      );

    if (freshUser.passwordChangedAt) {
      const changedTimestamp: number = Math.floor(
        freshUser.passwordChangedAt.getTime() / 1000
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
    req.user = freshUser;
    res.locals = freshUser;
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
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
    next(new AppError(err.message, 500));
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const existingUser: User | null = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (existingUser) {
      return next(new AppError("User already exists", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const activationToken = crypto.randomBytes(32).toString("hex");
    const emailActivationToken = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");
    const newUser: User = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        emailActivationToken,
        active: true,
      },
    });
    createSendToken(newUser, 200, res);

    // new Email(
    //   newUser,
    //   `${process.env.FRONT_END_BASE_URL}/auth/activate?token=${activationToken}`
    // ).sendEmailActivationToken();

    res.status(200).json({
      status: "Success",
      message:
        "Signed up successfully, please activate your account, an email was sent to you",
    });
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};

export const activateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("activating");
    const { token } = req.body;
    console.log({ token });
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        emailActivationToken: hashedToken,
      },
    });

    if (!user) {
      return next(
        new AppError(
          "It seems that the token provided is invalid, please verify that you followed the right link",
          404
        )
      );
    }

    new Email(
      user,
      `${process.env.FRONT_END_BASE_URL}/dashboard/settings`
    ).sendEmailActivationToken();

    createSendToken(user, 200, res);
  } catch (err: any) {
    next(new AppError(err.message, 500));
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
    next(new AppError(err.message, 500));
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
    next(new AppError(err.message, 500));
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
          avatar: user.avatar,
          remindersViaEmail: user.remindersViaEmail,
          location: user.location,
          bio: user.bio,
          notifyEmail: user.notifyEmail,
        },
      },
    });
  } catch (err: any) {
    next(new AppError(err.message, 500));
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
    next(new AppError(err.message, 500));
  }
};

export const changeUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return next(new AppError("Current password is incorrect", 401));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
    createSendToken(updatedUser, 200, res);
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};
