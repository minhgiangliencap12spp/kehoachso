
export interface PPCTEntry {
  lessonNumber: number | string;
  lessonName: string;
  subject?: string;
  grade?: string;
}

export interface EquipmentConfigEntry {
  lessonNumber: number | string;
  equipmentName: string;
  quantity?: string;
  subject?: string;
  grade?: string;
}

export interface TimetableEntry {
  dayOfWeek: string;
  period: number;
  subject: string;
  className: string;
  teacherName?: string;
}

export interface ScheduleRow {
  id: string;
  week: number;
  dayOfWeek: string; // Thứ 2, Thứ 3...
  date: string; // YYYY-MM-DD
  period: number; // Tiết thứ mấy trong ngày (1-4)
  subject: string; // Môn
  className: string;
  ppctNumber: string; // Số tiết theo PPCT
  lessonName: string; // Auto-filled
  notes: string;
  teacherName?: string; // NEW: Track which teacher this row belongs to
}

export interface EquipmentRow {
  id: string;
  week: number;
  dayOfWeek: string;
  date: string;
  period: number;
  subject: string;
  className: string;
  ppctNumber: string;
  equipmentName: string; // Thay cho lessonName
  quantity: string;      // Thay cho notes
  teacherName?: string; // NEW: Track which teacher this row belongs to
}

export enum AppTab {
  TIMETABLE = 'TIMETABLE',
  PPCT = 'PPCT',
  DEVICE_LIST = 'DEVICE_LIST',
  SCHEDULE = 'SCHEDULE',
  EQUIPMENT = 'EQUIPMENT'
}

export const DAYS_OF_WEEK = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
];

export interface ExamConfiguration {
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  description: string;
  ratios: {
    nb: number;
    th: number;
    vd: number;
    vdc: number;
  };
  questionCount: number;
}

export interface GeneratedExamData {
  matrix: string;
  specification: string;
  examPaper: string;
  answerKey: string;
}

export interface MathReviewTopic {
  id: string;
  grade: number;
  chapter?: string;
  lessonName: string;
  theory?: string;
  exercises?: string;
  lastUpdated: string;
}
