import prisma from "../config/prisma";

export class SubjectFileService {
  getFilesByLesson(subjectId: string, lessonId: string) {
    return prisma.subjectFile.findMany({
      where: { subjectId, lessonId, deletedAt: null },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createFile(data: {
    name: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    category: "Attachment" | "Submission";
    uploadedById: string;
    subjectId: string;
    lessonId: string;
  }) {
    return prisma.subjectFile.create({ data });
  }

  deleteFile(fileId: string, subjectId: string) {
    return prisma.subjectFile.update({
      where: { id: fileId, subjectId },
      data: { deletedAt: new Date() },
    });
  }

  getFileById(fileId: string) {
    return prisma.subjectFile.findFirst({ where: { id: fileId, deletedAt: null } });
  }

  getFilesByIds(fileIds: string[], subjectId: string) {
    return prisma.subjectFile.findMany({
      where: { id: { in: fileIds }, subjectId, deletedAt: null },
    });
  }
}

export const subjectFileService = new SubjectFileService();
