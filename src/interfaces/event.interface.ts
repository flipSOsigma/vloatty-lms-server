export interface ILmsEvent {
  id: string;
  title: string;
  subtitle?: string | null;
  timeStart: string;
  timeEnd: string;
  dayIndex: number;
  color: string;
  tagText?: string | null;
  tagType?: string | null;
  linkText?: string | null;
  linkUrl?: string | null;
  participantsInitials?: string | null;
  participantsCount?: number | null;
  status?: string | null; // "in-progress" | "joinable" | "normal"
  description?: string | null;
  image?: string | null;
  subjectId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

export interface ICreateEventInput {
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
}
