import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", eventController.getAll.bind(eventController));
router.get("/:id", eventController.getById.bind(eventController));
router.post("/", authMiddleware, eventController.create.bind(eventController));
router.delete("/:id", authMiddleware, eventController.delete.bind(eventController));

export default router;
