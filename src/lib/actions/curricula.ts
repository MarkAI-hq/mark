'use server';

import { fetcher } from '@/lib/fetch';
import { CurriculumSchemaMetadata, CurriculumSchema } from '@/types/curricula';

/**
 * Fetches all available curriculum schemas.
 */
export async function getCurricula(): Promise<CurriculumSchemaMetadata[]> {
  const response = await fetcher<CurriculumSchemaMetadata[]>('/curricula');
  
  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : response.error.message);
  }
  
  return response.data ?? [];
}

/**
 * Fetches a full curriculum schema by its ID.
 */
export async function getCurriculumById(id: string): Promise<CurriculumSchema> {
  if (!id) throw new Error('Curriculum ID is required');
  
  const response = await fetcher<CurriculumSchema>(`/curricula/${id}`);
  
  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : response.error.message);
  }
  
  if (!response.data) {
    throw new Error(`Curriculum schema not found: ${id}`);
  }
  
  return response.data;
}

/**
 * Triggers a server-side reload of the curriculum schema cache.
 */
export async function reloadCurricula(): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>('/curricula/reload', {
    method: 'POST',
  });
  
  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : response.error.message);
  }
  
  return { 
    message: response.data?.message || 'Reloaded successfully' 
  };
}