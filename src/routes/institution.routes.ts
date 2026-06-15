import { Router } from "express";
import { institutionController } from "../controllers/institution.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", institutionController.getAll.bind(institutionController));
router.post("/join", authMiddleware, institutionController.join.bind(institutionController));
router.get("/invite/:code", institutionController.getByInviteCode.bind(institutionController));
router.get("/:id", institutionController.getById.bind(institutionController));
router.post("/:id/invite", authMiddleware, institutionController.getInviteCode.bind(institutionController));
router.put("/:id/users/:userId/role", authMiddleware, institutionController.updateUserRole.bind(institutionController));
router.delete("/:id/users/:userId", authMiddleware, institutionController.removeUser.bind(institutionController));
router.post("/", authMiddleware, institutionController.create.bind(institutionController));
router.put("/:id", authMiddleware, institutionController.update.bind(institutionController));
router.delete("/:id", authMiddleware, institutionController.delete.bind(institutionController));

export default router;
