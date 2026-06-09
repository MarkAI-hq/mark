'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface SelfEnrollPayload {
  school_code: string
  first_name: string
  last_name: string
  email?: string
  guardian_name?: string
  guardian_phone?: string
  ref?: string
}

export interface SelfEnrollResult {
  student_id: string
  name: string
  pin: string
  school_name: string
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
