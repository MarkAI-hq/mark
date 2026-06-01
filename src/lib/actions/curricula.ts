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
