import { Request, Response } from "express";
import { institutionService } from "../services/institution.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class InstitutionController {
  async getAll(req: Request, res: Response) {
    try {
      const institutions = await institutionService.getAll();
      res.json(institutions);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const institution = await institutionService.getById(req.params.id);
      if (!institution) return res.status(404).json({ error: "Institution not found" });
      res.json(institution);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const creatorId = (req as AuthenticatedRequest).user?.id;
      const institution = await institutionService.create(req.body, creatorId);
      res.status(201).json(institution);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const institution = await institutionService.update(req.params.id, req.body);
      res.json(institution);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await institutionService.delete(req.params.id);
      res.json({ message: "Institution deleted successfully" });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getInviteCode(req: Request, res: Response) {
    try {
      const code = await institutionService.getInviteCode(req.params.id);
      res.json({ inviteCode: code });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const code = req.body.inviteCode || req.query.code;
      if (!code) return res.status(400).json({ error: "Invite code is required" });

      const result = await institutionService.joinInstitution(code as string, userId);
      res.json(result);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const { role } = req.body as { role: string };
      if (!role) return res.status(400).json({ error: "Role is required" });

      const user = await institutionService.updateUserRole(id, userId, role);
      res.json(user);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async removeUser(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const user = await institutionService.removeUser(id, userId);
      res.json(user);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getByInviteCode(req: Request, res: Response) {
    try {
      const inst = await institutionService.getByInviteCode(req.params.code);
      if (!inst) return res.status(404).json({ error: "Institution not found" });
      res.json(inst);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const members = await institutionService.getMembers(req.params.id);
      res.json(members);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const { role } = req.body as { role: string };
      if (!role) return res.status(400).json({ error: "Role is required" });

      const member = await institutionService.updateMemberRole(id, userId, role);
      res.json(member);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const member = await institutionService.removeMember(id, userId);
      res.json(member);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const institutionController = new InstitutionController();
