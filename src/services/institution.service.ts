import prisma from "../config/prisma";
import crypto from "crypto";

export class InstitutionService {
  async getAll() {
    return prisma.institution.findMany({
      where: { deletedAt: null },
      include: {
        users: true,
        subjects: true,
      },
    });
  }

  async getById(id: string) {
    return prisma.institution.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: true,
        subjects: true,
      },
    });
  }

  async create(data: { name: string; description?: string; subscriptionStatus?: string; thumbnail?: string }, creatorId?: string) {
    const inst = await prisma.institution.create({
      data: {
        name: data.name,
        description: data.description,
        subscriptionStatus: data.subscriptionStatus || "free",
        thumbnail: data.thumbnail,
      },
    });

    if (creatorId) {
      await prisma.user.update({
        where: { id: creatorId },
        data: {
          institutionId: inst.id,
          institutionRole: "owner",
          institution: inst.name,
        },
      });

      await prisma.institutionMember.create({
        data: {
          institutionId: inst.id,
          userId: creatorId,
          role: "owner",
        },
      });
    }

    return inst;
  }

  async update(id: string, data: { name?: string; description?: string; subscriptionStatus?: string; thumbnail?: string }) {
    return prisma.institution.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        subscriptionStatus: data.subscriptionStatus,
        thumbnail: data.thumbnail,
      },
    });
  }

  async delete(id: string) {
    return prisma.institution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getInviteCode(id: string) {
    let inst = await prisma.institution.findFirst({
      where: { id, deletedAt: null },
    });
    if (!inst) throw new Error("Institution not found");
    if (!inst.inviteCode) {
      const code = crypto.randomBytes(6).toString("hex").toUpperCase();
      inst = await prisma.institution.update({
        where: { id },
        data: { inviteCode: code },
      });
    }
    return inst.inviteCode;
  }

  async joinInstitution(inviteCode: string, userId: string) {
    const inst = await prisma.institution.findFirst({
      where: { inviteCode: inviteCode.toUpperCase(), deletedAt: null },
    });
    if (!inst) throw new Error("Invalid or expired invite code");

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        institutionId: inst.id,
        institutionRole: "lecturer",
        institution: inst.name,
      },
    });

    await prisma.institutionMember.upsert({
      where: { institutionId_userId: { institutionId: inst.id, userId } },
      update: { role: "lecturer" },
      create: { institutionId: inst.id, userId, role: "lecturer" },
    });

    return { user, institution: inst };
  }

  async updateUserRole(institutionId: string, userId: string, role: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, institutionId },
    });
    if (!user) throw new Error("User not found in this institution");
    if (user.institutionRole === "owner") throw new Error("Cannot change the role of the institution owner");

    return prisma.user.update({
      where: { id: userId },
      data: { institutionRole: role },
    });
  }

  async removeUser(institutionId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, institutionId },
    });
    if (!user) throw new Error("User not found in this institution");

    return prisma.user.update({
      where: { id: userId },
      data: {
        institutionId: null,
        institutionRole: null,
        institution: "",
      },
    });
  }

  async getByInviteCode(inviteCode: string) {
    return prisma.institution.findFirst({
      where: { inviteCode: inviteCode.toUpperCase(), deletedAt: null },
    });
  }

  async getMembers(institutionId: string) {
    return prisma.institutionMember.findMany({
      where: { institutionId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  }

  async upsertMember(institutionId: string, userId: string, role: string) {
    return prisma.institutionMember.upsert({
      where: { institutionId_userId: { institutionId, userId } },
      update: { role },
      create: { institutionId, userId, role },
    });
  }

  async updateMemberRole(institutionId: string, userId: string, role: string) {
    const member = await prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId, userId } },
    });
    if (!member) throw new Error("Member not found in this institution");
    if (member.role === "owner") throw new Error("Cannot change the role of the institution owner");

    return prisma.institutionMember.update({
      where: { institutionId_userId: { institutionId, userId } },
      data: { role },
    });
  }

  async removeMember(institutionId: string, userId: string) {
    const member = await prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId, userId } },
    });
    if (!member) throw new Error("Member not found in this institution");

    return prisma.institutionMember.delete({
      where: { institutionId_userId: { institutionId, userId } },
    });
  }

  async getStorageUsed(institutionId: string) {
    const [instFiles, subjFiles, submissions] = await Promise.all([
      prisma.institutionFile.findMany({
        where: { institutionId, deletedAt: null },
        select: { sizeBytes: true },
      }),
      prisma.subjectFile.findMany({
        where: {
          subject: { institutionId, deletedAt: null },
          deletedAt: null,
        },
        select: { sizeBytes: true },
      }),
      prisma.assignmentSubmission.findMany({
        where: {
          lesson: {
            deletedAt: null,
            module: {
              deletedAt: null,
              subject: { institutionId, deletedAt: null },
            },
          },
        },
        select: { fileSize: true },
      }),
    ]);

    const instTotal = instFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    const subjTotal = subjFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    const submissionsTotal = submissions.reduce((sum, s) => sum + s.fileSize, 0);

    return {
      usedBytes: instTotal + subjTotal + submissionsTotal,
      maxBytes: 200 * 1024 * 1024, // 200 MB
    };
  }
}

export const institutionService = new InstitutionService();
