import { Request, Response } from "express";
import { utapi } from "../config/uploadthing";
import sharp from "sharp";

export class UploadController {
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const subjectId = (req.query.subjectId as string) || (req.body.subjectId as string);
      const institutionId = (req.query.institutionId as string) || (req.body.institutionId as string);
      const userId = (req.query.userId as string) || (req.body.userId as string);
      const uploadType = (req.query.type as string) || (req.body.type as string); // 'avatar' | 'banner'

      let fileName = `file-${Math.random().toString(36).slice(2, 15)}.webp`;
      if (institutionId) {
        fileName = `institution-thumbnail-${institutionId}.webp`;
      } else if (subjectId) {
        fileName = `subject-thumbnail-${subjectId || Math.random().toString(36).slice(2, 15)}.webp`;
      } else if (userId && uploadType) {
        fileName = `user-${uploadType}-${userId}-${Math.random().toString(36).slice(2, 6)}.webp`;
      }

      const img = sharp(req.file.buffer);
      let quality = 80;
      let buffer = await img.webp({ quality }).toBuffer();

      if (buffer.length > 3 * 1024 * 1024) {
        buffer = await img.resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
      }

      while (buffer.length > 3 * 1024 * 1024 && quality > 10) {
        quality -= 15;
        buffer = await sharp(buffer).webp({ quality }).toBuffer();
      }

      const file = new File([buffer], fileName, { type: "image/webp" });
      const response = await utapi.uploadFiles(file);

      const result = Array.isArray(response) ? response[0] : response;
      if (result.error) return res.status(500).json({ error: result.error.message });

      res.status(200).json({ url: result.data?.url ?? "" });
    } catch (e) {
      console.error("Upload error details:", e);
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const uploadController = new UploadController();
