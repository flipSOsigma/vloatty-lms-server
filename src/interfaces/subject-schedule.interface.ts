export interface ISubjectSchedule {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  subjectId?: string;
}
