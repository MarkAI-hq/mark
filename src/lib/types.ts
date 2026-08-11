// src/lib/types.ts

// --- SYLLABUS CITATIONS (RAG provenance) ---
// Mirrors the API `sources_consulted` / `citation` shape from mark-api RagService.
export interface Citation {
  source: string | null;
  page: number | null;
  topic: string | null;
  class: string | null;
  outcome: string | null;
}

// --- CORE AUTH & USER TYPES ---
export type UserRole =
  | 'Root'
  | 'Support'
  | 'Admin'
  | 'Teacher'
  | 'Student'
  | 'Reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  photoUrl?: string;
  organizationId: string | null;
  onboarding_complete?: boolean;
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
  school_code: string | null;
  type: string | null;
  country_code: string | null;
  region: string | null;
  address_details: AddressDetails | null;
  contact_information: ContactInformation | null;
  education_system: string | null;
  timezone: string;
  onboarding_complete: boolean;
  sso_required: boolean;
  is_public: boolean;
  partner_config?: {
    currency?: string;
    marketplace_agreement?: {
      signed_by: string;
      signed_at: string;
      version: string;
    };
    admission_fee_ugx?: number;
    term_billing_enabled?: boolean;
    term_fee_ugx?: number;
    term_fee_usd?: number;
    [key: string]: unknown;
  } | null;
  welcome_pack_config?: {
    is_enabled?:         boolean;
    pack_name?:          string;
    description?:        string;
    cover_image_url?:    string;
    contents?:           string[];
    pack_price_usd?:     number;
    printful_store_id?:  string;
    id_card_variant_id?: string;
    tshirt_variant_id?:  string;
  } | null;
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
  onboarding_complete?: boolean;
}

export type SignUpResponse = {
	message: string
	user: {
		id: string
		name: string
		email: string
		role: string
		isVerified: boolean
	}
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
  grade_level: string | null;
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

// src/lib/types.ts (or wherever your types live)

export interface CognitiveProfile {
  profile_id: string;
  profile_name: string;
  description: string | null;
  focus: string | null;
}

export interface StudentCognitiveProfile {
  student_profile_id: string;
  student_id: string;
  assessment_id: string;
  primary_profile_id: string;
  mental_energy_score: number | null;
  learning_strategy_score: number | null;
  is_current: boolean;
  profile_name?: string;        
  profile_description?: string; // Joined from profiles table
  profile_focus?: string;       // Joined from profiles table
}

// exam-builder specific types
export enum CurriculumArchetype {
  EAST_AFRICA = 'east_africa',
  WEST_AFRICA = 'west_africa',
  SOUTHERN_AFRICA = 'southern_africa',
  UK = 'uk',
  USA = 'usa',
  SWITZERLAND = 'switzerland',
}

export enum QuestionType {
  MCQ = 'mcq',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  MATCHING = 'matching',
  STRUCTURED = 'structured',
  CASE_STUDY = 'case_study',
}

export interface ExamDetectionResult {
  confidence: number;
  requires_teacher_confirmation: boolean;
  recommended_archetype: CurriculumArchetype;
  reasoning: string;
  detected_language: string;
  subject: string;
  grade_level: string;
  topics_identified: string[];
  recommended_config: {
    total_marks: number;
    duration_minutes: number;
    question_types: string[];
    sections: any[];
  };
}

export interface ExamVariant {
  id: string;
  examId: string;
  variant: 'A' | 'B';
  content: any;
  workflowState: string;
  createdAt: string;
}

export interface ExamBuilderAssessment {
  id: string;
  subject: string;
  grade_level: string;
  curriculum_archetype: CurriculumArchetype;
  total_marks: number;
  workflow_state: string;
  createdAt: string;
}

export enum ExamLanguage {
  EN = 'en',
  SW = 'sw',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
}

export enum ExamSource {
  AUTO = 'auto',
  MANUAL = 'manual',
}

// Also adding this as it will be used in the Marking Studio
export enum RubricStyle {
  POINT_BASED = 'point_based',
  LEVEL_DESCRIPTOR = 'level_descriptor',
  HYBRID = 'hybrid',
  CRITERION = 'criterion',
}

//More additions

export enum ModelAnswerDepth {
  BRIEF          = 'brief',
  DETAILED       = 'detailed',
  EXAMINER_NOTES = 'examiner_notes',
}

export interface SectionConfig {
  title:                 string;
  question_type:         QuestionType;
  num_questions:         number;
  marks_per_question:    number;
  section_instructions?: string;
}

export interface GenerateExamPayload {
  // Curriculum identity
  curriculum_archetype:  CurriculumArchetype;
  sub_type?:             string;
  state_standard?:       string;
  country_context?:      string;
  language:              ExamLanguage;

  // Assessment identity
  grade_level:           string;
  subject:               string;
  topic?:                string;
  assessment_period?:    string;

  // Exam parameters
  duration_minutes:      number;
  total_marks:           number;
  copies:                1 | 2;
  source:                ExamSource;

  // Question structure
  question_types:        QuestionType[];
  bloom_distribution:    boolean;
  section_structure?:    SectionConfig[];

  // Content
  source_content?:       string;
  special_instructions?: string;
}

export const Role = {
  ADMIN:   'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT:  'Reviewer',
} as const

export type AcceptInvitationResponse = {
  message:        string
  requiresSignup?: boolean
  email?:          string
  organization_id?: string
  role?:           string
}

export type PeekInvitationResponse = {
  email:            string
  organizationName: string
  role:             string
  requiresSignup:   boolean  // true = new user, false = existing user
  ssoRequired:      boolean
}


export type RegisterInvitedResponse = {
  message:       string
  requiresLogin?: boolean
}
export type Role = typeof Role[keyof typeof Role]

export interface VerifyEmailResponse {
  message:       string;
  accessToken?:  string;
  refreshToken?: string;
  user?:         BackendUser;
}
 