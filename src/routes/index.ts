import { Router } from "express";
import authRoutes from "./auth.routes";
import subjectRoutes from "./subject.routes";
import eventRoutes from "./event.routes";
import userRoutes from "./user.routes";
import institutionRoutes from "./institution.routes";
import uploadRoutes from "./upload.routes";
import institutionFileRoutes from "./institutionFile.routes";
import subjectFileRoutes from "./subjectFile.routes";
import quizRoutes from "./quiz.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/subjects", subjectRoutes);
router.use("/subjects", subjectFileRoutes);
router.use("/events", eventRoutes);
router.use("/users", userRoutes);
router.use("/institutions", institutionRoutes);
router.use("/institutions", institutionFileRoutes);
router.use("/upload", uploadRoutes);
router.use("/", quizRoutes);

export default router;
