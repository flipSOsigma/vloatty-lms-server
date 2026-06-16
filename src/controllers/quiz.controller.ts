import { Request, Response } from "express";
import { QuizService } from "../services/quiz.service";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class QuizController {
  static async getQuiz(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check for past attempts by the logged in user
      let userAttempt = null;
      let isLecturerOrCreator = false;
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.id) {
        userAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId: quiz.id,
            userId: authReq.user.id
          }
        });

        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            module: {
              include: {
                subject: {
                  include: {
                    lecturers: true
                  }
                }
              }
            }
          }
        });

        if (lesson) {
          const subject = lesson.module.subject;
          const isCreator = subject.creatorId === authReq.user?.id;
          const isLecturer = subject.lecturers.some((l) => l.userId === authReq.user?.id);
          isLecturerOrCreator = isCreator || isLecturer;
        }
      }

      if (!isLecturerOrCreator) {
        // Hide correct option index for students/guests
        const safeQuestions = quiz.questions.map((q) => {
          const { correctOption, ...safeQ } = q;
          return safeQ;
        });
        return res.json({ ...quiz, questions: safeQuestions, userAttempt });
      }

      return res.json({ ...quiz, userAttempt });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  static async saveQuiz(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate edit permission
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              subject: {
                include: {
                  lecturers: true
                }
              }
            }
          }
        }
      });

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      const subject = lesson.module.subject;
      const isCreator = subject.creatorId === userId;
      const isLecturer = subject.lecturers.some((l) => l.userId === userId);
      if (!isCreator && !isLecturer) {
        return res.status(403).json({ error: "Forbidden: Only lecturers can edit quizzes" });
      }

      const quiz = await QuizService.upsertQuiz(lessonId, req.body);
      return res.json(quiz);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  static async submitAttempt(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id; // Optional for guests

      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Prevent multiple attempts for logged in users
      if (userId) {
        const existingAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId: quiz.id,
            userId: userId
          }
        });
        if (existingAttempt) {
          return res.status(400).json({ error: "You have already attempted this quiz." });
        }
      }

      // Check availability window
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId }
      });

      if (lesson) {
        const now = new Date();
        if (now < new Date(lesson.openDate)) {
          return res.status(400).json({ error: "Quiz is not open yet." });
        }
        if (lesson.closeType === "restrict" && now > new Date(lesson.closeDate)) {
          return res.status(400).json({ error: "Quiz has closed. Submissions are no longer accepted." });
        }
      }

      // Guest check
      const guestName = req.body.guestName;
      if (!userId) {
        if (!quiz.allowGuest) {
          return res.status(401).json({ error: "Guest attempts are not allowed for this quiz. Please log in." });
        }
        if (!guestName || !guestName.trim()) {
          return res.status(400).json({ error: "Guest name is required." });
        }
      }

      // Calculate score on the server
      let score = 0;
      let totalPoints = 0;
      const submissionAnswers = req.body.answers || {};

      for (const question of quiz.questions) {
        const questionPoints = question.points ?? 1;
        totalPoints += questionPoints;

        const submittedAnswer = submissionAnswers[question.id];
        if (submittedAnswer !== undefined && Number(submittedAnswer) === question.correctOption) {
          score += questionPoints;
        }
      }

      const attempt = await QuizService.createAttempt(quiz.id, {
        userId,
        guestName: userId ? undefined : guestName.trim(),
        score,
        totalPoints,
        answers: submissionAnswers
      });

      const responseData: any = {
        attemptId: attempt.id,
        score,
        totalPoints,
        submittedAt: attempt.submittedAt
      };

      if (quiz.allowViewGrade) {
        responseData.correctAnswers = quiz.questions.reduce((acc: any, q) => {
          acc[q.id] = q.correctOption;
          return acc;
        }, {});
      }

      return res.status(201).json(responseData);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  static async getAttempts(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const quiz = await QuizService.getQuizByLessonId(lessonId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check edit permissions
      let isLecturerOrCreator = false;
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.id) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            module: {
              include: {
                subject: {
                  include: {
                    lecturers: true
                  }
                }
              }
            }
          }
        });

        if (lesson) {
          const subject = lesson.module.subject;
          const isCreator = subject.creatorId === authReq.user?.id;
          const isLecturer = subject.lecturers.some((l) => l.userId === authReq.user?.id);
          isLecturerOrCreator = isCreator || isLecturer;
        }
      }

      if (!quiz.showLeaderboard && !isLecturerOrCreator) {
        return res.status(403).json({ error: "Leaderboard is disabled for this quiz." });
      }

      const attempts = await QuizService.getAttempts(quiz.id);
      return res.json(attempts);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}
