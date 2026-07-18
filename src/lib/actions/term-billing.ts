'use server'

// src/lib/actions/term-billing.ts
// Guardian-facing term-billing actions — the payer is a parent/guardian who
// never logs in, authorized purely by the unguessable token in the payment
// link (mirrors the whatsapp click-to-chat verification pattern). See
// mark-api/src/modules/term-billing for the backend.

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface TermInstallment {
  number: number
  status: string
  paid_at: string | null
}

export interface GuardianPlanView {
  plan_id: string
  student_first_name: string
  school_name: string
  status: string
  amount_ugx: number
  installment_due: 1 | 2 | null
  installment_amount_ugx: number
  second_installment_deadline: string | null
  installments: TermInstallment[]
}

export async function getGuardianPlan(
  token: string,
): Promise<ServerActionResponse<GuardianPlanView>> {
  return fetcher<GuardianPlanView>(`/term-billing/guardian/${token}`, {
    cache: 'no-store',
  })
}

export interface InitiateInstallmentResult {
  payment_url: string
  amount: number
  status: string
  installment: 1 | 2
}

export async function initiateInstallmentPayment(
  token: string,
): Promise<ServerActionResponse<InitiateInstallmentResult>> {
  return fetcher<InitiateInstallmentResult>(
    `/term-billing/guardian/${token}/initiate`,
    { method: 'POST', cache: 'no-store' },
  )
}

export async function getGuardianPaymentStatus(
  token: string,
): Promise<ServerActionResponse<GuardianPlanView>> {
  return fetcher<GuardianPlanView>(`/term-billing/guardian/${token}/status`, {
    cache: 'no-store',
  })
}

// ── Student-facing (authenticated) ──────────────────────────────────────────

export type TermBillingStatus =
  | { on_plan: false }
  | {
      on_plan: true
      status: string
      second_installment_deadline: string | null
      billing_guardian_name: string | null
    }

export async function getMyTermBillingStatus(): Promise<
  ServerActionResponse<TermBillingStatus>
> {
  return fetcher<TermBillingStatus>('/term-billing/me', { cache: 'no-store' })
}

export async function resendGuardianLink(): Promise<
  ServerActionResponse<{ sent: boolean; reason?: string }>
> {
  return fetcher<{ sent: boolean; reason?: string }>(
    '/term-billing/me/send-guardian-link',
    { method: 'POST', cache: 'no-store' },
  )
}

// ── Admin-facing (org-scoped) ────────────────────────────────────────────────

export interface AdminTermBillingRow {
  plan_id: string
  student_id: string
  first_name: string
  last_name: string
  status: string
  amount_ugx: number
  second_installment_deadline: string | null
}

export async function listTermBillingAdmin(): Promise<
  ServerActionResponse<AdminTermBillingRow[]>
> {
  return fetcher<AdminTermBillingRow[]>('/term-billing/admin/students', {
    cache: 'no-store',
  })
}

export interface AdminTermBillingPlan {
  id: string
  student_id: string
  organization_id: string | null
  billing_guardian_id: string | null
  term_label: string | null
  amount_usd: number
  amount_ugx: number
  second_installment_deadline: string | null
  status: string
  access_token: string
}

export interface AdminTermInstallmentPayment {
  id: string
  term_billing_plan_id: string
  installment_number: number
  reference: string
  amount: number
  status: string
  paid_at: string | null
  refunded_at: string | null
  refund_reason: string | null
}

export async function getTermBillingDetailAdmin(
  planId: string,
): Promise<
  ServerActionResponse<{
    plan: AdminTermBillingPlan
    payments: AdminTermInstallmentPayment[]
  }>
> {
  return fetcher(`/term-billing/admin/students/${planId}`, { cache: 'no-store' })
}

export async function overrideTermBillingPlan(
  planId: string,
  status: 'active' | 'completed' | 'locked' | 'cancelled',
  note?: string,
): Promise<ServerActionResponse<{ ok: boolean }>> {
  return fetcher<{ ok: boolean }>(`/term-billing/admin/students/${planId}/override`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
    cache: 'no-store',
  })
}

export async function refundTermInstallment(
  paymentId: string,
  reason?: string,
): Promise<ServerActionResponse<{ ok: boolean }>> {
  return fetcher<{ ok: boolean }>(`/term-billing/admin/payments/${paymentId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    cache: 'no-store',
  })
}
