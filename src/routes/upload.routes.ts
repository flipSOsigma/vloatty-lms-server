import { Router } from "express";
import multer from "multer";
import { uploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware, upload.single("file"), uploadController.uploadFile.bind(uploadController));

export default router;
