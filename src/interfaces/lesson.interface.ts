export interface ILesson {
  id: string;
  title: string;
  desc: string;
  type: "assignment" | "learning" | "quizzes";
  homeworkFile?: string | null;
  openDate: Date | string;
  closeDate: Date | string;
  closeType: "restrict" | "open";
  moduleId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}
