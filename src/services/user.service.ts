import prisma from "../config/prisma";

export class UserService {
  getProfile(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  updateProfile(id: string, data: { name?: string; institution?: string; avatar?: string }) {
    return prisma.user.update({ where: { id }, data });
  }

  getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        institution: true,
        premiumStatus: true,
        institutionId: true,
        institutionRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getDashboardStats(userId: string) {
    const userSubjects = await prisma.subject.findMany({
      where: { creatorId: userId, deletedAt: null },
      select: { id: true },
    });

    const subjectIds = userSubjects.map((s) => s.id);

    const files = await prisma.subjectFile.findMany({
      where: {
        subjectId: { in: subjectIds },
        deletedAt: null,
      },
      select: {
        sizeBytes: true,
        category: true,
      },
    });

    let materialsBytes = 0;
    let submissionsBytes = 0;
    let systemAssetsBytes = 0;

    files.forEach((file) => {
      if (file.category === "Attachment") {
        materialsBytes += file.sizeBytes;
      } else if (file.category === "Submission") {
        submissionsBytes += file.sizeBytes;
      } else {
        systemAssetsBytes += file.sizeBytes;
      }
    });

    const totalUsedBytes = materialsBytes + submissionsBytes + systemAssetsBytes;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const subjectsCount = await prisma.subject.count({
      where: {
        OR: [
          { creatorId: userId },
          { lecturers: { some: { userId } } }
        ],
        updatedAt: { gte: sevenDaysAgo },
        deletedAt: null
      }
    });

    const modulesCount = await prisma.module.count({
      where: {
        subject: {
          OR: [
            { creatorId: userId },
            { lecturers: { some: { userId } } }
          ]
        },
        updatedAt: { gte: sevenDaysAgo },
        deletedAt: null
      }
    });

    const lessonsCount = await prisma.lesson.count({
      where: {
        module: {
          subject: {
            OR: [
              { creatorId: userId },
              { lecturers: { some: { userId } } }
            ]
          }
        },
        updatedAt: { gte: sevenDaysAgo },
        deletedAt: null
      }
    });

    const totalActivity = subjectsCount + modulesCount + lessonsCount;

    return {
      storage: {
        usedBytes: totalUsedBytes,
        maxBytes: 200 * 1024 * 1024,
        materialsBytes,
        submissionsBytes,
        systemAssetsBytes,
      },
      weeklyActivity: {
        total: totalActivity,
        subjects: subjectsCount,
        modules: modulesCount,
        lessons: lessonsCount,
      },
    };
  }
}

export const userService = new UserService();
