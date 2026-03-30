'use server'

// src/lib/actions/subscriptions.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export type PlanTier   = 'free' | 'pro' | 'enterprise'
export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'inactive'

// Re-export from billing-utils so consumers only need one import
export type { BillingRegion } from '@/lib/billing-utils'

export interface Subscription {
  subscription_id:        string
  organization_id:        string
  plan:                   PlanTier
  status:                 PlanStatus
  trial_ends_at:          string | null
  current_period_start:   string | null
  current_period_end:     string | null
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  student_count:          number
  monthly_grading_count:  number
  cancelled_at:           string | null
  is_trialing:            boolean
  limits: {
    students:        number
    monthlyGradings: number
    aiGrading:       boolean
    reports:         boolean
    watermark:       boolean
  }
  createdAt: string
  updatedAt: string
}

export interface GradingQuota {
  plan:      PlanTier
  limit:     number | null
  used:      number | null
  remaining: number | null
  unlimited: boolean
  resets_at: string | null
}

export interface CheckoutResponse {
  url:        string
  session_id: string
}

export interface PortalResponse {
  url: string
}

export async function getSubscription(): Promise<ServerActionResponse<Subscription>> {
  return fetcher<Subscription>('/subscriptions', { cache: 'no-store' })
}

export async function getGradingQuota(): Promise<ServerActionResponse<GradingQuota>> {
  return fetcher<GradingQuota>('/subscriptions/grading-quota', { cache: 'no-store' })
}

export async function initializePayment(
  plan:     'pro' | 'enterprise',
  interval: 'monthly' | 'annual',
  region:   'global' | 'east_africa',
): Promise<ServerActionResponse<CheckoutResponse>> {
  try {
    const response = await fetcher<CheckoutResponse>('/subscriptions/initialize', {
      method: 'POST',
      body:   JSON.stringify({ plan, interval, region }),
    })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to start checkout.' },
    }
  }
}

export async function createPortalSession(): Promise<ServerActionResponse<PortalResponse>> {
  try {
    const response = await fetcher<PortalResponse>('/subscriptions/portal', {
      method: 'POST',
    })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to open billing portal.' },
    }
  }
}