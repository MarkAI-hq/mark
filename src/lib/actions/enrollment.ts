'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface SelfEnrollPayload {
  school_code: string
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
  guardian_name?: string
  guardian_phone?: string
  ref?: string
  education_level?: string
}

// Self-enrol no longer returns a session/PIN. Email → an OTP is sent to type back
// (verifyEnrolOtp). WhatsApp → a wa.me link the student messages us from; the
// browser polls checkEnrolStatus then completes via completeWhatsappEnrol.
export interface SelfEnrollResult {
  pending_verification: true
  student_id: string
  student_school_id: string
  school_code: string
  name: string
  school_name: string
  channel: 'email' | 'whatsapp'
  contact?: string
  verify_id?: string
  wa_link?: string
}

export async function checkEnrolStatus(
  verifyId: string,
): Promise<ServerActionResponse<{ status: string }>> {
  return fetcher(`/students/self-enroll/status?verify_id=${verifyId}`, {
    cache: 'no-store',
  })
}

export interface RegisterSchoolPayload {
  school_name: string
  country_code: string
  education_system?: string
  director_first_name: string
  director_last_name: string
  director_email: string
  director_password: string
  phone?: string
}

export interface RegisterSchoolResult {
  message: string
  school_name: string
  director_email: string
  organization_id: string
}

export interface PublicSchool {
  organization_id: string
  name: string
  school_code: string
  country_code: string
  education_system: string | null
  partner_config: {
    logo_url?: string
    primary_color?: string
    cert_price_usd?: number
    cert_price_ea_usd?: number
  } | null
  is_verified: boolean
}

export async function selfEnroll(
  payload: SelfEnrollPayload,
): Promise<ServerActionResponse<SelfEnrollResult>> {
  return fetcher<SelfEnrollResult>('/students/self-enroll', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function registerSchool(
  payload: RegisterSchoolPayload,
): Promise<ServerActionResponse<RegisterSchoolResult>> {
  return fetcher<RegisterSchoolResult>('/organizations/register-school', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listPublicSchools(
  page = 1,
  limit = 20,
): Promise<
  ServerActionResponse<{ schools: PublicSchool[]; page: number; limit: number }>
> {
  return fetcher(`/organizations/public/list?page=${page}&limit=${limit}`, {
    cache: 'no-store',
  })
}

export async function getPublicSchoolProfile(
  schoolCode: string,
): Promise<ServerActionResponse<PublicSchool & { student_count: number }>> {
  return fetcher(`/organizations/public/${schoolCode}`, {
    cache: 'no-store',
  })
}
