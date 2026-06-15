import prisma from "../config/prisma";

interface CreateFileInput {
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  uploadedById: string;
  institutionId: string;
}

export class InstitutionFileService {
  async getFiles(institutionId: string) {
    return prisma.institutionFile.findMany({
      where: { institutionId, deletedAt: null },
      include: {
        uploadedBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createFile(data: CreateFileInput) {
    return prisma.institutionFile.create({ data });
  }

  async deleteFile(fileId: string, institutionId: string) {
    return prisma.institutionFile.update({
      where: { id: fileId, institutionId },
      data: { deletedAt: new Date() },
    });
  }

  async deleteFiles(fileIds: string[], institutionId: string) {
    return prisma.institutionFile.updateMany({
      where: { id: { in: fileIds }, institutionId },
      data: { deletedAt: new Date() },
    });
  }

  async getFileById(fileId: string) {
    return prisma.institutionFile.findFirst({
      where: { id: fileId, deletedAt: null },
    });
  }

  async getFilesByIds(fileIds: string[], institutionId: string) {
    return prisma.institutionFile.findMany({
      where: { id: { in: fileIds }, institutionId, deletedAt: null },
    });
  }
}

export const institutionFileService = new InstitutionFileService();
