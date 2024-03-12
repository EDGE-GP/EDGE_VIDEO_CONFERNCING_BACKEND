
import { Router } from "express";
const router: Router = Router();

import { createMeeting,getMeeting} from "../controllers/meetingController";

router.post("/", createMeeting);
router.get("/:id", getMeeting);

export default router;