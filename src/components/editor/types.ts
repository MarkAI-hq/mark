// ── Image library ─────────────────────────────────────────────────────────────
// Matches the select shape returned by ImageExtractionService.searchImages()

export type CurriculumImageType =
  | 'diagram'
  | 'map'
  | 'graph'
  | 'figure'
  | 'table'
  | 'photograph'
  | 'other';

export interface ImageCandidate {
  image_url: any;
  id:               string;
  description:      string;
  image_type:       CurriculumImageType;
  question_context: string | null;
  tags:             string[] | null;
  subject:          string | null;
  topic:            string | null;
  /** 0–1 cosine similarity from pgvector search */
  score:            number;
}

// ── Redesign response ─────────────────────────────────────────────────────────
// Derived from RedesignResponseSchema in redesign.schema.ts.
// image_suggestions and needs_ai_generation are attached by
// hydrateWithImageSuggestions() in assessment-redesign.service.ts.

export interface RedesignSuggestion {
  title:                   string;
  description:             string;
  action_type:             'add_question' | 'modify_question' | 'adjust_marks';
  marks:                   number;
  bloom_level:             string;
  command_word:            string;
  assessment_objective_id: string;
  syllabus_topic:          string;
  example_question_stem?:  string;
  visual_search_query?:    string | null;
  /** Populated by hydrateWithImageSuggestions — up to 3 candidates */
  image_suggestions?:      ImageCandidate[];
  /** True when best candidate score < 0.55 — set server-side */
  needs_ai_generation?:    boolean;
}

export interface RedesignDimensionGroup {
  dimension:     string;
  issue_summary: string;
  suggestions:   RedesignSuggestion[];
}

export interface RedesignResponse {
  overall_advice:       string;
  detailed_suggestions: RedesignDimensionGroup[];
}

// ── Assessment diff ───────────────────────────────────────────────────────────
// The target contract for the editor once assessment-redesign.service.ts
// returns a diff instead of a full blueprint (Phase 3 roadmap task).
// Positions are character offsets into documentContent.

export interface DiffInsertion {
  id:      string;
  from:    number;
  content: string;
  /** The RedesignSuggestion that generated this insertion */
  source:  RedesignSuggestion;
}

export interface DiffDeletion {
  id:   string;
  from: number;
  to:   number;
}

export interface DiffImageSuggestion {
  id:                  string;
  position:            number;
  candidates:          ImageCandidate[];
  needs_ai_generation: boolean;
}

export interface AssessmentDiff {
  /** Original assessment document serialised as TipTap-compatible HTML */
  documentContent:  string;
  insertions:       DiffInsertion[];
  deletions:        DiffDeletion[];
  imageSuggestions: DiffImageSuggestion[];
}

// ── Suggestion state ──────────────────────────────────────────────────────────

export type SuggestionType   = 'insertion' | 'deletion';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface SuggestionRecord {
  id:     string;
  type:   SuggestionType;
  status: SuggestionStatus;
}