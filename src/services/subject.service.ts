import prisma from "../config/prisma";
import { ISubject, ICreateSubjectInput, IUpdateSubjectInput } from "../interfaces/subject.interface";
import { ISubjectSchedule } from "../interfaces/subject-schedule.interface";
import { IModule } from "../interfaces/module.interface";

interface SubjectLecturerWithUser {
  userId: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface SubjectParticipantWithUser {
  userId: string;
  user?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

interface PrismaSubjectOutput {
  id: string;
  name: string;
  room: string | null;
  color: string | null;
  description: string | null;
  isOpen: boolean;
  category: string;
  creatorId: string;
  creator?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  lecturers?: SubjectLecturerWithUser[];
  schedules?: ISubjectSchedule[];
  modules?: IModule[];
  participants?: SubjectParticipantWithUser[];
}

export class SubjectService {
  private mapSubject(subject: PrismaSubjectOutput | null): ISubject | null {
    if (!subject) return null;
    const { lecturers, participants, creatorId, creator, ...rest } = subject;
    return {
      ...rest,
      createdBy: creatorId,
      creatorName: creator?.name || "",
      creatorEmail: creator?.email || "",
      creatorAvatar: creator?.avatar || "",
      lecturers: lecturers ? lecturers.map((sl) => ({
        userId: sl.userId,
        name: sl.user?.name || "",
        email: sl.user?.email || ""
      })) : [],
      participants: participants ? participants.map((p) => ({
        userId: p.userId,
        name: p.user?.name || "",
        email: p.user?.email || "",
        avatar: p.user?.avatar || ""
      })) : []
    };
  }

  async getAll(): Promise<ISubject[]> {
    const subjects = await prisma.subject.findMany({
      where: { deletedAt: null },
      include: {
        creator: true,
        lecturers: {
          include: {
            user: true
          }
        },
        participants: {
          include: {
            user: true
          }
        },
        schedules: true,
        modules: {
          where: { deletedAt: null },
          include: {
            lessons: { where: { deletedAt: null } }
          }
        }
      }
    });
    return subjects.map((s) => this.mapSubject(s as unknown as PrismaSubjectOutput) as ISubject);
  }

  async getById(id: string): Promise<ISubject | null> {
    const subject = await prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: true,
        lecturers: {
          include: {
            user: true
          }
        },
        participants: {
          include: {
            user: true
          }
        },
        schedules: true,
        modules: {
          where: { deletedAt: null },
          include: {
            lessons: { where: { deletedAt: null } }
          }
        }
      }
    });
    return this.mapSubject(subject as unknown as PrismaSubjectOutput);
  }

  async create(data: ICreateSubjectInput): Promise<ISubject | null> {
    const { lecturers, schedules, createdBy, modules, ...subjectData } = data as any;
    
    const resolvedLecturerIds: string[] = [];
    if (lecturers) {
      for (const lec of lecturers) {
        if (!lec.email) continue;
        
        let user = await prisma.user.findUnique({
          where: { email: lec.email.trim().toLowerCase() }
        });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: lec.name || lec.email.split("@")[0],
              email: lec.email.trim().toLowerCase(),
              premiumStatus: "free",
              institution: "Vloatty University",
              avatar: ""
            }
          });
        }
        resolvedLecturerIds.push(user.id);
      }
    }

    const subject = await prisma.subject.create({
      data: {
        ...subjectData,
        creatorId: createdBy || "c9c15c47-469a-412f-8431-21568eaf35d4",
        lecturers: resolvedLecturerIds.length > 0 ? {
          create: resolvedLecturerIds.map((userId) => ({
            userId
          }))
        } : undefined,
        schedules: schedules ? {
          create: schedules.map((s: any) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room
          }))
        } : undefined,
        modules: modules && modules.length > 0 ? {
          create: modules.map((m: any) => ({
            title: m.title,
            desc: m.desc || "",
            date: m.date ? new Date(m.date) : new Date()
          }))
        } : undefined
      },
      include: {
        creator: true,
        lecturers: {
          include: {
            user: true
          }
        },
        participants: {
          include: {
            user: true
          }
        },
        schedules: true,
        modules: {
          where: { deletedAt: null },
          include: {
            lessons: { where: { deletedAt: null } }
          }
        }
      }
    });
    return this.mapSubject(subject as unknown as PrismaSubjectOutput);
  }

  async update(id: string, data: IUpdateSubjectInput): Promise<ISubject | null> {
    const { name, room, color, description, isOpen, category, deletedBy, deletedAt, lecturers, schedules, createdBy, modules } = data as any;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (room !== undefined) updateData.room = room;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (category !== undefined) updateData.category = category;
    if (deletedBy !== undefined) updateData.deletedBy = deletedBy;
    if (deletedAt !== undefined) updateData.deletedAt = deletedAt;
    if (createdBy !== undefined) updateData.creatorId = createdBy;

    const resolvedLecturerIds: string[] = [];
    if (lecturers) {
      for (const lec of lecturers) {
        if (!lec.email) continue;

        let user = await prisma.user.findUnique({
          where: { email: lec.email.trim().toLowerCase() }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: lec.name || lec.email.split("@")[0],
              email: lec.email.trim().toLowerCase(),
              premiumStatus: "free",
              institution: "Vloatty University",
              avatar: ""
            }
          });
        }
        resolvedLecturerIds.push(user.id);
      }
    }

    const subject = await prisma.$transaction(async (tx) => {
      if (lecturers) {
        await tx.subjectLecturer.deleteMany({ where: { subjectId: id } });
      }
      if (schedules) {
        await tx.subjectSchedule.deleteMany({ where: { subjectId: id } });
      }

      if (modules) {
        for (const m of modules) {
          const moduleData = {
            title: m.title,
            desc: m.desc || "",
            date: m.date ? new Date(m.date) : new Date(),
          };

          await tx.module.upsert({
            where: { id: m.id },
            update: moduleData,
            create: {
              id: m.id,
              ...moduleData,
              subjectId: id,
            },
          });

          if (m.lessons) {
            for (const l of m.lessons) {
              const lessonData = {
                title: l.title,
                desc: l.desc || "",
                type: l.type || "learning",
                homeworkFile: l.homeworkFile || null,
                openDate: l.openDate ? new Date(l.openDate) : new Date(),
                closeDate: l.closeDate ? new Date(l.closeDate) : new Date(),
                closeType: l.closeType || "open",
              };

              await tx.lesson.upsert({
                where: { id: l.id },
                update: lessonData,
                create: {
                  id: l.id,
                  ...lessonData,
                  moduleId: m.id,
                },
              });
            }
          }
        }
      }

      const updated = await tx.subject.update({
        where: { id },
        data: {
          ...updateData,
          lecturers: resolvedLecturerIds.length > 0 ? {
            create: resolvedLecturerIds.map((userId) => ({
              userId
            }))
          } : undefined,
          schedules: schedules ? {
            create: schedules.map((s: any) => ({
              day: s.day,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room
            }))
          } : undefined
        },
        include: {
          creator: true,
          lecturers: {
            include: {
              user: true
            }
          },
          participants: {
            include: {
              user: true
            }
          },
          schedules: true,
          modules: {
            where: { deletedAt: null },
            include: {
              lessons: { where: { deletedAt: null } }
            }
          }
        }
      });
      return updated;
    });

    return this.mapSubject(subject as unknown as PrismaSubjectOutput);
  }

  async delete(id: string): Promise<ISubject> {
    const result = await prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return result as unknown as ISubject;
  }

  async joinSubject(subjectId: string, userId: string): Promise<ISubject | null> {
    const existing = await prisma.subjectParticipant.findUnique({
      where: {
        subjectId_userId: {
          subjectId,
          userId
        }
      }
    });
    if (!existing) {
      await prisma.subjectParticipant.create({
        data: {
          subjectId,
          userId
        }
      });
    }
    return this.getById(subjectId);
  }
}
export const subjectService = new SubjectService();
