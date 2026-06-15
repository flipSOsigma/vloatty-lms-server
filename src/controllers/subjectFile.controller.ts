import { Request, Response } from "express";
import { UTApi } from "uploadthing/server";
import { subjectFileService } from "../services/subjectFile.service";
import { subjectService } from "../services/subject.service";

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
  try {
    await utapi.deleteFiles([key]);
  } catch (err) {
    console.error("Failed to delete file from UploadThing:", err);
  }
}

export class SubjectFileController {
  async getFiles(req: Request, res: Response) {
    try {
      const authedReq = req as AuthenticatedRequest;
      const { id: subjectId, lessonId } = req.params;
      const userId = authedReq.user.id;

      const subject = await subjectService.getById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const isCreator = subject.createdBy === userId;
      const isLecturer = subject.lecturers?.some((l) => l.userId === userId) || false;
      const isParticipant = subject.participants?.some((p) => p.userId === userId);

      if (!isCreator && !isLecturer && !isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }

      const files = await subjectFileService.getFilesByLesson(subjectId, lessonId);

      // If student (participant but not lecturer/creator), filter student submissions
      if (!isCreator && !isLecturer) {
        const filtered = files.filter(
          (f) => f.category === "Attachment" || f.uploadedById === userId
        );
        return res.json(filtered);
      }

      res.json(files);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async uploadFile(req: Request, res: Response) {
    try {
      const authedReq = req as AuthenticatedRequest;
      const { id: subjectId, lessonId } = req.params;
      const uploadedById = authedReq.user.id;

      const subject = await subjectService.getById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const isCreator = subject.createdBy === uploadedById;
      const isLecturer = subject.lecturers?.some((l) => l.userId === uploadedById) || false;
      const isParticipant = subject.participants?.some((p) => p.userId === uploadedById);

      if (!isCreator && !isLecturer && !isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }

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

      // Determine category: Students can only upload "Submission".
      // Lecturers/Creators can upload "Attachment" (default) or "Submission".
      let category: "Attachment" | "Submission" = "Attachment";
      if (!isCreator && !isLecturer) {
        category = "Submission";
      } else if (req.body.category === "Submission") {
        category = "Submission";
      }

      const record = await subjectFileService.createFile({
        name: file.originalname,
        url: uploaded.data.ufsUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        category,
        uploadedById,
        subjectId,
        lessonId,
      });

      res.status(201).json(record);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const authedReq = req as AuthenticatedRequest;
      const { id: subjectId, fileId } = req.params;
      const userId = authedReq.user.id;

      const subject = await subjectService.getById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      const existing = await subjectFileService.getFileById(fileId);
      if (!existing) {
        return res.status(404).json({ error: "File not found" });
      }

      const isCreator = subject.createdBy === userId;
      const isLecturer = subject.lecturers?.some((l) => l.userId === userId) || false;
      const isUploader = existing.uploadedById === userId;

      // Only creator, lecturer, or the uploader themselves can delete the file
      if (!isCreator && !isLecturer && !isUploader) {
        return res.status(403).json({ error: "Access denied" });
      }

      await deleteUploadthingFile(existing.url);
      const deleted = await subjectFileService.deleteFile(fileId, subjectId);
      res.json(deleted);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const subjectFileController = new SubjectFileController();
