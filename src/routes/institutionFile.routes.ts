import { Router } from "express";
import multer from "multer";
import { institutionFileController } from "../controllers/institutionFile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

router.get("/:id/files", institutionFileController.getFiles.bind(institutionFileController));
router.post("/:id/files", authMiddleware, upload.single("file"), institutionFileController.uploadFile.bind(institutionFileController));
router.delete("/:id/files/:fileId", authMiddleware, institutionFileController.deleteFile.bind(institutionFileController));
router.delete("/:id/files", authMiddleware, institutionFileController.deleteFiles.bind(institutionFileController));

export default router;
