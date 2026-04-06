'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export async function getLatestAudit(assessmentId: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit`, { cache: 'no-store' });
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

export async function saveRedesignItems(assessmentId: string, items: any[]): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/redesign-items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function getRedesignItems(assessmentId: string): Promise<ServerActionResponse<any[]>> {
  return fetcher(`/assessments/${assessmentId}/audit/redesign-items`, { cache: 'no-store' });
}

// Download is handled client-side directly — binary responses can't go through
// the server action / fetcher pipeline. See downloadRedesignDocx() in the dialog.

export async function reuploadAssessment(assessmentId: string, formData: FormData): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit/reupload`, {
    method: 'POST',
    body: formData,
    // No Content-Type header — browser sets multipart boundary automatically
  });
}

export async function triggerAudit(assessmentId: string): Promise<ServerActionResponse<any>> {
  return fetcher(`/assessments/${assessmentId}/audit`, {
    method: 'POST',
  });
}