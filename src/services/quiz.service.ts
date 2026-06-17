import prisma from "../config/prisma";

export class QuizService {
  static getQuizByLessonId(lessonId: string) {
    return prisma.quiz.findUnique({
      where: { lessonId },
      include: { questions: { orderBy: { createdAt: "asc" } } },
    });
  }

  static async upsertQuiz(
    lessonId: string,
    data: {
      allowViewGrade: boolean;
      showLeaderboard: boolean;
      allowGuest: boolean;
      questions: {
        id?: string;
        questionText: string;
        options: string[];
        correctOption: number;
        points?: number;
      }[];
    }
  ) {
    const quiz = await prisma.quiz.upsert({
      where: { lessonId },
      update: {
        allowViewGrade: data.allowViewGrade,
        showLeaderboard: data.showLeaderboard,
        allowGuest: data.allowGuest,
      },
      create: {
        lessonId,
        allowViewGrade: data.allowViewGrade,
        showLeaderboard: data.showLeaderboard,
        allowGuest: data.allowGuest,
      },
    });

    await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    if (data.questions.length > 0) {
      await prisma.quizQuestion.createMany({
        data: data.questions.map((q) => ({
          quizId: quiz.id,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          points: q.points ?? 1,
        })),
      });
    }

    return QuizService.getQuizByLessonId(lessonId);
  }

  static createAttempt(
    quizId: string,
    data: {
      userId?: string;
      guestName?: string;
      score: number;
      totalPoints: number;
      answers: Record<string, number>;
    }
  ) {
    return prisma.quizAttempt.create({
      data: {
        quizId,
        userId: data.userId ?? null,
        guestName: data.guestName ?? null,
        score: data.score,
        totalPoints: data.totalPoints,
        answers: data.answers,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  static getAttempts(quizId: string) {
    return prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { score: "desc" },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }
}
