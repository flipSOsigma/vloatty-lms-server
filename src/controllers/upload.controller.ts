import { Request, Response } from "express";
import { UTApi } from "uploadthing/server";
import sharp from "sharp";

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

export class UploadController {
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const subjectId = (req.query.subjectId as string) || (req.body.subjectId as string);
      const institutionId = (req.query.institutionId as string) || (req.body.institutionId as string);

      let fileName = "";
      if (institutionId) {
        fileName = `institution-thumbnail-${institutionId}.webp`;
      } else {
        fileName = `subject-thumbnail-${subjectId || Math.random().toString(36).substring(2, 15)}.webp`;
      }

      let sharpImg = sharp(req.file.buffer);
      let quality = 80;
      let processedBuffer = await sharpImg.webp({ quality }).toBuffer();

      if (processedBuffer.length > 3 * 1024 * 1024) {
        processedBuffer = await sharpImg
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer();
      }

      while (processedBuffer.length > 3 * 1024 * 1024 && quality > 10) {
        quality -= 15;
        processedBuffer = await sharp(processedBuffer)
          .webp({ quality })
          .toBuffer();
      }

      const file = new File([processedBuffer], fileName, {
        type: "image/webp",
      });

      const response = await utapi.uploadFiles(file);
      let url = "";

      if (Array.isArray(response)) {
        if (response[0].error) {
          return res.status(500).json({ error: response[0].error.message });
        }
        url = response[0].data?.url || "";
      } else {
        if (response.error) {
          return res.status(500).json({ error: response.error.message });
        }
        url = response.data?.url || "";
      }

      res.status(200).json({ url });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const uploadController = new UploadController();
