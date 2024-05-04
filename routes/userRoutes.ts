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
router.get("/search/:searchTerm", searchUsers);
router.post(
  "/friendship/request",
  validateData(createFriendshipRequestSchema),
  createFriendshipRequest
);
router.put(
  "/friendship/handle-requests",
  validateData(handleFrienshipRequestSchema),
  handleFrienshipRequest
);
router.delete("/friendship/:friendshipId", deleteFriendship);
router.post("/friendship/block", validateData(blockUserSchema), blockUser);
router.get("/friendships/", getUserFriendships);
router.get("/friendships/add/search/:searchTerm", addFriendshipsSearch);

export default router;
