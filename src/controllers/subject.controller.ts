import { Request, Response } from "express";
import { subjectService } from "../services/subject.service";

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
}

export const subjectController = new SubjectController();
