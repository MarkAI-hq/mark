'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

/**
 * Matches the RedesignItem structure defined in the
 * database and backend DTOs.
 */
export interface RedesignItem {
  section_label:           string;
  dimension:               string;
  issue_summary:           string;
  title:                   string;
  description:             string;
  marking_guide:           string;
  action_type:             string;
  marks:                   number;
  bloom_level:             string;
  command_word:            string;
  assessment_objective_id: string;
  syllabus_topic:          string;
  example_question_stem?:  string;
}

export interface AuditHistoryEntry {
  audit_id:      string;
  assessment_id: string;
  status:        'passed' | 'flagged' | 'failed' | 'overridden';
  overall_score: number;
  findings:      any[];
  cycle_number:  number;
  created_at:    string;
}

export async function getLatestAudit(assessmentId: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit`, { cache: 'no-store' });
}

export async function getAuditHistory(assessmentId: string): Promise<ServerActionResponse<AuditHistoryEntry[]>> {
  return fetcher(`/assessments/${assessmentId}/audit/history`, { cache: 'no-store' });
}

export async function overrideAudit(assessmentId: string, reason: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/override`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getRedesignSuggestions(assessmentId: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/redesign-suggestions`, {
    method: 'POST',
  });
}

export async function saveRedesignItems(
  assessmentId: string,
  items: RedesignItem[]
): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/redesign-items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function getRedesignItems(assessmentId: string): Promise<ServerActionResponse<RedesignItem[]>> {
  return fetcher(`/assessments/${assessmentId}/audit/redesign-items`, { cache: 'no-store' });
}

export async function reuploadAssessment(assessmentId: string, formData: FormData): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/reupload`, {
    method: 'POST',
    body: formData,
  });
}

export async function triggerAudit(assessmentId: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit`, {
    method: 'POST',
  });
}