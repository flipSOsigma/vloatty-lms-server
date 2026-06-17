import { Request, Response } from "express";
import { QuizService } from "../services/quiz.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

async function getSubjectForLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: { subject: { include: { lecturers: true } } },
      },
    },
  });
  return lesson ? lesson.module.subject : null;
}

function isInstructor(subject: { creatorId: string; lecturers: { userId: string }[] }, userId: string) {
  return subject.creatorId === userId || subject.lecturers.some((l) => l.userId === userId);
}

export class QuizController {
  static async getQuiz(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      const authReq = req as AuthenticatedRequest;
      let userAttempt = null;
      let canSeeAnswers = false;

      if (authReq.user?.id) {
        userAttempt = await prisma.quizAttempt.findFirst({
          where: { quizId: quiz.id, userId: authReq.user.id },
        });
        const subject = await getSubjectForLesson(lessonId);
        if (subject) canSeeAnswers = isInstructor(subject, authReq.user.id);
      }

      if (!canSeeAnswers) {
        const safeQuestions = quiz.questions.map(({ correctOption: _c, ...q }) => q);
        return res.json({ ...quiz, questions: safeQuestions, userAttempt });
      }

      return res.json({ ...quiz, userAttempt });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  static async saveQuiz(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { lessonId } = req.params;
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });

      const subject = await getSubjectForLesson(lessonId);
      if (!subject || !isInstructor(subject, userId)) {
        return res.status(403).json({ error: "Forbidden: Only lecturers can edit quizzes" });
      }

      res.json(await QuizService.upsertQuiz(lessonId, req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  static async submitAttempt(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { lessonId } = req.params;

      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      if (userId) {
        const existingAttempt = await prisma.quizAttempt.findFirst({
          where: { quizId: quiz.id, userId },
        });
        if (existingAttempt) {
          return res.status(400).json({ error: "You have already attempted this quiz." });
        }
      }

      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (lesson) {
        const now = new Date();
        if (now < new Date(lesson.openDate)) {
          return res.status(400).json({ error: "Quiz is not open yet." });
        }
        if (lesson.closeType === "restrict" && now > new Date(lesson.closeDate)) {
          return res.status(400).json({ error: "Quiz has closed. Submissions are no longer accepted." });
        }
      }

      const guestName = req.body.guestName as string | undefined;
      if (!userId) {
        if (!quiz.allowGuest) {
          return res.status(401).json({ error: "Guest attempts are not allowed for this quiz. Please log in." });
        }
        if (!guestName?.trim()) {
          return res.status(400).json({ error: "Guest name is required." });
        }
      }

      const submissionAnswers = req.body.answers as Record<string, number> || {};
      let score = 0;
      let totalPoints = 0;

      for (const question of quiz.questions) {
        const pts = question.points ?? 1;
        totalPoints += pts;
        if (Number(submissionAnswers[question.id]) === question.correctOption) {
          score += pts;
        }
      }

      const attempt = await QuizService.createAttempt(quiz.id, {
        userId,
        guestName: userId ? undefined : guestName!.trim(),
        score,
        totalPoints,
        answers: submissionAnswers,
      });

      const responseData: Record<string, unknown> = {
        attemptId: attempt.id,
        score,
        totalPoints,
        submittedAt: attempt.submittedAt,
      };

      if (quiz.allowViewGrade) {
        responseData.correctAnswers = Object.fromEntries(quiz.questions.map((q) => [q.id, q.correctOption]));
      }

      return res.status(201).json(responseData);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  static async getAttempts(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      const authReq = req as AuthenticatedRequest;
      let canView = quiz.showLeaderboard;

      if (authReq.user?.id) {
        const subject = await getSubjectForLesson(lessonId);
        if (subject && isInstructor(subject, authReq.user.id)) canView = true;
      }

      if (!canView) {
        return res.status(403).json({ error: "Leaderboard is disabled for this quiz." });
      }

      return res.json(await QuizService.getAttempts(quiz.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}
