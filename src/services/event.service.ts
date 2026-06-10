import prisma from "../config/prisma";
import { ILmsEvent, ICreateEventInput } from "../interfaces/event.interface";

export class EventService {
  async getAll(): Promise<ILmsEvent[]> {
    const events = await prisma.lmsEvent.findMany({
      where: { deletedAt: null }
    });
    return events as unknown as ILmsEvent[];
  }

  async getById(id: string): Promise<ILmsEvent | null> {
    const event = await prisma.lmsEvent.findFirst({
      where: { id, deletedAt: null }
    });
    return event as unknown as ILmsEvent | null;
  }

  async create(data: ICreateEventInput): Promise<ILmsEvent> {
    const event = await prisma.lmsEvent.create({
      data
    });
    return event as unknown as ILmsEvent;
  }

  async delete(id: string): Promise<ILmsEvent> {
    // Soft delete
    const event = await prisma.lmsEvent.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return event as unknown as ILmsEvent;
  }
}

export const eventService = new EventService();
