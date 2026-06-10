import { ISubjectLecturer } from "./subject-lecturer.interface";
import { ISubjectSchedule } from "./subject-schedule.interface";
import { IModule } from "./module.interface";

export interface ISubject {
  id: string;
  name: string;
  room?: string | null;
  color?: string | null;
  description?: string | null;
  createdBy: string;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  lecturers?: ISubjectLecturer[];
  schedules?: ISubjectSchedule[];
  modules?: IModule[];
}

export interface ICreateSubjectInput {
  name: string;
  room?: string;
  color?: string;
  description?: string;
  createdBy?: string;
  lecturers?: { userId?: string; name?: string; email?: string }[];
  schedules?: ISubjectSchedule[];
}

export interface IUpdateSubjectInput {
  name?: string;
  room?: string;
  color?: string;
  description?: string;
  createdBy?: string;
  lecturers?: { userId?: string; name?: string; email?: string }[];
  schedules?: ISubjectSchedule[];
}
