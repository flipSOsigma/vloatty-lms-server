import { Request, Response } from "express";
import { UTApi } from "uploadthing/server";
import { institutionFileService } from "../services/institutionFile.service";

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

function extractUploadthingKey(url: string): string {
  const segments = url.split("/");
  return segments[segments.length - 1];
}

async function deleteUploadthingFile(url: string): Promise<void> {
  const key = extractUploadthingKey(url);
  await utapi.deleteFiles([key]);
}

export class InstitutionFileController {
  async getFiles(req: Request, res: Response) {
    try {
      const files = await institutionFileService.getFiles(req.params.id);
      res.json(files);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async uploadFile(req: Request, res: Response) {
    try {
      const authedReq = req as AuthenticatedRequest;
      const institutionId = req.params.id;
      const uploadedById = authedReq.user.id;

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const file = req.file;
      const blob = new Blob([file.buffer], { type: file.mimetype });
      const uploadFile = new File([blob], file.originalname, {
        type: file.mimetype,
      });

      const response = await utapi.uploadFiles([uploadFile]);
      const uploaded = response[0];

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
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { id: institutionId, fileId } = req.params;

      const existing = await institutionFileService.getFileById(fileId);
      if (!existing) {
        return res.status(404).json({ error: "File not found" });
      }

      await deleteUploadthingFile(existing.url);
      const deleted = await institutionFileService.deleteFile(fileId, institutionId);
      res.json(deleted);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFiles(req: Request, res: Response) {
    try {
      const { id: institutionId } = req.params;
      const { fileIds } = req.body as { fileIds: string[] };

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ error: "fileIds must be a non-empty array" });
      }

      const existing = await institutionFileService.getFilesByIds(fileIds, institutionId);
      await Promise.all(existing.map((f) => deleteUploadthingFile(f.url)));

      const result = await institutionFileService.deleteFiles(fileIds, institutionId);
      res.json(result);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const institutionFileController = new InstitutionFileController();
