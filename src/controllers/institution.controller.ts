import { Request, Response } from "express";
import { institutionService } from "../services/institution.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class InstitutionController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await institutionService.getAll());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const institution = await institutionService.getById(req.params.id);
      if (!institution) return res.status(404).json({ error: "Institution not found" });
      res.json(institution);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const creatorId = (req as AuthenticatedRequest).user?.id;
      res.status(201).json(await institutionService.create(req.body, creatorId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await institutionService.update(req.params.id, req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await institutionService.delete(req.params.id);
      res.json({ message: "Institution deleted successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getInviteCode(req: Request, res: Response) {
    try {
      const code = await institutionService.getInviteCode(req.params.id);
      res.json({ inviteCode: code });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const code = req.body.inviteCode || req.query.code;
      if (!code) return res.status(400).json({ error: "Invite code is required" });

      res.json(await institutionService.joinInstitution(String(code), userId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const role = req.body.role as string;
      if (!role) return res.status(400).json({ error: "Role is required" });
      res.json(await institutionService.updateUserRole(id, userId, role));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async removeUser(req: Request, res: Response) {
    try {
      res.json(await institutionService.removeUser(req.params.id, req.params.userId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getByInviteCode(req: Request, res: Response) {
    try {
      const inst = await institutionService.getByInviteCode(req.params.code);
      if (!inst) return res.status(404).json({ error: "Institution not found" });
      res.json(inst);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      res.json(await institutionService.getMembers(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const role = req.body.role as string;
      if (!role) return res.status(400).json({ error: "Role is required" });
      res.json(await institutionService.updateMemberRole(id, userId, role));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      res.json(await institutionService.removeMember(req.params.id, req.params.userId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getStorage(req: Request, res: Response) {
    try {
      res.json(await institutionService.getStorageUsed(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const institutionController = new InstitutionController();
