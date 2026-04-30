export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  educationLevel?: 'primário' | 'secundário' | 'superior';
  country?: string;
  province?: string;
  university?: string;
  schedule?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
  };
  studySchedule?: any;
  welcomeShown?: boolean;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'reminder' | 'tutor';
  read: boolean;
  createdAt: any;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  description: string;
  topics?: string[];
  createdAt: any;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface StudySession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: any;
}

export interface Flashcard {
  front: string;
  back: string;
  mastered: boolean;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  topic: string;
  cards: Flashcard[];
  createdAt: any;
}

export interface Summary {
  id: string;
  userId: string;
  title: string;
  content: string;
  sourceText: string;
  createdAt: any;
  signature?: string;
}

export interface Task {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  content: string;
  response?: string;
  correction?: string;
  status: 'pending' | 'completed';
  createdAt: any;
}

export interface VideoLesson {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  url: string;
  title: string;
  thumbnail?: string;
  createdAt: any;
}

export interface StudyMusic {
  id: string;
  userId: string;
  title: string;
  url: string;
  createdAt: any;
}
