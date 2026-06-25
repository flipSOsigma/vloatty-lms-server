import prisma from "../config/prisma";
import { MailService } from "./mail.service";

const SUBJECT_INCLUDE = {
  creator: { select: { name: true, email: true, avatar: true } },
  lecturers: { include: { user: { select: { name: true, email: true } } } },
  participants: { include: { user: { select: { name: true, email: true, avatar: true } } } },
  schedules: true,
  modules: {
    where: { deletedAt: null as null },
    include: { lessons: { where: { deletedAt: null as null } } },
  },
} as const;

function mapSubject(subject: Awaited<ReturnType<typeof prisma.subject.findFirst>> & {
  creator?: { name: string; email: string; avatar: string } | null;
  lecturers?: { userId: string; user?: { name: string; email: string } | null }[];
  participants?: { userId: string; user?: { name: string; email: string; avatar: string } | null }[];
}) {
  if (!subject) return null;
  const { creatorId, creator, lecturers, participants, ...rest } = subject;
  return {
    ...rest,
    createdBy: creatorId,
    creatorName: creator?.name ?? "",
    creatorEmail: creator?.email ?? "",
    creatorAvatar: creator?.avatar ?? "",
    lecturers: (lecturers ?? []).map((sl) => ({
      userId: sl.userId,
      name: sl.user?.name ?? "",
      email: sl.user?.email ?? "",
    })),
    participants: (participants ?? []).map((p) => ({
      userId: p.userId,
      name: p.user?.name ?? "",
      email: p.user?.email ?? "",
      avatar: p.user?.avatar ?? "",
    })),
  };
}

async function findOrCreateUser(email: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: name ?? normalizedEmail.split("@")[0],
      email: normalizedEmail,
      premiumStatus: "free",
      institution: "Vloatty University",
      avatar: "",
    },
  });
}

async function resolveLecturerIds(lecturers: { email?: string; name?: string }[]) {
  const ids: string[] = [];
  for (const lec of lecturers) {
    if (!lec.email) continue;
    const user = await findOrCreateUser(lec.email, lec.name);
    ids.push(user.id);
  }
  return ids;
}

export class SubjectService {
  async getAll() {
    const subjects = await prisma.subject.findMany({
      where: { deletedAt: null },
      include: SUBJECT_INCLUDE,
    });
    return subjects.map((s) => mapSubject(s as Parameters<typeof mapSubject>[0]));
  }

