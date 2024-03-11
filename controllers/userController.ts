import AppError from "../utils/AppError";
import prisma from "../prisma";
import { User } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

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
  } catch (error:any) {
    next(new AppError(error.message, 500));
  }
};

export const getOneUser=async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    try{
        const user:User | null=await prisma.user.findUnique({
            where:{
                id:(req.params.id)
            }
        });
        if(!user)
        {
            return next(new AppError("No user found with that ID",404));
        }
        res.status(200).json({
            status:"success",
            data:{
                user
            }
        });
    }
    catch(error:any){
        next(new AppError(error.message,404));
    }
   
}
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
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
  export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
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
        "message":"User deleted successfully",
        data: null,
      });
    } catch (error: any) {
      next(new AppError(error.message, 404));
    }
  };