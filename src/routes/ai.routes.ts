import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/generate-module-desc", authMiddleware, aiController.generateModuleDescription.bind(aiController));
router.post("/generate-lesson-desc", authMiddleware, aiController.generateLessonDescription.bind(aiController));
router.post("/generate-quiz", authMiddleware, aiController.generateQuiz.bind(aiController));

export default router;
