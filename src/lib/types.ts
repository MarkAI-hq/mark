// src/lib/types.ts

// --- CORE AUTH & USER TYPES ---
export type UserRole = 'Admin' | 'Teacher' | 'Student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  photoUrl?: string;
  organizationId: string | null;
}

export type ServerActionResponse<T> = {
  data: T | null;
  error: { message: string; status?: number } | null;
};

// --- ORGANIZATION TYPES ---
export interface AddressDetails {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ContactInformation {
  email?: string;
  phone?: string;
  website?: string;
}

export interface Organization {
  organization_id: string;
  name: string;
  type: string | null;
  country_code: string | null;
  region: string | null;
  address_details: AddressDetails | null;
  contact_information: ContactInformation | null;
  education_system: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// --- BACKEND API RESPONSE TYPES ---
export interface BackendUser {
  user_id: string;
  organization_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  email_verified: boolean;
  roles: string[];
}

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
};

export type RegisterResponse = {
  message: string;
  user: {
    user_id: string;
    organization_id: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    email_verified: boolean;
  };
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export interface VerifyEmailResponse {
  message: string;
}

// --- ACADEMICS TYPES ---
export type Subject = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  organization_id: string;
  created_by: string;
  createdAt: string;
  updatedAt: string;
};

export type Course = {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  subject_id: string;
  organization_id: string;
  grade_level?: string | null;
  is_active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Class = {
  class_id: string;
  name: string;
  description: string | null;
  created_by: string;
  organization_id: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssignedCourse = {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  course_description: string | null;
  teacher_id: string;
  teacher_name: string;
  teacher_lastname: string;
  assigned_at: string;
};

// A rich Student type combining user and profile data
// FIXED: This type now accurately reflects the data returned from the backend,
// which is a combination of the 'users' and 'students' tables.
export type Student = {
  // From users table
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string | null;
  is_active: boolean;
  email_verified: boolean;

  // From students table
  id: string; // This is the same as user_id, but is present from the spread
  student_school_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  enrollment_status: string;
  expected_graduation_year: number | null;

  // From timestamps
  createdAt: string;
  updatedAt: string;
};

// --- OTHER APPLICATION TYPES ---
export type DashboardStats = {
  totalCourses: number;
  totalStudents: number;
  totalExams: number;
  markedPapers: number;
  recentActivity: Array<{
    id: string;
    description: string;
    timestamp: string;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
  }>;
};

export type Exam = {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  markingScheme: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assessment_type?: 'MANUAL' | 'AI_ASSISTED_GRADING'; // ADDED: This property is now part of the type.

};

export type CreateExamDto = {
  title: string;
  courseId: string;
  totalMarks: number;
  questionCount: number;
  description?: string;
};

export type TQuestion = {
  question: string;
  score: number;
  maxScore: number;
  confidence: number;
  feedback: string;
  issues: string[];
};

export type TAssessment = {
  number: number;
  question: string;
};

export type ExamStats = {
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
};

export type StudentResult = {
  id: string;
  courseId: string;
  courseName: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  maxTotalScore: number;
  feedback: string;
  questions: TQuestion[];
  assignments: TAssessment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type QuestionStat = {
  questionNumber: number;
  totalPossibleMarks: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  percentageScore: number;
  attemptsCount: number;
};

export interface ErrorType {
  error_id: string;
  error_code: string;
  error_name: string;
  domain: string | null;
  description: string | null;
  common_causes: string[] | null;
  remediation_strategies: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export interface BloomLevel {
  level_id: string;
  level_code: string;
  level_name: string;
  description: string | null;
  action_verbs: string[] | null;
  cbc_competency_mapping: string | null;
  createdAt: string;
  updatedAt: string;
}