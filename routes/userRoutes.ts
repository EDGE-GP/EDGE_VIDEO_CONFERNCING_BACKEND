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
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendRequest,
  blockFriendRequest,
} from "../controllers/userController";

const router: Router = Router();

router.post("/register", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/validate", validate);
router.use(protect)
router.get("/logout", logout);
router.get("/search/:searchTerm", searchUsers);
// router.get("/", getAllUsers);
// router
//   .get("/:id", getOneUser)
//   .patch("/:id", updateUser)
//   .delete("/:id", deleteUser);
  
router.post("/friendship/request", createFriendshipRequest);
router.put("/friendship/accept", acceptFriendRequest);
router.put("/friendship/reject", rejectFriendRequest);
router.put("/friendship/delete", deleteFriendRequest);
router.post("/friendship/block", blockFriendRequest);
// router.delete

export default router;
