import { ILesson } from "./lesson.interface";

export interface IModule {
  id: string;
  title: string;
  desc: string;
  date: Date | string;
  subjectId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  lessons?: ILesson[];
}
