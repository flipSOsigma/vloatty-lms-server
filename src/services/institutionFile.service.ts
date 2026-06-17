import prisma from "../config/prisma";

export class InstitutionFileService {
  getFiles(institutionId: string) {
    return prisma.institutionFile.findMany({
      where: { institutionId, deletedAt: null },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createFile(data: {
    name: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    category: string;
    uploadedById: string;
    institutionId: string;
  }) {
    return prisma.institutionFile.create({ data });
  }

  deleteFile(fileId: string, institutionId: string) {
    return prisma.institutionFile.update({
      where: { id: fileId, institutionId },
      data: { deletedAt: new Date() },
    });
  }

  deleteFiles(fileIds: string[], institutionId: string) {
    return prisma.institutionFile.updateMany({
      where: { id: { in: fileIds }, institutionId },
      data: { deletedAt: new Date() },
    });
  }

  getFileById(fileId: string) {
    return prisma.institutionFile.findFirst({ where: { id: fileId, deletedAt: null } });
  }

  getFilesByIds(fileIds: string[], institutionId: string) {
    return prisma.institutionFile.findMany({
      where: { id: { in: fileIds }, institutionId, deletedAt: null },
    });
  }
}

export const institutionFileService = new InstitutionFileService();
