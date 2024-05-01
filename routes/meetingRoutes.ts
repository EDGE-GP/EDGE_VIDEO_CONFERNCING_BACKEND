import { Router } from "express";
const router: Router = Router();

import {
  scheduleMeeting,
  getMeeting,
  handleMeetingInvitation,
  fetchUserMeetingInvitations,
  fetchUserMeetings,
} from "../controllers/meetingController";
import { validateData } from "../middleware/validation";
import {
  handleMeetingInvitationsSchema,
  scheduleMeetingSchema,
} from "../schema/meetings";
import { protect } from "../controllers/authController";

router.use(protect);
router.get("/", fetchUserMeetings);
router.post("/schedule", validateData(scheduleMeetingSchema), scheduleMeeting);
router.put(
  "/handle-invitation",
  validateData(handleMeetingInvitationsSchema),
  handleMeetingInvitation
);
router.get("/invitations", fetchUserMeetingInvitations);
router.get("/:id", getMeeting);

export default router;
