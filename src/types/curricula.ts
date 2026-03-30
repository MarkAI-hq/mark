// ─────────────────────────────────────────────────────────────────────────────
// Curriculum Schema Types
// Mirrors the JSON structure produced in Phase 1
// ─────────────────────────────────────────────────────────────────────────────

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyse'
  | 'evaluate'
  | 'create';

export type SchemaStatus = 'draft' | 'in_review' | 'active' | 'deprecated';

// ── Command Word ──────────────────────────────────────────────────────────────

export interface CommandWordDefinition {
  word: string;
  definition: string;
  bloom_level: BloomLevel;
  expected_response_pattern: string;
  hard_rules?: Array<{
    rule_id: string;
    description: string;
    mark_impact: string;
    cap_percentage?: number;
    validated: boolean;
  }>;
  source_citation: string;
}

// ── Misconception ─────────────────────────────────────────────────────────────

export interface Misconception {
  misconception_id: string;
  description: string;
  correct_understanding: string;
  source: string;
  mark_impact: 'penalise' | 'flag' | 'accept_alternative';
}

// ── Topic ─────────────────────────────────────────────────────────────────────

export interface Topic {
  topic_id: string;
  name: string;
  weight: number;               // fraction of total paper marks — must sum to 1.0
  bloom_distribution: Record<BloomLevel, number>;
  subtopics: string[];
  misconceptions: Misconception[];
  source_citation: string;
}

// ── Paper Structure ───────────────────────────────────────────────────────────

export interface PaperSection {
  section_id: string;
  label: string;
  compulsory: boolean;
  items_available: number;
  items_to_answer: number;
  answer_location: 'spaces_provided' | 'answer_booklet';
  scenario_based: boolean;
}

export interface Paper {
  paper_number: number;
  paper_name: string;
  marks: number;
  duration_minutes: number;
  sections: PaperSection[];
}

export interface PaperStructure {
  total_marks: number;
  duration_minutes: number;
  papers: Paper[];
}

// ── Partial Credit Rules ──────────────────────────────────────────────────────

export interface PartialCreditRule {
  rule_id: string;
  applies_to: string;
  description: string;
  mark_formula: string;
  example?: string;
  source_citation: string;
}

// ── Audit Thresholds ──────────────────────────────────────────────────────────

export interface AuditThresholds {
  overall: { pass: number; flag: number; fail: number };
  bloom_coverage: Record<BloomLevel, { min: number; max: number }>;
  topic_coverage: { minimum_topics_represented: number };
  scoring_weights: Record<string, number>;
}

// ── Root Schema ───────────────────────────────────────────────────────────────

export interface CurriculumSchema {
  metadata: {
    schema_id: string;
    subject: string;
    subject_code: string;
    curriculum_body: string;
    curriculum_level: string;
    country: string;
    version: string;
    status: SchemaStatus;
  };
  command_words: {
    source: string;
    overrides: CommandWordDefinition[];
    subject_specific: CommandWordDefinition[];
  };
  topics: Topic[];
  paper_structure: PaperStructure;
  partial_credit_rules: PartialCreditRule[];
  grading_instructions: {
    accept_alternatives: boolean;
    penalise_contradiction: boolean;
    penalise_vagueness: boolean;
    require_units: boolean;
    language_tolerance: 'strict' | 'moderate' | 'lenient';
  };
  audit_thresholds: AuditThresholds;
}

// ── Metadata (returned from list endpoint) ───────────────────────────────────

export interface CurriculumSchemaMetadata {
  id: string; // The generated key: ug_uneb_uce_biology
  display_name: string;
  schema_id: string;
  subject: string;
  curriculum_body: string;
  curriculum_level: string;
  country: string;
  version: string;
  status: SchemaStatus;
}