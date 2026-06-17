import { Request, Response } from "express";
import { subjectService } from "../services/subject.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

export class SubjectController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await subjectService.getAll());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const subject = await subjectService.getById(req.params.id);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await subjectService.create(req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const existing = await prisma.subject.findFirst({
        where: { id: subjectId, deletedAt: null },
        include: { lecturers: true },
      });
      if (!existing) return res.status(404).json({ error: "Subject not found" });

      const isOwner = existing.creatorId === userId;
      const isLecturer = existing.lecturers.some((l) => l.userId === userId);

      if (!isOwner && !isLecturer) {
        return res.status(403).json({ error: "Only the subject creator or lecturer can update this subject." });
      }

      // Lecturers cannot change metadata fields
      if (isLecturer && !isOwner) {
        const restricted = ["name", "room", "thumbnail", "description", "isOpen", "category", "lecturers", "schedules", "institutionId", "createdBy", "creatorId", "deletedAt", "deletedBy"];
        restricted.forEach((field) => delete req.body[field]);
      }

      res.json(await subjectService.update(subjectId, req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const subject = await prisma.subject.findFirst({ where: { id: subjectId, deletedAt: null } });
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      if (subject.creatorId !== userId) {
        return res.status(403).json({ error: "Only the subject creator can delete this subject." });
      }

      await subjectService.delete(subjectId);
      res.json({ message: "Subject deleted successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const subject = await subjectService.joinSubject(req.params.id, userId);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async kickParticipant(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = req.params.userId;
      const ownerId = (req as AuthenticatedRequest).user?.id;

      const subject = await prisma.subject.findFirst({ where: { id: subjectId, creatorId: ownerId } });
      if (!subject) {
        return res.status(403).json({ error: "Only the subject creator can kick participants." });
      }

      await prisma.subjectParticipant.delete({
        where: { subjectId_userId: { subjectId, userId } },
      });
      res.json({ message: "Participant kicked successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const subjectController = new SubjectController();
