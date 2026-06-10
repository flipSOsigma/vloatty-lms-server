export interface ILesson {
  id: string;
  title: string;
  desc: string;
  homeworkFile?: string | null;
  openDate: Date | string;
  closeDate: Date | string;
  closeType: "restrict" | "open";
  moduleId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}
