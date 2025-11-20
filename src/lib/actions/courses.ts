// src/lib/actions/courses.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Course, ServerActionResponse } from '@/lib/types'

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error('API returned success but no data was received.');
  }
  return response.data;
}

export async function createCourse(data: {
  title: string;
  code: string;
  description?: string;
  subject_id: string;
  grade_level?: string;
}): Promise<Course> {
  const response = await fetcher<Course>('/academics/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  const newCourse = handleMutationResponse(response);
  revalidatePath('/dashboard/courses');
  return newCourse;
}

export async function getCourses(): Promise<ServerActionResponse<Course[]>> {
  return await fetcher<Course[]>('/academics/courses', {
    cache: 'no-store'
  });
}

export async function updateCourse(
  id: string,
  data: Partial<Omit<Course, 'id'>>
): Promise<Course> {
  const response = await fetcher<Course>(`/academics/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

  const updatedCourse = handleMutationResponse(response);
  revalidatePath('/dashboard/courses');
  revalidatePath(`/dashboard/courses/${id}`);
  return updatedCourse;
}

export async function deleteCourse(id: string): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/academics/courses/${id}`,
    {
      method: 'DELETE'
    }
  );

  const deleteMessage = handleMutationResponse(response);
  revalidatePath('/dashboard/courses');
  return deleteMessage;
}
