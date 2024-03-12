import AppError from "../utils/AppError";
import prisma from "../prisma";
import { Meeting } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

export const createMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { title, description, location, participants } = req.body;
        console.log(req.body);

        const meetingWithParticipants = await prisma.meeting.create({
            data: {
                title,
                description,
                location,
                participants: {
                    connect: participants.map((participantId: string) => ({ id: participantId })),
                },
            },
            include: {
                participants: true,
            },
        });

        res.status(201).json({
            status: "success",
            data: {
                meeting: meetingWithParticipants,
            },
        });

    } catch (error: any) {
        console.log(error.message);
        return next(new AppError("Internal server error", 500));

    }
};


export const getMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const meetingID = req.params.id;
        const meeting: Meeting | null = await prisma.meeting.findUnique({
            where: {
                id: meetingID
            },
            include: {
                participants: true
            }
          
        });  
    res.status(200).json({
        status: "success",
        data: {
            meeting
         
        }
    });
    } catch (error:any) {

        next(new AppError(error.message, 500));
    }
}

