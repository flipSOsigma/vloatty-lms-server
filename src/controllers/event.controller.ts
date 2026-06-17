import { Request, Response } from "express";
import { eventService } from "../services/event.service";

export class EventController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await eventService.getAll());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const event = await eventService.getById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await eventService.create(req.body));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await eventService.delete(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const eventController = new EventController();
