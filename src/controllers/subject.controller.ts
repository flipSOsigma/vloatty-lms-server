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
      const subject = await subjectService.update(req.params.id, req.body);
      res.json(subject);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await subjectService.delete(req.params.id);
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
