import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

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
      const authId = (req as AuthenticatedRequest).user?.id;
      if (!authId || authId !== req.params.id) {
        return res.status(403).json({ error: "Access denied. You can only update your own profile." });
      }
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
      const authId = (req as AuthenticatedRequest).user?.id;
      if (!authId || authId !== req.params.id) {
        return res.status(403).json({ error: "Access denied." });
      }
      res.json(await userService.getDashboardStats(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getAiTokens(req: Request, res: Response) {
    try {
      const authId = (req as AuthenticatedRequest).user?.id;
      if (!authId || authId !== req.params.id) {
        return res.status(403).json({ error: "Access denied." });
      }
      res.json(await userService.verifyAndResetAiTokens(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getUserFiles(req: Request, res: Response) {
    try {
      const authId = (req as AuthenticatedRequest).user?.id;
      if (!authId || authId !== req.params.id) {
        return res.status(403).json({ error: "Access denied." });
      }
      res.json(await userService.getUserFiles(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const userController = new UserController();
