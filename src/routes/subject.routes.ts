import { Router } from "express";
import { subjectController } from "../controllers/subject.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, subjectController.getAll.bind(subjectController));
router.get("/:id", authMiddleware, subjectController.getById.bind(subjectController));
router.post("/", authMiddleware, subjectController.create.bind(subjectController));
router.post("/:id/join", authMiddleware, subjectController.join.bind(subjectController));
router.delete("/:id/participants/:userId", authMiddleware, subjectController.kickParticipant.bind(subjectController));
router.put("/:id", authMiddleware, subjectController.update.bind(subjectController));
router.delete("/:id", authMiddleware, subjectController.delete.bind(subjectController));

export default router;
