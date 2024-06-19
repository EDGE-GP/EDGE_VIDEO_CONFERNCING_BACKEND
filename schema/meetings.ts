import { addHours, addMinutes, isAfter, parseISO } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";
import { z } from "zod";

export const scheduleMeetingSchema = z.object({
  title: z.string().min(1, { message: "cannot be empty" }),
  startTime: z
    .string()
    .datetime()
    .refine(
      (value) => {
        return isAfter(new Date(value), addMinutes(new Date(), 15));
      },
      {
        message: "must be at least 15 minutes from now",
      }
    ),
  activityFlag: z.string().length(7).startsWith("#"),
  participants: z.string().uuid().array(),
  language: z.enum(["English", "Arabic"]),
  enableAvatar: z.boolean(),
  enableInterpreter: z.boolean(),
  saveConversation: z.boolean(),
  privacyStatus: z.enum(["public", "private"]),
});
export const createInstantMeetingSchema = z.object({
  title: z.string().min(1, { message: "cannot be empty" }),
  activityFlag: z.string().length(7).startsWith("#"),
  participants: z.string().uuid().array(),
  language: z.enum(["English", "Arabic"]),
  enableAvatar: z.boolean(),
  enableInterpreter: z.boolean(),
  saveConversation: z.boolean(),
  privacyStatus: z.enum(["public", "private"]),
});

export const handleMeetingInvitationsSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  invitationId: z.string().uuid(),
});

export const joinMeetingSchema = z.object({
  conferenceId: z.string().length(14),
});

export const checkMeetingPasswordSchema = z.object({
  meetingId: z.string().length(14),
  password: z.string().min(1),
});
