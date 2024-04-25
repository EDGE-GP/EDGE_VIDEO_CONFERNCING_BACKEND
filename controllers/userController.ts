import AppError from "../utils/AppError";
import prisma from "../prisma";
import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { decode } from "jsonwebtoken";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users: User[] = await prisma.user.findMany();

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getOneUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: User | null = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
    });
    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 404));
  }
};
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const updatedUser: User | null = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        name,
        email,
      },
    });

    if (!updatedUser) {
      return next(new AppError("No user found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 404));
  }
};
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const deletedUser: User | null = await prisma.user.delete({
      where: {
        id: id,
      },
    });

    if (!deletedUser) {
      return next(new AppError("No user found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      message: "User deleted successfully",
      data: null,
    });
  } catch (error: any) {
    next(new AppError(error.message, 404));
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { searchTerm } = req.params;
    if (!searchTerm || searchTerm.length === 0) {
      return next(new AppError("Please provide a search term", 400));
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm || "", mode: "insensitive" } },
          { name: { contains: searchTerm || "", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
      },
    });

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 404));
  }
};

export const createFriendshipRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const { user } = req;
    if (!userId) {
      return next(new AppError("Please provide all required fields", 400));
    }
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: userId },
          { user1Id: userId, user2Id: user.id },
        ],
      },
    });
    if (existingFriendship) {
      return next(
        new AppError("Friendship already exists between these users", 400)
      );
    }
    const friendship = await prisma.friendship.create({
      data: {
        user1Id: user.id,
        user2Id: userId,
      },
    });

    res.status(201).json({
      status: "success",
      friendship,
    });
  } catch (error: any) {
    console.log(error.message);
    return next(new AppError(error.message, 500));
  }
};

export const acceptFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendshipId } = req.body;
    const { user } = req;
    if (!friendshipId) {
      return next(new AppError("Please provide all required fields", 400));
    }
    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendship) {
      return next(new AppError("No friendship found with this id", 404));
    }

    if (user.id !== friendship.user2Id) {
      return next(
        new AppError("This friendship request doesn't belong to this user", 400)
      );
    }
    const updateFriendship = await prisma.friendship.update({
      where: {
        id: friendshipId,
      },
      data: {
        status: "accepted",
      },
    });
    res.status(200).json({
      status: "Success",
      data: {
        updateFriendship,
      },
    });
  } catch (error: any) {
    console.log(error);
    next(new AppError(error.message, 500));
  }
};

export const rejectFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendshipId } = req.body;
    const { user } = req;
    if (!friendshipId) {
      return next(new AppError("Please provide all required fields", 400));
    }
    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendship) {
      return next(new AppError("No friendship found with this id", 404));
    }

    if (user.id !== friendship.user2Id) {
      return next(
        new AppError("This friendship request doesn't belong to this user", 400)
      );
    }
    const updatedFriendship = await prisma.friendship.update({
      where: {
        id: friendshipId,
      },
      data: {
        status: "rejected",
      },
    });
    res.status(200).json({
      status: "Success",
      data: {
        updatedFriendship,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};
