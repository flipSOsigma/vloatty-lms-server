import { Request, Response } from "express";
import { eventService } from "../services/event.service";

export class EventController {
  async getAll(req: Request, res: Response) {
    try {
      const events = await eventService.getAll();
      res.json(events);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const event = await eventService.getById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const event = await eventService.create(req.body);
      res.status(201).json(event);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await eventService.delete(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const eventController = new EventController();
