export type UserRole = 'SUPER_ADMIN' | 'PRINCIPAL' | 'HOD' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'SPORTS_TEACHER' | 'STUDENT';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  college_id?: string;
  class_id?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  created_at: string;
}

export interface College {
  id: string;
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  college_id: string;
  created_at: string;
}

export interface Score {
  id: string;
  student_id: string;
  semester: number;
  academics: number; // Max 350
  attendance: number; // Max 200
  behavior: number; // Max 200
  internal: number; // Max 150
  sports: number; // Max 100
  total: number; // Max 1000
  updated_at: string;
}

export interface BehaviorCard {
  id: string;
  student_id: string;
  teacher_id: string;
  type: 'GREEN' | 'BLUE' | 'RED';
  reason: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  hod_id: string;
  class_id: string;
  max_points: number;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct_option: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  college_id: string;
  class_id?: string; // Optional for class-specific filtering
  content: string;
  is_poll: boolean;
  poll_options?: string[];
  created_at: string;
  author?: {
    full_name: string;
    role: string;
  };
}

export interface PollVote {
  id: string;
  post_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface PeerEvaluation {
  id: string;
  from_teacher_id: string;
  to_teacher_id: string;
  points: number;
  created_at: string;
}
