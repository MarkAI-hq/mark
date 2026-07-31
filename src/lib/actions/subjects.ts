'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Subject, ServerActionResponse } from '@/lib/types'

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error('API returned success but no data was received.');
  }
  return response.data;
}

export async function createSubject(data: {
  name: string;
  code?: string;
  description?: string;
}): Promise<ServerActionResponse<Subject>> {
  try {
    const response = await fetcher<Subject>('/academics/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const createdSubject = handleMutationResponse(response);
    revalidatePath('/dashboard/settings/subjects');
    revalidatePath('/dashboard/exams');
    return { data: createdSubject, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function createSubjects(
  subjects: Array<{
    name: string;
    code?: string;
    description?: string;
  }>
): Promise<ServerActionResponse<Subject[]>> {
  try {
    const response = await fetcher<Subject[]>('/academics/subjects/bulk', {
      method: 'POST',
      body: JSON.stringify({ subjects })
    });

    const createdSubjects = handleMutationResponse(response);
    revalidatePath('/dashboard/settings/subjects');
    revalidatePath('/dashboard/exams');
    return { data: createdSubjects, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function getSubjects(): Promise<ServerActionResponse<Subject[]>> {
  return await fetcher<Subject[]>('/academics/subjects', {
    cache: 'no-store'
  });
}

export async function getSubject(id: string): Promise<ServerActionResponse<Subject>> {
  return await fetcher<Subject>(`/academics/subjects/${id}`, {
    cache: 'no-store'
  });
}

export async function updateSubject(
  id: string,
  data: Partial<Omit<Subject, 'id'>>
): Promise<ServerActionResponse<Subject>> {
  try {
    const response = await fetcher<Subject>(`/academics/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    const updatedSubject = handleMutationResponse(response);
    revalidatePath('/dashboard/settings/subjects');
    revalidatePath('/dashboard/exams');
    return { data: updatedSubject, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function deleteSubject(id: string): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(
      `/academics/subjects/${id}`,
      {
        method: 'DELETE'
      }
    );

    const deleteMessage = handleMutationResponse(response);
    revalidatePath('/dashboard/settings/subjects');
    revalidatePath('/dashboard/exams');
    return { data: deleteMessage, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}