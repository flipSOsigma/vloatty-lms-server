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
}

export const userService = new UserService();
