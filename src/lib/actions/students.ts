// src/lib/actions/students.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Student, ServerActionResponse } from '@/lib/types'

export interface CreateStudentData {
  guardian_name?:     string
  guardian_phone?:    string
  guardian_email?:    string
  name:               string
  student_school_id?: string
  date_of_birth?:     string
  gender?:            string
}

export interface ImportResult {
  successful: Student[]
  failed: { row: Record<string, string | number | boolean | null>; error: string }[]
}

export interface ResetPinResult {
  student_id:        string
  name:              string
  student_school_id: string | null
  pin:               string
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) throw new Error(response.error.message)
  if (response.data === null || response.data === undefined)
    throw new Error('API returned success but no data was received.')
  return response.data
}

export async function getStudents(): Promise<ServerActionResponse<Student[]>> {
  return fetcher<Student[]>('/students', { cache: 'no-store' })
}

// ── Marketplace self-enrollment approval queue (WS4) ────────────────────────

export interface PendingStudent {
  student_id: string
  student_school_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  education_level: string | null
  elective_subjects: string[] | null
  requested_class_id: string | null
  requested_class_name: string | null
  requested_at: string
  admission_fee_status: 'unpaid' | 'pending' | 'paid' | 'failed'
}

export async function getPendingStudents(): Promise<
  ServerActionResponse<PendingStudent[]>
> {
  return fetcher<PendingStudent[]>('/students/pending', { cache: 'no-store' })
}

export async function approvePendingStudent(
  id: string,
): Promise<ServerActionResponse<{ approved: true }>> {
  const res = await fetcher<{ approved: true }>(`/students/${id}/approve`, {
    method: 'POST',
  })
  if (!res.error) revalidatePath('/dashboard/students/pending')
  return res
}

export async function declinePendingStudent(
  id: string,
  reason?: string,
): Promise<ServerActionResponse<{ declined: true }>> {
  const res = await fetcher<{ declined: true }>(`/students/${id}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  if (!res.error) revalidatePath('/dashboard/students/pending')
  return res
}

// Stop-gap for when MarzPay itself is unavailable — lets an admin who has
// confirmed payment through another channel (bank transfer, cash, mobile
// money confirmed by phone) mark the admission fee paid directly.
export async function markAdmissionFeePaid(
  id: string,
  note: string,
): Promise<ServerActionResponse<{ status: string; amount: number; paid_at: string | null }>> {
  const res = await fetcher<{ status: string; amount: number; paid_at: string | null }>(
    `/students/${id}/admission-fee/mark-paid`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
  )
  if (!res.error) revalidatePath('/dashboard/students/pending')
  return res
}

export async function getStudent(id: string): Promise<ServerActionResponse<Student>> {
  return fetcher<Student>(`/students/${id}`, { cache: 'no-store' })
}

export async function createStudent(data: CreateStudentData, photo?: File): Promise<Student> {
  const formData = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, String(v)) })
  if (photo) formData.append('photo', photo)
  const response    = await fetcher<Student>('/students', { method: 'POST', body: formData })
  const newStudent  = handleMutationResponse(response)
  revalidatePath('/dashboard/students')
  return newStudent
}

export async function updateStudent(
  id:    string,
  data:  Partial<CreateStudentData>,
  photo?: File,
): Promise<Student> {
  const formData = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, String(v)) })
  if (photo) formData.append('photo', photo)
  const response       = await fetcher<Student>(`/students/${id}`, { method: 'PATCH', body: formData })
  const updatedStudent = handleMutationResponse(response)
  revalidatePath('/dashboard/students')
  revalidatePath(`/dashboard/students/${id}`)
  return updatedStudent
}

export async function deleteStudent(id: string): Promise<{ message: string }> {
  const response      = await fetcher<{ message: string }>(`/students/${id}`, { method: 'DELETE' })
  const deleteMessage = handleMutationResponse(response)
  revalidatePath('/dashboard/students')
  return deleteMessage
}

export async function resetStudentPin(studentId: string): Promise<ResetPinResult> {
  const response = await fetcher<ResetPinResult>(`/students/${studentId}/reset-pin`, { method: 'POST' })
  return handleMutationResponse(response)
}

export async function importStudentsFromFile(
  classId:  string,
  formData: FormData,
): Promise<ServerActionResponse<ImportResult>> {
  try {
    const response = await fetcher<ImportResult>('/students/import', { method: 'POST', body: formData })
    if (response.error) throw new Error(response.error.message)
    revalidatePath('/dashboard/students')
    revalidatePath(`/dashboard/classes/${classId}`)
    return { data: response.data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred during import.'
    return { data: null, error: { message } }
  }
}