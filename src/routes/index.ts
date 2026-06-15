import { Router } from "express";
import authRoutes from "./auth.routes";
import subjectRoutes from "./subject.routes";
import eventRoutes from "./event.routes";
import userRoutes from "./user.routes";
import institutionRoutes from "./institution.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/subjects", subjectRoutes);
router.use("/events", eventRoutes);
router.use("/users", userRoutes);
router.use("/institutions", institutionRoutes);
router.use("/upload", uploadRoutes);

export default router;
