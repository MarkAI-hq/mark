'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface ApplyPayload {
  school_code: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  country?: string
  education_level?: string
  motivation?: string
  goals?: string
}

export interface ApplyResult {
  message: string
  application_id: string
}

export interface ApplicationRecord {
  id: string
  org_id: string
  school_code: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  country: string | null
  education_level: string | null
  motivation: string | null
  goals: string | null
  ai_summary: string | null
  ai_fit_category: 'strong_fit' | 'borderline' | 'non_traditional' | null
  status: 'pending' | 'approved' | 'declined' | 'more_info'
  review_note: string | null
  student_id: string | null
  student_id_pdf_url: string | null
  createdAt: string
}

export interface PendingApplicationsResult {
  applications: ApplicationRecord[]
  total: number
}

export async function applyToSchool(
  payload: ApplyPayload,
): Promise<ServerActionResponse<ApplyResult>> {
  return fetcher<ApplyResult>('/admissions/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getPendingApplications(
  page = 1,
  limit = 20,
): Promise<ServerActionResponse<PendingApplicationsResult>> {
  return fetcher<PendingApplicationsResult>(
    `/admissions/pending?page=${page}&limit=${limit}`,
    { cache: 'no-store' },
  )
}

export async function approveApplication(
  applicationId: string,
): Promise<ServerActionResponse<{ message: string; student_id: string }>> {
  return fetcher(`/admissions/${applicationId}/approve`, { method: 'POST' })
}

export async function declineApplication(
  applicationId: string,
  reason?: string,
): Promise<ServerActionResponse<{ message: string }>> {
  return fetcher(`/admissions/${applicationId}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
