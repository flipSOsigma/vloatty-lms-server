import prisma from "../config/prisma";
import { deleteUploadthingFile } from "../config/uploadthing";

const DEFAULT_TYPES = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "zip"];

export class AssignmentService {
  async getSettings(lessonId: string, subjectId: string) {
    const [participants, existingSettings] = await Promise.all([
      prisma.subjectParticipant.findMany({
        where: { subjectId },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      prisma.assignmentSettings.findMany({ where: { lessonId } }),
    ]);

    const settingsMap = new Map(existingSettings.map((s) => [s.userId, s]));
    const firstRecord = existingSettings[0];

    const userPermissions = participants.map((p) => {
      const s = settingsMap.get(p.userId);
      return {
        userId: p.userId,
        user: p.user,
        allowedTypes: s ? s.allowedTypes : DEFAULT_TYPES,
        maxSizeMb: s ? s.maxSizeMb : 10,
        canSubmit: s ? s.canSubmit : true,
      };
    });

    return {
      globalSettings: {
        allowedTypes: firstRecord ? firstRecord.allowedTypes : DEFAULT_TYPES,
        maxSizeMb: firstRecord ? firstRecord.maxSizeMb : 10,
      },
      userPermissions,
    };
  }

  async saveSettings(
    lessonId: string,
    subjectId: string,
    allowedTypes: string[],
    maxSizeMb: number,
    userPermissions: { userId: string; canSubmit: boolean }[]
  ) {
    return prisma.$transaction(
      userPermissions.map((perm) =>
        prisma.assignmentSettings.upsert({
          where: { lessonId_userId: { lessonId, userId: perm.userId } },
          update: { allowedTypes, maxSizeMb, canSubmit: perm.canSubmit },
          create: { lessonId, userId: perm.userId, allowedTypes, maxSizeMb, canSubmit: perm.canSubmit },
        })
      )
    );
  }

  getSubmission(lessonId: string, userId: string) {
    return prisma.assignmentSubmission.findUnique({
      where: { lessonId_userId: { lessonId, userId } },
    });
  }

  getSubmissions(lessonId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { lessonId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { submittedAt: "desc" },
    });
  }

  submitAssignment(lessonId: string, userId: string, filePath: string, fileName: string, fileSize: number) {
    return prisma.assignmentSubmission.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      update: { filePath, fileName, fileSize, submittedAt: new Date() },
      create: { lessonId, userId, filePath, fileName, fileSize },
    });
  }

  async deleteSubmission(lessonId: string, userId: string) {
    const existing = await prisma.assignmentSubmission.findUnique({
      where: { lessonId_userId: { lessonId, userId } },
    });
    if (!existing) throw new Error("Submission not found");

    await deleteUploadthingFile(existing.filePath);

    return prisma.assignmentSubmission.delete({
      where: { lessonId_userId: { lessonId, userId } },
    });
  }
}

export const assignmentService = new AssignmentService();
