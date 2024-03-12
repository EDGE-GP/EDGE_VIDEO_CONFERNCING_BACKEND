
import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup,
  validate,
} from "../controllers/authController";

import { getAllUsers, getOneUser,updateUser,deleteUser,search } from "../controllers/userController";

const router: Router = Router();

router.post("/register", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/validate", validate);
router.get("/logout", logout);
router.get("/", getAllUsers);
router.get("/:id", getOneUser).patch("/:id", updateUser).delete("/:id", deleteUser);
router.post("/search", search);


export default router;
