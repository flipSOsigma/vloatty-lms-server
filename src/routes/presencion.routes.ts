import { Router } from "express";
import { presencionController } from "../controllers/presencion.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/lessons/:lessonId/presencion", authMiddleware, presencionController.getPresenceData.bind(presencionController));
router.post("/lessons/:lessonId/presencion", authMiddleware, presencionController.submitPresence.bind(presencionController));

export default router;
