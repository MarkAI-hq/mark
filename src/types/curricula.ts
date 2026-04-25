// ─────────────────────────────────────────────────────────────────────────────
// Curriculum Schema Types
// Global Framework: Universal across all national curricula
//
// Design principle:
//   Mirrors the backend CurriculumZodSchema exactly.
//   No dimension names are hardcoded — Uganda UNEB uses Bloom/KUSA,
//   Kenya KNEC uses Strands, Cambridge uses Assessment Objectives.
//   All are valid without touching this file.
// ─────────────────────────────────────────────────────────────────────────────

export type SchemaStatus = 'draft' | 'in_review' | 'active' | 'deprecated';

// ── Command Word ──────────────────────────────────────────────────────────────

export interface CommandWordHardRule {
  rule_id:        string;
  description:    string;
  mark_impact:    'zero' | 'cap' | 'proportional' | 'no_deduction' | 'deduct';
  cap_percentage?: number;
  validated:      boolean;
}

export interface CommandWordDefinition {
  word:                      string;
  definition:                string;
  bloom_level:               string; // flexible — not enum-locked
  expected_response_pattern: string;
  hard_rules?:               CommandWordHardRule[];
}

// ── Misconception ─────────────────────────────────────────────────────────────

export interface Misconception {
  misconception_id:      string;
  description:           string;
  correct_understanding: string;
  source:                string;
  mark_impact:           'penalise' | 'flag' | 'accept_alternative';
}

// ── Learning Outcome ──────────────────────────────────────────────────────────

export interface LearningOutcome {
  id:                    string;
  text:                  string;
  bloom_level?:          string;
  kusa_map?:             string[];
  assessment_strategies?: string[];
}

// ── Topic ─────────────────────────────────────────────────────────────────────

export interface Topic {
  topic_id:           string;
  title:              string;
  weight:             number;
  subtopics?:         string[];
  misconceptions?:    Misconception[];
  learning_outcomes?: LearningOutcome[];
  // Flexible distribution maps — not locked to Bloom or KUSA
  // e.g. bloom_distribution, kusa_distribution, ao_distribution
  [key: string]:      unknown;
}

// ── Theme ─────────────────────────────────────────────────────────────────────

export interface Theme {
  theme_id: string;
  theme:    string;
  topics:   Topic[];
}

// ── Paper Structure ───────────────────────────────────────────────────────────

export interface PaperSection {
  section_id:      string;
  label:           string;
  compulsory:      boolean;
  items_available: number;
  items_to_answer: number;
  marks_per_item:  number;
  answer_location: 'spaces_provided' | 'answer_booklet';
  scenario_based:  boolean;
}

export interface Paper {
  paper_number:     number;
  paper_name:       string;
  marks:            number;
  duration_minutes: number;
  sections:         PaperSection[];
}

export interface PaperStructure {
  total_marks:      number;
  duration_minutes: number;
  papers:           Paper[];
}

// ── Partial Credit Rules ──────────────────────────────────────────────────────

export interface PartialCreditRule {
  rule_id:      string;
  applies_to:   string;
  description:  string;
  mark_formula: string;
  example?:     string;
}

// ── Audit Thresholds — Fully Flexible ────────────────────────────────────────
//
// scoring_weights keys are curriculum-defined:
//   Uganda UNEB:  kusa_coverage, topic_coverage, bloom_coverage, command_word_alignment
//   Cambridge:    ao_coverage, topic_coverage, command_word_alignment
//   All are valid — Mirror doesn't own the dimension names.

export interface CoverageBand {
  min: number;
  max: number;
}

export interface AuditThresholds {
  overall: {
    pass: number;
    flag: number;
    fail: number;
  };
  topic_coverage: {
    minimum_topics_represented: number;
  };
  scoring_weights: Record<string, number>;
  // Flexible coverage band blocks — bloom_coverage, kusa_coverage, ao_coverage, etc.
  [key: string]: unknown;
}

// ── Root Schema ───────────────────────────────────────────────────────────────

export interface CurriculumSchema {
  metadata: {
    schema_id:        string;
    subject:          string;
    subject_code:     string;
    curriculum_body:  string;
    curriculum_level: string;
    country:          string;
    version:          string;
    status:           SchemaStatus;
  };
  command_words: {
    source:           string;
    overrides:        CommandWordDefinition[];
    subject_specific: CommandWordDefinition[];
  };
  // Optional — some curricula separate content into linked files
  curriculum_content?: Theme[];
  paper_structure:      PaperStructure;
  partial_credit_rules?: PartialCreditRule[];
  grading_instructions: {
    accept_alternatives:    boolean;
    penalise_contradiction: boolean;
    penalise_vagueness:     boolean;
    require_units:          boolean;
    language_tolerance:     'strict' | 'moderate' | 'lenient';
  };
  audit_thresholds: AuditThresholds;
  // Passthrough — allows any additional curriculum-body fields
  [key: string]: unknown;
}

// ── Metadata (returned from list endpoint) ────────────────────────────────────
//
// Stable contract — changes here are breaking changes.
// Mirrors CurriculumSchemaMetadata in curriculum-schema.service.ts.

export interface CurriculumSchemaMetadata {
  id:               string; // cache key: e.g. ug_uneb_uce_527
  display_name:     string;
  schema_id:        string;
  subject:          string;
  subject_code:     string;
  curriculum_body:  string;
  curriculum_level: string;
  country:          string;
  version:          string;
  status:           SchemaStatus;
}

// ── Prediction Result ─────────────────────────────────────────────────────────
//
// Mirrors PredictionResult in prediction.service.ts.
// cognitive_penalty replaces the old blooms_penalty —
// works for any cognitive framework (Bloom, KUSA, AOs, Strands).

export interface PredictionFactors {
  base_average:      number;
  cognitive_penalty: number; // was blooms_penalty
  topic_penalty:     number;
  cognitive_weight:  number; // how much this curriculum weights cognitive coverage
  total_levels:      number; // total cognitive levels defined in the schema
  flagged_levels:    number; // how many were out of range
}

export interface PredictionResult {
  predicted_average: number;
  range:             [number, number];
  confidence:        number;
  factors:           PredictionFactors;
}

// ── Audit Result ──────────────────────────────────────────────────────────────
//
// Mirrors AuditResult + AuditFinding in assessment-audit.service.ts.

export type AuditDimension =
  | 'cognitive_coverage'
  | 'topics'
  | 'command_words'
  | 'marks'
  | 'structure';

export type AuditStatus =
  | 'not_audited'
  | 'passed'
  | 'flagged'
  | 'failed'
  | 'overridden';

export interface AuditFinding {
  dimension:   AuditDimension;
  status:      'passed' | 'flagged';
  description: string;
  details:     Record<string, unknown>;
  citation?:   string;
}

export interface AuditResult {
  overall_score: number;
  status:        AuditStatus;
  findings:      AuditFinding[];
  prediction?:   PredictionResult;
}