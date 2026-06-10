import prisma from "../config/prisma";
import { IUser, IUpdateUserInput } from "../interfaces/user.interface";

export class UserService {
  async getProfile(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user as unknown as IUser | null;
  }

  async updateProfile(id: string, data: IUpdateUserInput): Promise<IUser> {
    const user = await prisma.user.update({
      where: { id },
      data
    });
    return user as unknown as IUser;
  }

  async getAllUsers(): Promise<IUser[]> {
    const users = await prisma.user.findMany();
    return users as unknown as IUser[];
  }
}

export const userService = new UserService();
