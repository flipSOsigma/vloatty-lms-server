import { Request, Response } from "express";
import { assignmentService } from "../services/assignment.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { utapi } from "../config/uploadthing";
import prisma from "../config/prisma";

async function getInstructorAccess(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    include: { module: { select: { subjectId: true } } },
  });
  if (!lesson) return null;

  const subject = await prisma.subject.findFirst({
    where: { id: lesson.module.subjectId, deletedAt: null },
    include: { lecturers: true },
  });
  if (!subject) return null;

  const isOwner = subject.creatorId === userId;
  const isLecturer = subject.lecturers.some((l) => l.userId === userId);
  return { lesson, subject, isInstructor: isOwner || isLecturer };
}

export class AssignmentController {
  async getSettings(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        include: { module: { select: { subjectId: true } } },
      });
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });

      res.json(await assignmentService.getSettings(lessonId, lesson.module.subjectId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async saveSettings(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { lessonId } = req.params;
      const { allowedTypes, maxSizeMb, userPermissions } = req.body;

      const access = await getInstructorAccess(lessonId, userId);
      if (!access) return res.status(404).json({ error: "Lesson or subject not found" });
      if (!access.isInstructor) {
        return res.status(403).json({ error: "Access denied. Only instructors can manage assignment settings." });
      }

      const saved = await assignmentService.saveSettings(
        lessonId,
        access.subject.id,
        allowedTypes ?? ["pdf", "doc", "docx", "png", "jpg", "jpeg", "zip"],
        maxSizeMb ?? 10,
        userPermissions ?? []
      );
      res.json({ message: "Assignment settings updated successfully", settings: saved });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getMySubmission(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      res.json((await assignmentService.getSubmission(req.params.lessonId, userId)) ?? null);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getSubmissions(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { lessonId } = req.params;

      const access = await getInstructorAccess(lessonId, userId);
      if (!access) return res.status(404).json({ error: "Lesson or subject not found" });
      if (!access.isInstructor) {
        return res.status(403).json({ error: "Access denied. Only instructors can view submissions." });
      }

      res.json(await assignmentService.getSubmissions(lessonId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async submitAssignment(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { lessonId } = req.params;

      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const file = req.file;
      const settings = await prisma.assignmentSettings.findUnique({
        where: { lessonId_userId: { lessonId, userId } },
      });

      const allowedTypes = settings?.allowedTypes ?? ["pdf", "doc", "docx", "png", "jpg", "jpeg", "zip"];
      const maxSizeMb = settings?.maxSizeMb ?? 10;
      const canSubmit = settings?.canSubmit ?? true;

      if (!canSubmit) {
        return res.status(403).json({ error: "You do not have permission to submit this assignment. Please contact your instructor." });
      }

      const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
      if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
        return res.status(400).json({ error: `File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(", ")}` });
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        return res.status(400).json({ error: `File size (${sizeMb.toFixed(2)}MB) exceeds the maximum allowed size of ${maxSizeMb}MB.` });
      }

      // Delete previous submission from UploadThing if it exists
      const existing = await prisma.assignmentSubmission.findUnique({
        where: { lessonId_userId: { lessonId, userId } },
      });

      const uploadable = new File([file.buffer], file.originalname, { type: file.mimetype });
      const [uploaded] = await utapi.uploadFiles([uploadable]);

      if (uploaded.error) {
        return res.status(500).json({ error: "Upload failed", detail: uploaded.error });
      }

      if (existing) {
        const key = existing.filePath.split("/").pop()!;
        utapi.deleteFiles([key]).catch((err) => console.error("Failed to delete old submission:", err));
      }

      res.status(201).json(
        await assignmentService.submitAssignment(lessonId, userId, uploaded.data.ufsUrl, file.originalname, file.size)
      );
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async deleteSubmission(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { lessonId } = req.params;
      const targetUserId = req.query.userId ? String(req.query.userId) : userId;

      if (targetUserId !== userId) {
        const access = await getInstructorAccess(lessonId, userId);
        if (!access) return res.status(404).json({ error: "Lesson not found" });
        if (!access.isInstructor) {
          return res.status(403).json({ error: "Access denied. Only instructors can delete student submissions." });
        }
      }

      const deleted = await assignmentService.deleteSubmission(lessonId, targetUserId);
      res.json({ message: "Submission deleted successfully", submission: deleted });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  }
}

export const assignmentController = new AssignmentController();
