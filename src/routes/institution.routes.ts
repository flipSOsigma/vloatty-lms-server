import { Router } from "express";
import { institutionController } from "../controllers/institution.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Public
router.get("/", institutionController.getAll.bind(institutionController));
router.get("/invite/:code", institutionController.getByInviteCode.bind(institutionController));
router.get("/:id", institutionController.getById.bind(institutionController));

// Authenticated
router.post("/", authMiddleware, institutionController.create.bind(institutionController));
router.post("/join", authMiddleware, institutionController.join.bind(institutionController));
router.put("/:id", authMiddleware, institutionController.update.bind(institutionController));
router.delete("/:id", authMiddleware, institutionController.delete.bind(institutionController));

// Invite
router.post("/:id/invite", authMiddleware, institutionController.getInviteCode.bind(institutionController));

// Storage
router.get("/:id/storage", authMiddleware, institutionController.getStorage.bind(institutionController));

// Legacy user-role routes (kept for backward compat)
router.put("/:id/users/:userId/role", authMiddleware, institutionController.updateUserRole.bind(institutionController));
router.delete("/:id/users/:userId", authMiddleware, institutionController.removeUser.bind(institutionController));

// Member routes
router.get("/:id/members", institutionController.getMembers.bind(institutionController));
router.put("/:id/members/:userId/role", authMiddleware, institutionController.updateMemberRole.bind(institutionController));
router.delete("/:id/members/:userId", authMiddleware, institutionController.removeMember.bind(institutionController));

export default router;
