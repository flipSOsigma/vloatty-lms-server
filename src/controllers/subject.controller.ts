import { Request, Response } from "express";
import { subjectService } from "../services/subject.service";
import prisma from "../config/prisma";

export class SubjectController {
  async getAll(req: Request, res: Response) {
    try {
      const subjects = await subjectService.getAll();
      res.json(subjects);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const subject = await subjectService.getById(req.params.id);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const subject = await subjectService.create(req.body);
      res.status(201).json(subject);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const existingSubject = await prisma.subject.findFirst({
        where: { id: subjectId, deletedAt: null },
        include: {
          lecturers: {
            include: {
              user: true
            }
          }
        }
      });

      if (!existingSubject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const isOwner = existingSubject.creatorId === userId;
      const isLecturer = existingSubject.lecturers.some((l) => l.userId === userId);

      if (!isOwner && !isLecturer) {
        return res.status(403).json({ error: "Only the subject creator or lecturer can update this subject." });
      }

      if (isLecturer && !isOwner) {
        // Strip metadata fields so they cannot be updated by lecturers
        delete req.body.name;
        delete req.body.room;
        delete req.body.thumbnail;
        delete req.body.description;
        delete req.body.isOpen;
        delete req.body.category;
        delete req.body.lecturers;
        delete req.body.schedules;
        delete req.body.institutionId;
        delete req.body.createdBy;
        delete req.body.creatorId;
        delete req.body.deletedAt;
        delete req.body.deletedBy;
      }

      const subject = await subjectService.update(subjectId, req.body);
      res.json(subject);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, deletedAt: null }
      });

      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      if (subject.creatorId !== userId) {
        return res.status(403).json({ error: "Only the subject creator can delete this subject." });
      }

      await subjectService.delete(subjectId);
      res.json({ message: "Subject deleted successfully" });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const subject = await subjectService.joinSubject(req.params.id, userId);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async kickParticipant(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = req.params.userId;
      const ownerId = (req as any).user?.id;

      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, creatorId: ownerId }
      });
      if (!subject) {
        return res.status(403).json({ error: "Only the subject creator can kick participants." });
      }

      await prisma.subjectParticipant.delete({
        where: {
          subjectId_userId: {
            subjectId,
            userId
          }
        }
      });
      res.json({ message: "Participant kicked successfully" });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const subjectController = new SubjectController();
