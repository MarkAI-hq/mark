// src/lib/actions/enrollments.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface Enrollment {
  enrollment_id: string;
  class_id: string;
  student_id: string;
  enrollment_date: string;
  status: string;
}

// FIXED: This interface now accurately reflects the data returned by the
// `getClassStudents` method in the NestJS service.
export interface EnrolledStudent {
  enrollment_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  enrollment_date: string;
  status: string;
  notes: string | null;
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

export async function enrollStudentInClass(
  classId: string,
  studentId: string,
): Promise<Enrollment> {
  const response = await fetcher<Enrollment>(
    `/enrollments/classes/${classId}/students`,
    {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    },
  );

  const newEnrollment = handleMutationResponse(response);
  revalidatePath(`/dashboard/classes/${classId}`);
  return newEnrollment;
}

export async function getEnrolledStudents(
  classId: string,
): Promise<ServerActionResponse<EnrolledStudent[]>> {
  return await fetcher<EnrolledStudent[]>(`/enrollments/classes/${classId}/students`, {
    cache: 'no-store',
  });
}

/**
 * Removes a student's enrollment from a class.
 * Calls the DELETE /enrollments/classes/:classId/students/:studentId endpoint.
 */
export async function removeStudentFromClass(
  classId: string,
  studentId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/enrollments/classes/${classId}/students/${studentId}`,
    {
      method: 'DELETE',
    },
  );

  const deleteMessage = handleMutationResponse(response);
  revalidatePath(`/dashboard/classes/${classId}`);
  return deleteMessage;
}
