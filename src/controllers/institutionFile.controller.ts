import { Request, Response } from "express";
import { utapi, deleteUploadthingFile } from "../config/uploadthing";
import { institutionFileService } from "../services/institutionFile.service";
import { institutionService } from "../services/institution.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class InstitutionFileController {
  async getFiles(req: Request, res: Response) {
    try {
      res.json(await institutionFileService.getFiles(req.params.id));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const institutionId = req.params.id;
      const uploadedById = (req as AuthenticatedRequest).user!.id;
      const file = req.file;

      // Check storage limit before invoking UploadThing
      const storage = await institutionService.getStorageUsed(institutionId);
      if (storage.usedBytes + file.size > storage.maxBytes) {
        return res.status(400).json({
          error: `Storage limit exceeded. This file of ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds the institution storage quota of 200 MB.`
        });
      }

      const uploadable = new File([file.buffer], file.originalname, { type: file.mimetype });
      const [uploaded] = await utapi.uploadFiles([uploadable]);

      if (uploaded.error) {
        return res.status(500).json({ error: "Upload failed", detail: uploaded.error });
      }

      const category = typeof req.body.category === "string" ? req.body.category : "General";

      const record = await institutionFileService.createFile({
        name: file.originalname,
        url: uploaded.data.ufsUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        category,
        uploadedById,
        institutionId,
      });

      res.status(201).json(record);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { id: institutionId, fileId } = req.params;

      const existing = await institutionFileService.getFileById(fileId);
      if (!existing) return res.status(404).json({ error: "File not found" });

      await deleteUploadthingFile(existing.url);
      res.json(await institutionFileService.deleteFile(fileId, institutionId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async deleteFiles(req: Request, res: Response) {
    try {
      const { id: institutionId } = req.params;
      const fileIds = req.body.fileIds as string[];

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ error: "fileIds must be a non-empty array" });
      }

      const existing = await institutionFileService.getFilesByIds(fileIds, institutionId);
      await Promise.all(existing.map((f) => deleteUploadthingFile(f.url)));

      res.json(await institutionFileService.deleteFiles(fileIds, institutionId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const institutionFileController = new InstitutionFileController();
