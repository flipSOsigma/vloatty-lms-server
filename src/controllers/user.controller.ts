import { Request, Response } from "express";
import { userService } from "../services/user.service";

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const user = await userService.getProfile(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = await userService.updateProfile(req.params.id, req.body);
      res.json(user);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const userController = new UserController();
