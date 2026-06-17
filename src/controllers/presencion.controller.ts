import { Request, Response } from "express";
import { presencionService } from "../services/presencion.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

export class PresencionController {
  async getPresenceData(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { lessonId } = req.params;

      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        include: {
          module: {
            include: { subject: { include: { lecturers: true } } },
          },
        },
      });
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });

      const subject = lesson.module.subject;
      const isOwner = subject.creatorId === userId;
      const isLecturer = subject.lecturers.some((l) => l.userId === userId);

      if (isOwner || isLecturer) {
        const list = await presencionService.getLessonPresenceList(lessonId, subject.id);
        return res.json({ isInstructor: true, presenceList: list, openDate: lesson.openDate, closeDate: lesson.closeDate });
      }

      const isParticipant = await prisma.subjectParticipant.findUnique({
        where: { subjectId_userId: { subjectId: subject.id, userId } },
      });
      if (!isParticipant) {
        return res.status(403).json({ error: "You are not enrolled in this subject" });
      }

      const record = await presencionService.getStudentPresence(lessonId, userId);
      return res.json({ isInstructor: false, myPresence: record, openDate: lesson.openDate, closeDate: lesson.closeDate });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async submitPresence(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const record = await presencionService.submitPresence(req.params.lessonId, userId);
      res.status(201).json({ message: "Presence submitted successfully", presence: record });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  }
}

export const presencionController = new PresencionController();
