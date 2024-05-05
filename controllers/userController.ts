import AppError from "../utils/AppError";
import prisma from "../prisma";
import { User, Friendship } from "@prisma/client";
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
    const { user } = req;
    const { searchTerm } = req.params;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: "insensitive" } },
          { name: { contains: searchTerm, mode: "insensitive" } },
        ],
        NOT: {
          id: user.id,
        },
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
    if (userId === user.id) {
      return next(
        new AppError(
          "Friendships can't be send to the same user making the request",
          400
        )
      );
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

export const handleFrienshipRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendshipId, status } = req.body;
    const { user } = req;

    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
        user2Id: user.id,
      },
    });

    if (!friendship) {
      return next(
        new AppError(
          "No friendship found for this user with the provided id",
          404
        )
      );
    }

    if (friendship.status !== "pending") {
      return next(
        new AppError(
          "Can't preform this operation, friendship request has already been modified",
          400
        )
      );
    }
    if (status === "rejected") {
      await prisma.friendship.delete({
        where: {
          id: friendshipId,
        },
      });
      res.status(204).json({
        status: "Success",
        data: null,
      });
    } else {
      const updateFriendship = await prisma.friendship.update({
        where: {
          id: friendshipId,
        },
        data: {
          status,
        },
      });
      res.status(200).json({
        status: "Success",
        data: {
          updateFriendship,
        },
      });
    }
  } catch (error: any) {
    console.log(error);
    next(new AppError(error.message, 500));
  }
};

export const deleteFriendship = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendshipId } = req.params;
    const { user } = req;

    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendship) {
      return next(new AppError("No friendship found with this id", 404));
    }

    await prisma.friendship.delete({
      where: {
        id: friendshipId,
      },
    });

    res.status(204).json({
      status: "Success",
      data: null,
    });

    res.status(204).json({
      status: "Success",
      data: null,
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { blockedUserId } = req.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        blockedUsers: {
          connect: { id: blockedUserId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        blockedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
        blockedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });
    res.status(200).json({
      status: "Success",
      user: updatedUser,
    });
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getUserFriendships = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const searchTerm = req.query.searchTerm as string;
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            AND: [
              { status: "pending" },
              {
                user1Id: user.id,

                user2: {
                  OR: [
                    {
                      name: { contains: searchTerm || "", mode: "insensitive" },
                    },
                    {
                      email: {
                        contains: searchTerm || "",
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            ],
          },
          {
            OR: [
              {
                AND: [
                  {
                    status: "accepted",
                  },
                  {
                    user1Id: { equals: user.id },
                  },
                  {
                    user2: {
                      OR: [
                        {
                          name: {
                            contains: searchTerm || "",
                            mode: "insensitive",
                          },
                        },
                        {
                          email: {
                            contains: searchTerm || "",
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    status: "accepted",
                  },
                  {
                    user2Id: { equals: user.id },
                  },
                  {
                    user1: {
                      OR: [
                        {
                          name: {
                            contains: searchTerm || "",
                            mode: "insensitive",
                          },
                        },
                        {
                          email: {
                            contains: searchTerm || "",
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        user1Id: true,
        user2Id: true,
        user1: {
          select: {
            name: true,
            id: true,
            email: true,
            photo: true,
          },
        },
        user2: {
          select: {
            name: true,
            id: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "Success",
      length: friendships.length,
      data: {
        friendships: friendships.map((friendship) => {
          if (friendship.user1Id === user.id) {
            return {
              id: friendship.id,
              status: friendship.status,
              user: friendship.user2,
            };
          } else {
            return {
              id: friendship.id,
              status: friendship.status,
              user: friendship.user1,
            };
          }
        }),
      },
    });
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};

export const getFriendshipRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const searchTerm = req.query.searchTerm as string;
    const friendshipRequests = await prisma.friendship.findMany({
      where: {
        AND: [
          {
            user2Id: user.id,
          },
          {
            status: "pending",
          },
          {
            user1: {
              OR: [
                {
                  name: { contains: searchTerm || "", mode: "insensitive" },
                },
                {
                  email: { contains: searchTerm || "", mode: "insensitive" },
                },
              ],
            },
          },
        ],
      },
      select: {
        user1: {
          select: {
            name: true,
            email: true,
            id: true,
            photo: true,
          },
        },
        id: true,
        status: true,
      },
    });
    res.status(200).json({
      status: "success",
      data: {
        length: friendshipRequests.length,
        friendshipRequests: friendshipRequests.map((friendshipRequest) => {
          return {
            id: friendshipRequest.id,
            status: friendshipRequest.status,
            user: friendshipRequest.user1,
          };
        }),
      },
    });
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};

// export const searchUsersFriendships = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req;
//     const { searchTerm } = req.params;
//     const friendships = await prisma.friendship.findMany({
//       where: {
//         OR: [
//           {
//             AND: [
//               { status: "pending" },
//               {
//                 user1Id: user.id,
//                 user2: {
//                   OR: [
//                     { name: { contains: searchTerm, mode: "insensitive" } },
//                     { email: { contains: searchTerm, mode: "insensitive" } },
//                   ],
//                 },
//               },
//             ],
//           },
//           {
//             AND: [
//               {
//                 status: "accepted",
//               },
//               {
//                 OR: [
//                   {
//                     user1Id: { equals: user.id },
//                   },
//                   {
//                     user2Id: { equals: user.id },
//                   },
//                 ],
//               },
//               {
//                 OR: [
//                   {
//                     user1: {
//                       OR: [
//                         {
//                           name: { contains: searchTerm, mode: "insensitive" },
//                         },
//                         {
//                           email: { contains: searchTerm, mode: "insensitive" },
//                         },
//                       ],
//                     },
//                   },
//                   {
//                     user2: {
//                       OR: [
//                         { name: { contains: searchTerm, mode: "insensitive" } },
//                         {
//                           email: { contains: searchTerm, mode: "insensitive" },
//                         },
//                       ],
//                     },
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       select: {
//         id: true,
//         status: true,
//         user1Id: true,
//         user2Id: true,
//         user1: {
//           select: {
//             name: true,
//             id: true,
//             email: true,
//             photo: true,
//           },
//         },
//         user2: {
//           select: {
//             name: true,
//             id: true,
//             email: true,
//             photo: true,
//           },
//         },
//       },
//     });
//     res.status(200).json({
//       status: "Success",
//       length: friendships.length,
//       data: {
//         friendships: friendships.map((friendship) => {
//           if (friendship.user1Id === user.id) {
//             return {
//               id: friendship.id,
//               status: friendship.status,
//               user: friendship.user2,
//             };
//           } else {
//             return {
//               id: friendship.id,
//               status: friendship.status,
//               user: friendship.user1,
//             };
//           }
//         }),
//       },
//     });
//   } catch (err: any) {
//     next(new AppError(err.message, 500));
//   }
// };

export const addFriendshipsSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { searchTerm } = req.params;
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: searchTerm, mode: "insensitive" } },
              { name: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          {
            NOT: {
              OR: [
                { blockedBy: { some: { id: user.id } } },
                { blockedUsers: { some: { id: user.id } } },
                { friendsOf: { some: { user2Id: user.id } } },
                { friendsTo: { some: { user1Id: user.id } } },
                { id: user.id },
              ],
            },
          },
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
      status: "Success",
      data: {
        users,
      },
    });
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};
