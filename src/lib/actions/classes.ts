// src/lib/actions/classes.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Class, ServerActionResponse, AssignedCourse } from '@/lib/types'

export type CreateClassData = Omit<Class, 'class_id' | 'created_by' | 'organization_id' | 'createdAt' | 'updatedAt'>;
export type UpdateClassData = Partial<CreateClassData>;

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error('API returned success but no data was received.');
  }
  return response.data;
}

export async function createClass(data: CreateClassData): Promise<Class> {
  const response = await fetcher<Class>('/academics/classes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const newClass = handleMutationResponse(response);
  revalidatePath('/dashboard/classes');
  return newClass;
}

export async function getClasses(): Promise<ServerActionResponse<Class[]>> {
  return await fetcher<Class[]>('/academics/classes', {
    cache: 'no-store'
  });
}

/**
 * NEW: Fetches the details for a single class.
 */
export async function getClassDetails(id: string): Promise<ServerActionResponse<Class>> {
  return await fetcher<Class>(`/academics/classes/${id}`, {
    cache: 'no-store'
  });
}

/**
 * NEW: Fetches the list of courses assigned to a specific class.
 */
export async function getAssignedCourses(id: string): Promise<ServerActionResponse<AssignedCourse[]>> {
  return await fetcher<AssignedCourse[]>(`/academics/classes/${id}/courses`, {
    cache: 'no-store'
  });
}

export async function updateClass(
  id: string,
  data: UpdateClassData
): Promise<Class> {
  const response = await fetcher<Class>(`/academics/classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  const updatedClass = handleMutationResponse(response);
  revalidatePath('/dashboard/classes');
  revalidatePath(`/dashboard/classes/${id}`);
  return updatedClass;
}

export async function deleteClass(id: string): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/academics/classes/${id}`,
    {
      method: 'DELETE'
    }
  );
  const deleteMessage = handleMutationResponse(response);
  revalidatePath('/dashboard/classes');
  return deleteMessage;
}
