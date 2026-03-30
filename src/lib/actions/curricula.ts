'use server';

import { fetcher } from '@/lib/fetch';
import { CurriculumSchemaMetadata, CurriculumSchema } from '@/types/curricula';

/**
 * Fetches all available curriculum schemas from the backend.
 */
export async function getCurricula() {
  return fetcher<CurriculumSchemaMetadata[]>('/curricula');
}

/**
 * Fetches a full curriculum schema by its ID.
 */
export async function getCurriculumById(id: string) {
  return fetcher<CurriculumSchema>(`/curricula/${id}`);
}