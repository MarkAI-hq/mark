'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface CertificateEligibility {
  eligible: boolean
  score: number
  threshold: number
}

export interface Certificate {
  certificate_id: string
  certificate_title: string
  issued_at: string | null
  status: 'pending' | 'paid' | 'issued' | 'revoked'
  verification_code: string | null
  pdf_url: string | null
  assessment_id: string
  org_id: string | null
}

export interface PublicCertificate {
  certificate_id: string
  verification_code: string | null
  issued_at: string | null
  grade_level: string | null
  student_name: string
  subject_name: string
  school_name: string
  school_logo_url: string | null
  score: number
  download_url: string | null
  is_valid: boolean
}

export interface CertificateCheckoutResponse {
  url: string
  certificate_id: string
}

export async function getCertificateEligibility(
  assessmentId: string,
): Promise<ServerActionResponse<CertificateEligibility>> {
  return fetcher<CertificateEligibility>(`/certificates/eligibility/${assessmentId}`)
}

export async function requestCertificate(
  assessmentId: string,
  region?: 'global' | 'east_africa',
): Promise<ServerActionResponse<CertificateCheckoutResponse>> {
  return fetcher<CertificateCheckoutResponse>('/certificates/request', {
    method: 'POST',
    body: JSON.stringify({ assessment_id: assessmentId, region }),
  })
}

export async function getMyCertificates(): Promise<
  ServerActionResponse<Certificate[]>
> {
  return fetcher<Certificate[]>('/certificates/my')
}

export async function getOrgCertificates(): Promise<
  ServerActionResponse<Certificate[]>
> {
  return fetcher<Certificate[]>('/certificates/org')
}

export async function getPublicCertificate(
  verificationCode: string,
): Promise<ServerActionResponse<PublicCertificate>> {
  return fetcher<PublicCertificate>(`/certificates/${verificationCode}`, {
    cache: 'no-store',
  })
}
