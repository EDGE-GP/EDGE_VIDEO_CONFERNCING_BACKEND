import { addHours, addMinutes, isAfter, parseISO } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";
import { z } from "zod";

export const scheduleMeetingSchema = z.object({
  title: z.string().min(1, { message: "cannot be empty" }),
  description: z.string(),
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
});

export const handleMeetingInvitationsSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  invitationId: z.string().uuid(),
});
