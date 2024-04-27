import { addHours, addMinutes, isAfter, parseISO } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";
import { z } from "zod";

export const scheduleMeetingSchema = z
  .object({
    title: z.string().min(1, { message: "cannot be empty" }),
    description: z.string(),
    startTime: z.string().datetime(),
    timezoneOffset: z.number().int(),
    activityFlag: z.string().length(7).startsWith("#"),
    participants: z.string().uuid().array(),
  })
  .refine(
    (data) => {
      const inputDate = parseISO(data.startTime);
      const nowGMT2 = addHours(new Date(), data.timezoneOffset);

      console.log({
        inputDate,
        fifteenMinutesLater: addMinutes(nowGMT2, 15),
        timezoneOffset: data.timezoneOffset,
      });
      return isAfter(inputDate, addMinutes(nowGMT2, 15));
    },
    {
      message: "Start time must be 15 minutes from now",
    }
  );

export const handleMeetingInvitationsSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  invitationId: z.string().uuid(),
});
