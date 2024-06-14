import { Request, Response, NextFunction } from "express";
import multer from "multer";
import sharp from "sharp";
import AppError from "./AppError";
import { User } from "@prisma/client";

// Define multer storage
const multerStorage = multer.memoryStorage();

// Define multer filter
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Middleware to upload user photo
export const uploadUserPhoto = upload.single("avatar");

// Middleware to resize user photo
export const resizeUserPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) return next();
    // Assuming `req.user` is defined somewhere
    if (!req.user) {
      return next(new Error("User not found"));
    }
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/uploads/users/${req.file.filename}`);
    next();
  } catch (err) {
    next(err);
  }
};

export const parseAvatarURL = (req: Request, user: User) => {
  return {
    ...user,
    avatar: user.avatar
      ? `${req.protocol}://${req.get("host")}/public/uploads/users/${
          user.avatar
        }`
      : null,
  };
};
