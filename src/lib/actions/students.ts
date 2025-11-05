// src/lib/actions/students.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Student, ServerActionResponse } from '@/lib/types'

export interface CreateStudentData {
  name: string;
  student_school_id?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface ImportResult {
  successful: Student[];
  failed: { row: Record<string, string | number | boolean | null>; error: string }[];
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error('API returned success but no data was received.');
  }
  return response.data;
}

export async function getStudents(): Promise<ServerActionResponse<Student[]>> {
  return await fetcher<Student[]>('/students', {
    cache: 'no-store'
  });
}

export async function getStudent(id: string): Promise<ServerActionResponse<Student>> {
  return await fetcher<Student>(`/students/${id}`, {
    cache: 'no-store'
  });
}

export async function createStudent(data: CreateStudentData): Promise<Student> {
  const response = await fetcher<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const newStudent = handleMutationResponse(response);
  revalidatePath('/dashboard/students');
  return newStudent;
}

export async function updateStudent(
  id: string,
  data: Partial<CreateStudentData>
): Promise<Student> {
  const response = await fetcher<Student>(`/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  const updatedStudent = handleMutationResponse(response);
  revalidatePath('/dashboard/students');
  revalidatePath(`/dashboard/students/${id}`);
  return updatedStudent;
}

export async function deleteStudent(id: string): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(`/students/${id}`, {
    method: 'DELETE',
  });

  const deleteMessage = handleMutationResponse(response);
  revalidatePath('/dashboard/students');
  return deleteMessage;
}

/**
 * Server Action to import students from a CSV file.
 * @param classId The ID of the class to associate students with (currently unused but good for future use).
 * @param formData The FormData containing the file.
 */
export async function importStudentsFromFile(
  classId: string,
  formData: FormData,
): Promise<ServerActionResponse<ImportResult>> {
  try {
    const response = await fetcher<ImportResult>('/students/import', {
      method: 'POST',
      body: formData,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/classes/${classId}`);
    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred during import.';
    return { data: null, error: { message } };
  }
}
