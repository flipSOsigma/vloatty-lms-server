import prisma from "../config/prisma";

export class UserService {
  getProfile(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  updateProfile(id: string, data: { name?: string; institution?: string; avatar?: string; banner?: string | null }) {
    return prisma.user.update({ where: { id }, data });
  }

  async getUserFiles(userId: string) {
    const subjectFiles = await prisma.subjectFile.findMany({
      where: { uploadedById: userId, deletedAt: null },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const institutionFiles = await prisma.institutionFile.findMany({
      where: { uploadedById: userId, deletedAt: null },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      subjectFiles,
      institutionFiles
    };
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumStatus: true }
    });
    const status = user?.premiumStatus || "free";

    let maxBytes = 100 * 1024 * 1024; // 100MB default
    if (status === "pro" || status === "premium") {
      maxBytes = 500 * 1024 * 1024; // 500MB
    } else if (status === "max" || status === "professional") {
      maxBytes = 1024 * 1024 * 1024; // 1GB
    }

    // Fetch all files uploaded by this specific user to calculate their personal storage quota
    const files = await prisma.subjectFile.findMany({
      where: {
        uploadedById: userId,
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
          { lecturers: { some: { userId } } },
          { participants: { some: { userId } } }
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
            { lecturers: { some: { userId } } },
            { participants: { some: { userId } } }
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
              { lecturers: { some: { userId } } },
              { participants: { some: { userId } } }
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
        maxBytes,
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

  async verifyAndResetAiTokens(userId: string): Promise<{ allowed: boolean; balance: number; maxTokens: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumStatus: true, aiTokensBalance: true, aiTokensLastReset: true }
    });
    if (!user) {
      return { allowed: false, balance: 0, maxTokens: 5 };
    }

    const status = user.premiumStatus || "free";
    let maxTokens = 5;
    if (status === "pro" || status === "premium") {
      maxTokens = 50;
    } else if (status === "max" || status === "professional") {
      maxTokens = 200;
    }

    const now = new Date();
    const lastReset = new Date(user.aiTokensLastReset);

    let balance = user.aiTokensBalance;

    // Check if the calendar day (in UTC) has changed since the last reset
    const isNewDay = now.getUTCDate() !== lastReset.getUTCDate() ||
                     now.getUTCMonth() !== lastReset.getUTCMonth() ||
                     now.getUTCFullYear() !== lastReset.getUTCFullYear();

    if (isNewDay) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiTokensBalance: maxTokens,
          aiTokensLastReset: now,
        }
      });
      balance = maxTokens;
    }

    return {
      allowed: balance > 0,
      balance,
      maxTokens,
    };
  }

  async deductAiToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiTokensBalance: { decrement: 1 }
      }
    });
  }
}

export const userService = new UserService();
