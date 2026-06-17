import { Router } from "express";
import multer from "multer";
import { assignmentController } from "../controllers/assignment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/lessons/:lessonId/assignment/settings", authMiddleware, assignmentController.getSettings.bind(assignmentController));
router.post("/lessons/:lessonId/assignment/settings", authMiddleware, assignmentController.saveSettings.bind(assignmentController));
router.get("/lessons/:lessonId/assignment/my-submission", authMiddleware, assignmentController.getMySubmission.bind(assignmentController));
router.get("/lessons/:lessonId/assignment/submissions", authMiddleware, assignmentController.getSubmissions.bind(assignmentController));
router.post("/lessons/:lessonId/assignment/submit", authMiddleware, upload.single("file"), assignmentController.submitAssignment.bind(assignmentController));
router.delete("/lessons/:lessonId/assignment/submit", authMiddleware, assignmentController.deleteSubmission.bind(assignmentController));

export default router;