  async getById(id: string) {
    const subject = await prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: SUBJECT_INCLUDE,
    });
    return mapSubject(subject as Parameters<typeof mapSubject>[0]);
  }

  async create(data: {
    name: string;
    room?: string;
    thumbnail?: string;
    description?: string;
    isOpen?: boolean;
    category?: string;
    createdBy?: string;
    institutionId?: string;
    lecturers?: { email?: string; name?: string }[];
    schedules?: { day: string; startTime: string; endTime: string; room?: string }[];
    modules?: { title: string; desc?: string; date?: string }[];
  }) {
    const { lecturers, schedules, createdBy, modules, ...subjectData } = data;
    const lecturerIds = lecturers ? await resolveLecturerIds(lecturers) : [];

    const subject = await prisma.subject.create({
      data: {
        ...subjectData,
        creatorId: createdBy ?? "c9c15c47-469a-412f-8431-21568eaf35d4",
        lecturers: lecturerIds.length > 0
          ? { create: lecturerIds.map((userId) => ({ userId })) }
          : undefined,
        schedules: schedules
          ? { create: schedules.map((s) => ({ day: s.day, startTime: s.startTime, endTime: s.endTime, room: s.room })) }
          : undefined,
        modules: modules?.length
          ? { create: modules.map((m) => ({ title: m.title, desc: m.desc ?? "", date: m.date ? new Date(m.date) : new Date() })) }
          : undefined,
      },
      include: SUBJECT_INCLUDE,
    });
    return mapSubject(subject as Parameters<typeof mapSubject>[0]);
  }

  async update(id: string, data: {
    name?: string;
    room?: string;
    thumbnail?: string | null;
    description?: string;
    isOpen?: boolean;
    category?: string;
    createdBy?: string;
    deletedBy?: string;
    deletedAt?: Date | null;
    institutionId?: string | null;
    lecturers?: { email?: string; name?: string }[];
    schedules?: { day: string; startTime: string; endTime: string; room?: string }[];
    modules?: {
      id: string;
      title: string;
      desc?: string;
      date?: string;
      lessons?: {
        id: string;
        title: string;
        desc?: string;
        type?: string;
        homeworkFile?: string | null;
        openDate?: string;
        closeDate?: string;
        closeType?: string;
      }[];
    }[];
  }) {
    const { lecturers, schedules, createdBy, modules, ...fields } = data;
    const updateData: Record<string, any> = {};

    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.room !== undefined) updateData.room = fields.room;
    if (fields.thumbnail !== undefined) updateData.thumbnail = fields.thumbnail;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.isOpen !== undefined) updateData.isOpen = fields.isOpen;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.deletedBy !== undefined) updateData.deletedBy = fields.deletedBy;
    if (fields.deletedAt !== undefined) {
      updateData.deletedAt = fields.deletedAt ? new Date(fields.deletedAt as any) : null;
    }

    if (createdBy !== undefined) {
      updateData.creator = { connect: { id: createdBy } };
    }

    const typedFields = fields as Record<string, any>;
    if (typedFields.institutionId !== undefined) {
      if (typedFields.institutionId === null || typedFields.institutionId === "") {
        updateData.institution = { disconnect: true };
      } else {
        updateData.institution = { connect: { id: typedFields.institutionId } };
      }
    }

    const lecturerIds = lecturers ? await resolveLecturerIds(lecturers) : [];

    const subject = await prisma.$transaction(async (tx) => {
      if (lecturers) {
        await tx.subjectLecturer.deleteMany({ where: { subjectId: id } });
      }
      if (schedules) {
        await tx.subjectSchedule.deleteMany({ where: { subjectId: id } });
      }

      if (modules) {
        const dbModules = await tx.module.findMany({ where: { subjectId: id, deletedAt: null } });
        const incomingIds = new Set(modules.map((m) => m.id).filter(Boolean));
        const toSoftDelete = dbModules.filter((m) => !incomingIds.has(m.id));

        if (toSoftDelete.length > 0) {
          await tx.module.updateMany({
            where: { id: { in: toSoftDelete.map((m) => m.id) } },
            data: { deletedAt: new Date() },
          });
        }

        for (const m of modules) {
          const existingModule = m.id ? await tx.module.findFirst({ where: { id: m.id, deletedAt: null } }) : null;
          const isNewModule = !existingModule;

          const moduleData = {
            title: m.title,
            desc: m.desc ?? "",
            date: m.date ? new Date(m.date) : new Date(),
          };
          await tx.module.upsert({
            where: { id: m.id },
            update: moduleData,
            create: { id: m.id, ...moduleData, subjectId: id },
          });

          if (isNewModule) {
            // Send email notification to creator and all participants
            const subjInfo = await tx.subject.findUnique({
              where: { id },
              include: {
                creator: true,
                participants: { include: { user: true } }
              }
            });

            if (subjInfo) {
              // Notify creator
              if (subjInfo.creator?.email) {
                MailService.sendNewModuleNotification(
                  subjInfo.creator.email,
                  subjInfo.creator.name,
                  subjInfo.id,
                  subjInfo.name,
                  m.title,
                  m.desc
                ).catch(console.error);
              }

              // Notify all enrolled participants
              for (const p of subjInfo.participants || []) {
                if (p.user?.email) {
                  MailService.sendNewModuleNotification(
                    p.user.email,
                    p.user.name,
                    subjInfo.id,
                    subjInfo.name,
                    m.title,
                    m.desc
                  ).catch(console.error);
                }
              }
            }
          }

          if (m.lessons) {
            const dbLessons = await tx.lesson.findMany({ where: { moduleId: m.id, deletedAt: null } });
            const incomingLessonIds = new Set(m.lessons.map((l) => l.id).filter(Boolean));
            const lessonsToDelete = dbLessons.filter((l) => !incomingLessonIds.has(l.id));

            if (lessonsToDelete.length > 0) {
              await tx.lesson.updateMany({
                where: { id: { in: lessonsToDelete.map((l) => l.id) } },
                data: { deletedAt: new Date() },
              });
            }

            for (const l of m.lessons) {
              const existingLesson = l.id ? await tx.lesson.findFirst({ where: { id: l.id, deletedAt: null } }) : null;
              const isNew = !existingLesson;

              const lessonData = {
                title: l.title,
                desc: l.desc ?? "",
                type: l.type ?? "learning",
                homeworkFile: l.homeworkFile ?? null,
                openDate: l.openDate ? new Date(l.openDate) : new Date(),
                closeDate: l.closeDate ? new Date(l.closeDate) : new Date(),
                closeType: l.closeType ?? "open",
              };
              await tx.lesson.upsert({
                where: { id: l.id },
                update: lessonData,
                create: { id: l.id, ...lessonData, moduleId: m.id },
              });

              if (isNew) {
                // Send email notification to creator and all participants
                const subjInfo = await tx.subject.findUnique({
                  where: { id },
                  include: {
                    creator: true,
                    participants: { include: { user: true } }
                  }
                });

                if (subjInfo) {
                  // Notify creator
                  if (subjInfo.creator?.email) {
                    MailService.sendNewLessonNotification(
                      subjInfo.creator.email,
                      subjInfo.creator.name,
                      subjInfo.id,
                      subjInfo.name,
                      m.title,
                      l.title,
                      l.type ?? "learning"
                    ).catch(console.error);
                  }

                  // Notify all enrolled participants
                  for (const p of subjInfo.participants || []) {
                    if (p.user?.email) {
                      MailService.sendNewLessonNotification(
                        p.user.email,
                        p.user.name,
                        subjInfo.id,
                        subjInfo.name,
                        m.title,
                        l.title,
                        l.type ?? "learning"
                      ).catch(console.error);
                    }
                  }
                }
              }
            }
          }
        }
      }

      return tx.subject.update({
        where: { id },
        data: {
          ...updateData,
          lecturers: lecturerIds.length > 0
            ? { create: lecturerIds.map((userId) => ({ userId })) }
            : undefined,
          schedules: schedules
            ? { create: schedules.map((s) => ({ day: s.day, startTime: s.startTime, endTime: s.endTime, room: s.room })) }
            : undefined,
        },
        include: SUBJECT_INCLUDE,
      });
    });

    return mapSubject(subject as Parameters<typeof mapSubject>[0]);
  }

  delete(id: string) {
    return prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async joinSubject(subjectId: string, userId: string) {
    await prisma.subjectParticipant.upsert({
      where: { subjectId_userId: { subjectId, userId } },
      update: {},
      create: { subjectId, userId },
    });
    return this.getById(subjectId);
  }
}

export const subjectService = new SubjectService();
