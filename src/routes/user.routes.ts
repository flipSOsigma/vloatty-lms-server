import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", userController.getAllUsers.bind(userController));
router.get("/:id/dashboard-stats", authMiddleware, userController.getDashboardStats.bind(userController));
router.get("/:id/ai-tokens", authMiddleware, userController.getAiTokens.bind(userController));
router.get("/:id", userController.getProfile.bind(userController));
router.put("/:id", userController.updateProfile.bind(userController));

export default router;
