import prisma from "../config/prisma";

export class PresencionService {
  async getStudentPresence(lessonId: string, userId: string) {
    const record = await prisma.presencion.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
    });
    return record;
  }

  async getLessonPresenceList(lessonId: string, subjectId: string) {
    // 1. Get all students enrolled in the subject
    const participants = await prisma.subjectParticipant.findMany({
      where: { subjectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // 2. Get all presence submissions for this lesson
    const presenceRecords = await prisma.presencion.findMany({
      where: { lessonId },
    });

    // 3. Map presence records to participants
    const presenceMap = new Map<string, Date>();
    for (const record of presenceRecords) {
      presenceMap.set(record.userId, record.createdAt);
    }

    return participants.map((p) => ({
      user: p.user,
      submitted: presenceMap.has(p.userId),
      submittedAt: presenceMap.get(p.userId) || null,
    }));
  }

  async submitPresence(lessonId: string, userId: string) {
    // 1. Find the lesson and make sure it exists
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        module: {
          select: { subjectId: true },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (lesson.type !== "presencion") {
      throw new Error("This lesson is not of type presence (presencion)");
    }

    // 2. Validate current time is within openDate and closeDate
    const now = new Date();
    const openDate = new Date(lesson.openDate);
    const closeDate = new Date(lesson.closeDate);

    if (now < openDate) {
      throw new Error("Attendance session has not started yet");
    }
    if (now > closeDate) {
      throw new Error("Attendance session has closed");
    }

    // 3. Verify user is enrolled in this subject
    const isEnrolled = await prisma.subjectParticipant.findUnique({
      where: {
        subjectId_userId: {
          subjectId: lesson.module.subjectId,
          userId,
        },
      },
    });

    if (!isEnrolled) {
      throw new Error("User is not enrolled in this subject");
    }

    // 4. Create presence record (prisma unique constraints will also catch duplicates)
    const existing = await prisma.presencion.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error("Presence already submitted");
    }

    return await prisma.presencion.create({
      data: {
        lessonId,
        userId,
      },
    });
  }
}

export const presencionService = new PresencionService();
