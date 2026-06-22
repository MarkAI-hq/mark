'use server';

import { fetcher } from '@/lib/fetch';
import type { CurriculumSchemaMetadata, CurriculumSchema } from '@/types/curricula';

export async function getCurricula() {
  return fetcher<CurriculumSchemaMetadata[]>('/curricula');
}

export async function getCurriculumById(id: string) {
  return fetcher<CurriculumSchema>(`/curricula/${id}`);
}

export async function reloadCurricula() {
  return fetcher<{ message: string }>('/curricula/reload', { method: 'POST' });
}

export interface AvailableSubject {
  subject_key:     string
  display_name:    string
  class_levels:    string[]
  country:         string
  curriculum_body: string
}

export async function getAvailableSubjects(params?: {
  country?:        string
  classKeyPrefix?: string
}) {
  const qs = new URLSearchParams()
  if (params?.country)        qs.set('country',        params.country)
  if (params?.classKeyPrefix) qs.set('classKeyPrefix', params.classKeyPrefix)
  const query = qs.toString() ? `?${qs}` : ''
  return fetcher<AvailableSubject[]>(`/curricula/available-subjects${query}`)
}
