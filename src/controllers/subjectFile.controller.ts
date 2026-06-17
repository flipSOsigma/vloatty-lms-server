import { Request, Response } from "express";
import { utapi, deleteUploadthingFile } from "../config/uploadthing";
import { subjectFileService } from "../services/subjectFile.service";
import { subjectService } from "../services/subject.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

async function getSubjectAccess(subjectId: string, userId: string) {
  const subject = await subjectService.getById(subjectId);
  if (!subject) return null;
  const isCreator = subject.createdBy === userId;
  const isLecturer = subject.lecturers?.some((l) => l.userId === userId) ?? false;
  const isParticipant = subject.participants?.some((p) => p.userId === userId) ?? false;
  return { subject, isCreator, isLecturer, isParticipant };
}

export class SubjectFileController {
  async getFiles(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { id: subjectId, lessonId } = req.params;

      const access = await getSubjectAccess(subjectId, userId);
      if (!access) return res.status(404).json({ error: "Subject not found" });

      const { isCreator, isLecturer, isParticipant } = access;
      if (!isCreator && !isLecturer && !isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }

      const files = await subjectFileService.getFilesByLesson(subjectId, lessonId);

      if (!isCreator && !isLecturer) {
        return res.json(files.filter((f) => f.category === "Attachment" || f.uploadedById === userId));
      }

      res.json(files);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async uploadFile(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { id: subjectId, lessonId } = req.params;

      const access = await getSubjectAccess(subjectId, userId);
      if (!access) return res.status(404).json({ error: "Subject not found" });

      const { isCreator, isLecturer, isParticipant } = access;
      if (!isCreator && !isLecturer && !isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const file = req.file;
      const uploadable = new File([file.buffer], file.originalname, { type: file.mimetype });
      const [uploaded] = await utapi.uploadFiles([uploadable]);

      if (uploaded.error) {
        return res.status(500).json({ error: "Upload failed", detail: uploaded.error });
      }

      const category: "Attachment" | "Submission" =
        !isCreator && !isLecturer ? "Submission"
        : req.body.category === "Submission" ? "Submission"
        : "Attachment";

      const record = await subjectFileService.createFile({
        name: file.originalname,
        url: uploaded.data.ufsUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        category,
        uploadedById: userId,
        subjectId,
        lessonId,
      });

      res.status(201).json(record);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user!.id;
      const { id: subjectId, fileId } = req.params;

      const access = await getSubjectAccess(subjectId, userId);
      if (!access) return res.status(404).json({ error: "Subject not found" });

      const existing = await subjectFileService.getFileById(fileId);
      if (!existing) return res.status(404).json({ error: "File not found" });

      const { isCreator, isLecturer } = access;
      const isUploader = existing.uploadedById === userId;

      if (!isCreator && !isLecturer && !isUploader) {
        return res.status(403).json({ error: "Access denied" });
      }

      await deleteUploadthingFile(existing.url);
      res.json(await subjectFileService.deleteFile(fileId, subjectId));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const subjectFileController = new SubjectFileController();
