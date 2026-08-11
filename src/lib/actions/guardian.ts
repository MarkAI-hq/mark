'use server'

// src/lib/actions/guardian.ts
// Authenticated guardian-portal actions — the guardian has a real account
// (Role.PARENT / 'Reviewer'), unlike the tokenized /pay/[token] flow in
// term-billing.ts. See mark-api/src/modules/guardian for the backend.

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface GuardianChild {
  student_id: string
  first_name: string
  last_name: string
  profile_image_url: string | null
  student_school_id: string | null
  class_name: string | null
  organization_name: string | null
}

export async function getMyChildren(): Promise<
  ServerActionResponse<GuardianChild[]>
> {
  return fetcher<GuardianChild[]>('/guardian/children', { cache: 'no-store' })
}

export interface GuardianChildOverview {
  submissions: Array<{
    submission_id: string
    subject: string
    title: string
    total_score: number | null
    max_score: number | null
    graded_at: string | null
    submitted_at: string | null
  }>
  mastery: Array<{
    id: string
    subject: string
    topic: string
    achieved_count: number
    attempted_count: number
    last_attempted_at: string | null
  }>
  lessons: Array<{
    id: string
    subject: string
    topic: string
    lesson_type: string
    score_after: number | null
    completed_at: string | null
  }>
  attendance: {
    student_id: string
    class_id: string | null
    total_sessions: number
    present_count: number
    absent_count: number
    late_count: number
    excused_count: number
    attendance_rate: number | null
  }
  organization_name: string | null
}

export async function getChildOverview(
  studentId: string,
): Promise<ServerActionResponse<GuardianChildOverview>> {
  return fetcher<GuardianChildOverview>(
    `/guardian/children/${studentId}/overview`,
    { cache: 'no-store' },
  )
}

export type GuardianChildBilling =
  | { on_plan: false }
  | {
      on_plan: true
      status: string
      second_installment_deadline: string | null
      billing_guardian_name: string | null
      payment_url: string
    }

export async function getChildBillingStatus(
  studentId: string,
): Promise<ServerActionResponse<GuardianChildBilling>> {
  return fetcher<GuardianChildBilling>(
    `/guardian/children/${studentId}/billing`,
    { cache: 'no-store' },
  )
}

export interface GuardianNotificationPreferences {
  enrollment?: boolean
  certificate?: boolean
  streak_at_risk?: boolean
  exam_registration?: boolean
}

export async function getNotificationPreferences(
  studentId: string,
): Promise<ServerActionResponse<GuardianNotificationPreferences>> {
  return fetcher<GuardianNotificationPreferences>(
    `/guardian/children/${studentId}/notification-preferences`,
    { cache: 'no-store' },
  )
}

export async function updateNotificationPreferences(
  studentId: string,
  prefs: GuardianNotificationPreferences,
): Promise<ServerActionResponse<GuardianNotificationPreferences>> {
  return fetcher<GuardianNotificationPreferences>(
    `/guardian/children/${studentId}/notification-preferences`,
    { method: 'PATCH', body: JSON.stringify(prefs), cache: 'no-store' },
  )
}

// ── Invitation acceptance (public — no session yet) ─────────────────────────

export interface PeekGuardianInvitation {
  email: string
  organizationName: string
  requiresSignup: boolean
}

export async function peekGuardianInvitation(
  token: string,
): Promise<ServerActionResponse<PeekGuardianInvitation>> {
  return fetcher<PeekGuardianInvitation>(`/auth/guardian-invitation/${token}`, {
    cache: 'no-store',
  })
}

export interface AcceptGuardianInvitationPayload {
  token: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  acceptTerms?: boolean
}

export async function acceptGuardianInvitation(
  payload: AcceptGuardianInvitationPayload,
): Promise<ServerActionResponse<{ message: string; requiresLogin?: boolean }>> {
  return fetcher<{ message: string; requiresLogin?: boolean }>(
    '/auth/accept-guardian-invitation',
    { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' },
  )
}
