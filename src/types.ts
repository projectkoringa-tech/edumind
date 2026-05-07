export interface UserProfile {
  id: string;
  name: string;
  age: number;
  academicLevel: string;
  country: string;
  province?: string;
  school?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Discipline {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  userId: string;
  disciplineId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Material {
  id: string;
  userId: string;
  disciplineId: string;
  type: 'pdf' | 'image' | 'text' | 'link';
  title: string;
  url?: string;
  content?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  disciplineId: string;
  theme: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  userId: string;
  disciplineId: string;
  theme: string;
  content: string;
  source: 'manual' | 'automated';
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  disciplineId: string;
  theme: string;
  content: string;
  status: 'pending' | 'completed';
  userAnswer?: string;
  correction?: string;
  createdAt: string;
}
