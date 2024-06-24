import { Router } from "express";
const router: Router = Router();

import {
  scheduleMeeting,
  getMeeting,
  handleMeetingInvitation,
  fetchUserMeetingInvitations,
  fetchUserMeetings,
  joinMeeting,
  createInstantMeeting,
  checkMeetingPassword,
  pushMessage,
  fetchConversation,
  fetchMeetingsConversations,
  submitRating,
  getMeetingForRatings,
} from "../controllers/meetingController";
import { validateData } from "../middleware/validation";
import {
  createInstantMeetingSchema,
  handleMeetingInvitationsSchema,
  joinMeetingSchema,
  pushMessageSchema,
  scheduleMeetingSchema,
  submitRatingSchema,
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
router.post("/join", validateData(joinMeetingSchema), joinMeeting);
router.post(
  "/instant",
  validateData(createInstantMeetingSchema),
  createInstantMeeting
);
router.post("/check-password", checkMeetingPassword);
router.post("/push-message", validateData(pushMessageSchema), pushMessage);
router.get("/conversations", fetchMeetingsConversations);
router.get("/conversations/:id", fetchConversation);
router.get("/rate/:conferenceId", getMeetingForRatings);
router.post("/rate", validateData(submitRatingSchema), submitRating);

export default router;
