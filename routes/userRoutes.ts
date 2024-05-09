import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  protect,
  resetPassword,
  signup,
  validate,
} from "../controllers/authController";

import {
  searchUsers,
  createFriendshipRequest,
  handleFrienshipRequest,
  blockUser,
  getUserFriendships,
  addFriendshipsSearch,
  deleteFriendship,
  getFriendshipRequests,
  getUserNotifications,
} from "../controllers/userController";
import { validateData } from "../middleware/validation";
import {
  blockUserSchema,
  createFriendshipRequestSchema,
  deleteFriendshipSchema,
  forgotPasswordSchema,
  handleFrienshipRequestSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "../schema/users";

const router: Router = Router();

router.post("/register", validateData(signupSchema), signup);
router.post("/login", validateData(loginSchema), login);
router.post(
  "/forgot-password",
  validateData(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password/:token",
  validateData(resetPasswordSchema),
  resetPassword
);
router.get("/validate", validate);
router.get("/logout", logout);

router.use(protect);
router.get("/friendships/", getUserFriendships);
router.get("/search/:searchTerm", searchUsers);
router.delete("/friendships/:friendshipId", deleteFriendship);
router.post("/friendships/block", validateData(blockUserSchema), blockUser);

router.post(
  "/friendships/requests",
  validateData(createFriendshipRequestSchema),
  createFriendshipRequest
);
router.get("/friendships/requests", getFriendshipRequests);
router.put(
  "/friendships/handle-requests",
  validateData(handleFrienshipRequestSchema),
  handleFrienshipRequest
);
router.get("/friendships/add/search/:searchTerm", addFriendshipsSearch);

router.get("/notifications", getUserNotifications);

export default router;
