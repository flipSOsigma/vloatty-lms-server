import { Router } from "express";
import multer from "multer";
import { subjectFileController } from "../controllers/subjectFile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

router.get("/:id/lessons/:lessonId/files", authMiddleware, subjectFileController.getFiles.bind(subjectFileController));
router.post("/:id/lessons/:lessonId/files", authMiddleware, upload.single("file"), subjectFileController.uploadFile.bind(subjectFileController));
router.delete("/:id/files/:fileId", authMiddleware, subjectFileController.deleteFile.bind(subjectFileController));

export default router;
