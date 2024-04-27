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
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
  searchUsers,
  createFriendshipRequest,
  deleteFriendRequest,
  handleFrienshipRequest,
  blockUser,
} from "../controllers/userController";
import { validateData } from "../middleware/validation";
import {
  blockUserSchema,
  createFriendshipRequestSchema,
  dedleteFriendshipRequestSchema,
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

// router.get("/", getAllUsers);
// router
//   .get("/:id", getOneUser)
//   .patch("/:id", updateUser)
//   .delete("/:id", deleteUser);
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
router.put(
  "/friendship/delete",
  validateData(dedleteFriendshipRequestSchema),
  deleteFriendRequest
);
router.post("/friendship/block", validateData(blockUserSchema), blockUser);
// router.delete

export default router;
