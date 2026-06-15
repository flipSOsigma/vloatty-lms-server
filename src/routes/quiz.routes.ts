import { Router } from "express";
import { QuizController } from "../controllers/quiz.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/lessons/:lessonId/quiz", optionalAuthMiddleware, QuizController.getQuiz);
router.post("/lessons/:lessonId/quiz", authMiddleware, QuizController.saveQuiz);
router.post("/lessons/:lessonId/quiz/attempts", optionalAuthMiddleware, QuizController.submitAttempt);
router.get("/lessons/:lessonId/quiz/attempts", optionalAuthMiddleware, QuizController.getAttempts);

export default router;
