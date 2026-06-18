import { Request, Response } from "express";
import { userService } from "../services/user.service";

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const user = await userService.getProfile(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      res.json(await userService.updateProfile(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      res.json(await userService.getAllUsers());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      res.json(await userService.getDashboardStats(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const userController = new UserController();
