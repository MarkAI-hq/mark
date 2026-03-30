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