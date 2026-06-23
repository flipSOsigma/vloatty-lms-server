import { Request, Response } from "express";
import { aiService } from "../services/ai.service";

export class AiController {
  async generateModuleDescription(req: Request, res: Response) {
    try {
      const { title, subjectName, subjectDesc } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Module title is required" });
      }

      const description = await aiService.generateModuleDescription(
        title.trim(),
        subjectName,
        subjectDesc
      );

      res.json({ description });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async generateLessonDescription(req: Request, res: Response) {
    try {
      const { title, type, subjectName, subjectDesc } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Lesson title is required" });
      }

      const description = await aiService.generateLessonDescription(
        title.trim(),
        type || "learning",
        subjectName,
        subjectDesc
      );

      res.json({ description });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async generateQuiz(req: Request, res: Response) {
    try {
      const { lessonTitle, lessonDesc, subjectName, subjectDesc, questionCount, difficulty, language } = req.body;
      if (!lessonTitle || typeof lessonTitle !== "string" || !lessonTitle.trim()) {
        return res.status(400).json({ error: "Lesson title is required" });
      }

      const questions = await aiService.generateQuiz(
        lessonTitle.trim(),
        lessonDesc,
        subjectName,
        subjectDesc,
        parseInt(questionCount) || 5,
        difficulty || "medium",
        language || "English"
      );

      res.json({ questions });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}

export const aiController = new AiController();
