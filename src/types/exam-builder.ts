// src/lib/types/exam-builder.ts

export enum CurriculumArchetype {
  EAST_AFRICA    = 'east_africa',
  WEST_AFRICA    = 'west_africa',
  SOUTHERN_AFRICA = 'southern_africa',
  UK             = 'uk',
  USA            = 'usa',
  SWITZERLAND    = 'switzerland',
}

export enum QuestionType {
  MCQ          = 'mcq',
  SHORT_ANSWER = 'short_answer',
  ESSAY        = 'essay',
  TRUE_FALSE   = 'true_false',
  FILL_BLANK   = 'fill_blank',
  MATCHING     = 'matching',
  STRUCTURED   = 'structured',
  CASE_STUDY   = 'case_study',
}

export enum ExamLanguage {
  EN = 'en',
  SW = 'sw',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
}

export enum ExamSource {
  AUTO   = 'auto',
  MANUAL = 'manual',
}

export enum RubricStyle {
  POINT_BASED      = 'point_based',
  LEVEL_DESCRIPTOR = 'level_descriptor',
  HYBRID           = 'hybrid',
  CRITERION        = 'criterion',
}

export enum ModelAnswerDepth {
  BRIEF          = 'brief',
  DETAILED       = 'detailed',
  EXAMINER_NOTES = 'examiner_notes',
}

export type ExamWorkflowState = 'draft' | 'under_review' | 'approved' | 'published';

// ─── Section Structure ────────────────────────────────────────────────────────
// Used when the teacher wants to explicitly define the exam's section layout.
// When omitted, the AI designs the structure as the curriculum expert.

export interface SectionConfig {
  title:                string;
  question_type:        QuestionType;
  num_questions:        number;
  marks_per_question:   number;
  section_instructions?: string;
}

// ─── Generate Exam Payload ────────────────────────────────────────────────────

export interface GenerateExamPayload {
  // Curriculum identity
  curriculum_archetype: CurriculumArchetype;
  sub_type?:            string;
  state_standard?:      string;
  country_context?:     string;
  language:             ExamLanguage;

  // Assessment identity
  grade_level:       string;
  subject:           string;
  topic?:            string;
  assessment_period?: string;

  // Exam parameters
  duration_minutes: number;
  total_marks:      number;
  copies:           1 | 2;
  source:           ExamSource;

  // Question structure
  question_types:     QuestionType[];
  bloom_distribution: boolean;
  section_structure?: SectionConfig[];

  // Content
  source_content?:       string;
  special_instructions?: string;
}

// ─── Detection ───────────────────────────────────────────────────────────────

export interface DetectionResult {
  confidence:                    number;
  requires_teacher_confirmation: boolean;
  recommended_archetype:         CurriculumArchetype;
  alternative_archetype?:        string;
  reasoning:                     string;
  detected_language:             string;
  subject:                       string;
  grade_level:                   string;
  topics_identified:             string[];
  recommended_config:            any;
}

export interface ExamDetectionResult {
  task:      string;
  detection: DetectionResult;
}

// ─── Assessment List ──────────────────────────────────────────────────────────

export interface ExamBuilderAssessment {
  id:                   string;
  subject:              string;
  grade_level:          string;
  curriculum_archetype: CurriculumArchetype;
  sub_type:             string | null;
  language:             ExamLanguage;
  total_marks:          number;
  duration_minutes:     number;
  source:               ExamSource;
  copies:               number;
  workflow_state:       ExamWorkflowState;
  created_at:           string;
  updated_at:           string;
}

// ─── Variant ─────────────────────────────────────────────────────────────────

export interface ExamVariant {
  id:             string;
  examId:         string;
  variant:        'A' | 'B';
  content:        any;
  workflowState:  ExamWorkflowState;
  createdAt:      string;
  updatedAt:      string;
}

// ─── Server Action Response ───────────────────────────────────────────────────

export interface ServerActionResponse<T> {
  data?:  T;
  error?: { message: string };
}