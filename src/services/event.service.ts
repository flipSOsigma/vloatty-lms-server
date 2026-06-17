import prisma from "../config/prisma";

export class EventService {
  getAll() {
    return prisma.lmsEvent.findMany({ where: { deletedAt: null } });
  }

  getById(id: string) {
    return prisma.lmsEvent.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: {
    title: string;
    subtitle?: string;
    timeStart: string;
    timeEnd: string;
    dayIndex: number;
    color: string;
    tagText?: string;
    tagType?: string;
    linkText?: string;
    linkUrl?: string;
    participantsInitials?: string;
    participantsCount?: number;
    status?: string;
    description?: string;
    image?: string;
    subjectId?: string;
  }) {
    return prisma.lmsEvent.create({ data });
  }

  delete(id: string) {
    return prisma.lmsEvent.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const eventService = new EventService();
