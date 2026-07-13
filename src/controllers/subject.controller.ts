import { Request, Response } from "express";
import { subjectService } from "../services/subject.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { MailService } from "../services/mail.service";

function getTierLimits(status: string) {
  let maxSubjects = 2;
  let maxModules = 5;
  let maxLessons = 2;
  
  if (status === "pro" || status === "premium") {
    maxSubjects = 12;
    maxModules = 10;
    maxLessons = 3;
  } else if (status === "max" || status === "professional") {
    maxSubjects = 25;
    maxModules = 20;
    maxLessons = 5;
  }
  
  return { maxSubjects, maxModules, maxLessons };
}

export class SubjectController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await subjectService.getAll());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const subject = await subjectService.getById(req.params.id);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, premiumStatus: true }
      });
      const status = user?.premiumStatus || "free";
      const { maxSubjects, maxModules, maxLessons } = getTierLimits(status);

      const createdSubjectsCount = await prisma.subject.count({
        where: { creatorId: userId, deletedAt: null }
      });

      if (createdSubjectsCount >= maxSubjects) {
        if (user) {
          MailService.sendLimitReachedNotification(
            user.email,
            user.name,
            "Subject Creation",
            maxSubjects,
            status
          ).catch(console.error);
        }
        return res.status(400).json({
          error: `Subject limit reached. You can create a maximum of ${maxSubjects} subjects on the ${status.toUpperCase()} tier.`
        });
      }

      if (req.body.modules) {
        if (req.body.modules.length > maxModules) {
          if (user) {
            MailService.sendLimitReachedNotification(
              user.email,
              user.name,
              "Modules per Subject",
              maxModules,
              status
            ).catch(console.error);
          }
          return res.status(400).json({
            error: `Module limit exceeded. Your tier allows a maximum of ${maxModules} modules per subject.`
          });
        }
        for (const m of req.body.modules) {
          if (m.lessons && m.lessons.length > maxLessons) {
            if (user) {
              MailService.sendLimitReachedNotification(
                user.email,
                user.name,
                `Lessons per Module ("${m.title}")`,
                maxLessons,
                status
              ).catch(console.error);
            }
            return res.status(400).json({
              error: `Lesson limit exceeded. Your tier allows a maximum of ${maxLessons} lessons per module (module: "${m.title}").`
            });
          }
        }
      }

      req.body.createdBy = userId;

      const record = await subjectService.create(req.body);

      // Trigger Subject Creation email
      if (user?.email && record) {
        MailService.sendNewSubjectNotification(
          user.email,
          user.name,
          record.id,
          record.name,
          record.room,
          record.category
        ).catch(console.error);
      }

      res.status(201).json(record);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const existing = await prisma.subject.findFirst({
        where: { id: subjectId, deletedAt: null },
        include: { lecturers: true },
      });
      if (!existing) return res.status(404).json({ error: "Subject not found" });

      const isOwner = existing.creatorId === userId;
      const isLecturer = existing.lecturers.some((l) => l.userId === userId);

      if (!isOwner && !isLecturer) {
        return res.status(403).json({ error: "Only the subject creator or lecturer can update this subject." });
      }

      const owner = await prisma.user.findUnique({
        where: { id: existing.creatorId },
        select: { email: true, name: true, premiumStatus: true }
      });
      const status = owner?.premiumStatus || "free";
      const { maxModules, maxLessons } = getTierLimits(status);

      if (req.body.modules) {
        if (req.body.modules.length > maxModules) {
          if (owner) {
            MailService.sendLimitReachedNotification(
              owner.email,
              owner.name,
              "Modules per Subject",
              maxModules,
              status
            ).catch(console.error);
          }
          return res.status(400).json({
            error: `Module limit exceeded. This subject allows a maximum of ${maxModules} modules based on the owner's ${status.toUpperCase()} tier.`
          });
        }
        for (const m of req.body.modules) {
          if (m.lessons && m.lessons.length > maxLessons) {
            if (owner) {
              MailService.sendLimitReachedNotification(
                owner.email,
                owner.name,
                `Lessons per Module ("${m.title}")`,
                maxLessons,
                status
              ).catch(console.error);
            }
            return res.status(400).json({
              error: `Lesson limit exceeded. This subject allows a maximum of ${maxLessons} lessons per module based on the owner's ${status.toUpperCase()} tier (module: "${m.title}").`
            });
          }
        }
      }

      // Lecturers cannot change metadata fields
      if (isLecturer && !isOwner) {
        const restricted = ["name", "room", "thumbnail", "description", "isOpen", "category", "lecturers", "schedules", "institutionId", "createdBy", "creatorId", "deletedAt", "deletedBy"];
        restricted.forEach((field) => delete req.body[field]);
      }

      res.json(await subjectService.update(subjectId, req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const subject = await prisma.subject.findFirst({ where: { id: subjectId, deletedAt: null } });
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      if (subject.creatorId !== userId) {
        return res.status(403).json({ error: "Only the subject creator can delete this subject." });
      }

      await subjectService.delete(subjectId);
      res.json({ message: "Subject deleted successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const subject = await subjectService.joinSubject(req.params.id, userId);
      if (!subject) return res.status(404).json({ error: "Subject not found" });
      res.json(subject);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async kickParticipant(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = req.params.userId;
      const ownerId = (req as AuthenticatedRequest).user?.id;

      const subject = await prisma.subject.findFirst({ where: { id: subjectId, creatorId: ownerId } });
      if (!subject) {
        return res.status(403).json({ error: "Only the subject creator can kick participants." });
      }

      await prisma.subjectParticipant.delete({
        where: { subjectId_userId: { subjectId, userId } },
      });
      res.json({ message: "Participant kicked successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async updateParticipantRole(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = req.params.userId;
      const { role } = req.body;
      const ownerId = (req as AuthenticatedRequest).user?.id;

      const subject = await prisma.subject.findFirst({ where: { id: subjectId, creatorId: ownerId } });
      if (!subject) {
        return res.status(403).json({ error: "Only the subject creator can modify roles." });
      }

      if (subject.creatorId === userId) {
        return res.status(400).json({ error: "Cannot change the role of the subject owner." });
      }

      const targetRole = role === "Student" ? "Participant" : role;

      if (targetRole === "Lecturer") {
        await prisma.$transaction([
          prisma.subjectParticipant.deleteMany({ where: { subjectId, userId } }),
          prisma.subjectLecturer.upsert({
            where: { subjectId_userId: { subjectId, userId } },
            update: {},
            create: { subjectId, userId },
          }),
        ]);
      } else if (targetRole === "Participant") {
        await prisma.$transaction([
          prisma.subjectLecturer.deleteMany({ where: { subjectId, userId } }),
          prisma.subjectParticipant.upsert({
            where: { subjectId_userId: { subjectId, userId } },
            update: {},
            create: { subjectId, userId },
          }),
        ]);
      } else {
        return res.status(400).json({ error: "Invalid role specified." });
      }

      res.json({ message: "Participant role updated successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async leave(req: Request, res: Response) {
    try {
      const subjectId = req.params.id;
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const result = await subjectService.leaveSubject(subjectId, userId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const subjectController = new SubjectController();
